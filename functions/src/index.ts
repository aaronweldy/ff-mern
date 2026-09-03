import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  ESPNResponse,
  FullNflTeam,
  NFLSchedule,
  playerTeamIsNflAbbreviation,
  ProjectedPlayer,
  sanitizePlayerName,
  ScrapedADPData,
  singlePositionTypes,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
  Week,
} from "@ff-mern/ff-types";
import { load } from "cheerio";
import admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/scheduler";

admin.initializeApp();
const db = admin.firestore();

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const CHECKPOINT_COLLECTION = "fetchCheckpoints";
const IDEMPOTENCY_WINDOW_MS = 20 * 60 * 60 * 1000; // 20h for daily jobs

/**
 * Sleep helper for backoff / rate-limit delays.
 * @param {number} ms Milliseconds to sleep.
 * @return {Promise<void>}
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validate SERVER_URL env var.
 * @return {string|null} Normalized URL or null when invalid/missing.
 */
export const getServerUrl = (): string | null => {
  const raw = process.env.SERVER_URL?.trim();
  if (!raw) {
    console.error("SERVER_URL env var is missing. Skipping backend call.");
    return null;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    // Strip trailing slashes for consistent URL building.
    return raw.replace(/\/+$/, "");
  } catch (err) {
    console.error(`SERVER_URL env var is invalid ("${raw}"):`, err);
    return null;
  }
};

/**
 * Fetch with exponential backoff retry.
 * @param {string} url URL to fetch.
 * @param {RequestInit} init Fetch options.
 * @param {number} retries Max attempts.
 * @param {number} backoffMs Initial backoff delay.
 * @return {Promise<Response>} Fetch response.
 */
export const fetchWithRetry = async (
  url: string,
  init: RequestInit = {},
  retries: number = MAX_RETRIES,
  backoffMs: number = INITIAL_BACKOFF_MS
): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === retries) {
        break;
      }
      const delay = backoffMs * 2 ** (attempt - 1);
      console.warn(
        `Fetch attempt ${attempt}/${retries} for ${url} failed: ${err}. ` +
          `Retrying in ${delay}ms.`
      );
      await sleep(delay);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Fetch failed for ${url}: ${String(lastError)}`);
};

/**
 * Fetch a page's HTML with retry.
 * @param {string} url URL to fetch.
 * @return {Promise<string>} Raw HTML.
 */
export const fetchHtmlWithRetry = async (url: string): Promise<string> => {
  const response = await fetchWithRetry(
    url,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; orca-ff-functions/1.0; +https://firebase.google.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    },
    MAX_RETRIES,
    INITIAL_BACKOFF_MS
  );
  return response.text();
};

/**
 * Parse all HTML tables into row-object arrays (tabletojson-compatible shape).
 * @param {string} html Raw HTML.
 * @return {Array<Array<Record<string, string>>>} One entry per table.
 */
export const parseHtmlTables = (
  html: string
): Array<Array<Record<string, string>>> => {
  const $ = load(html);
  const tables: Array<Array<Record<string, string>>> = [];

  $("table").each((_, table) => {
    const $table = $(table);
    // Prefer an explicit thead row, otherwise treat the first row as header.
    const $headerRow =
      $table.find("thead tr").first().length > 0
        ? $table.find("thead tr").first()
        : $table.find("tr").first();
    const headers: string[] = [];
    $headerRow.find("th, td").each((index, cell) => {
      const text = $(cell).text().trim().replace(/\s+/g, " ");
      headers.push(text === "" ? String(index) : text);
    });
    if (headers.length === 0) {
      return;
    }
    const rows: Array<Record<string, string>> = [];
    // All body rows except the header row itself.
    $table
      .find("tr")
      .not($headerRow)
      .each((__, row) => {
        const $cells = $(row).find("td, th");
        if ($cells.length === 0) {
          return;
        }
        const record: Record<string, string> = {};
        $cells.each((cellIndex, cell) => {
          const key = headers[cellIndex] ?? String(cellIndex);
          record[key] = $(cell).text().trim().replace(/\s+/g, " ");
        });
        // Skip fully-empty rows.
        if (Object.values(record).some((v) => v !== "")) {
          rows.push(record);
        }
      });
    tables.push(rows);
  });

  return tables;
};

/**
 * Retrieve a web page and extract all tables from the HTML.
 * Uses native fetch + cheerio (replaces request/x-ray/tabletojson).
 * @param {string} url The URL of the page to retrieve.
 * @return {Promise<Array<Array<Record<string, string>>>>} Table data.
 */
export const get = async (
  url: string
): Promise<Array<Array<Record<string, string>>>> => {
  const html = await fetchHtmlWithRetry(url);
  return parseHtmlTables(html);
};

/**
 * Check whether a daily job already ran within the idempotency window.
 * @param {string} docId Checkpoint document id.
 * @return {Promise<boolean>} True when the job should be skipped.
 */
export const hasFetchedRecently = async (docId: string): Promise<boolean> => {
  try {
    const snap = await db.collection(CHECKPOINT_COLLECTION).doc(docId).get();
    if (!snap.exists) {
      return false;
    }
    const lastFetched = snap.get("lastFetched");
    if (!lastFetched) {
      return false;
    }
    const lastDate: Date =
      typeof lastFetched.toDate === "function"
        ? lastFetched.toDate()
        : new Date(lastFetched);
    if (isNaN(lastDate.getTime())) {
      return false;
    }
    return Date.now() - lastDate.getTime() < IDEMPOTENCY_WINDOW_MS;
  } catch (err) {
    // Fail open: a checkpoint read failure should not block the fetch.
    console.warn(`Checkpoint read for "${docId}" failed, continuing:`, err);
    return false;
  }
};

/**
 * Record a successful fetch in Firestore for idempotency.
 * @param {string} docId Checkpoint document id.
 * @return {Promise<void>}
 */
export const markFetched = async (docId: string): Promise<void> => {
  await db
    .collection(CHECKPOINT_COLLECTION)
    .doc(docId)
    .set(
      {
        lastFetched: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
};

type NFLTeamDefenseData = {
  Team: string;
  Rnk: string;
  "Fan Pts Agnst": string;
};

const fetchTeamDefensePerformance = async () => {
  const updateData: TeamFantasyPositionPerformance =
    {} as TeamFantasyPositionPerformance;

  const positions = [
    { pos: "QB", nflPosition: 1 },
    { pos: "RB", nflPosition: 2 },
    { pos: "WR", nflPosition: 3 },
    { pos: "TE", nflPosition: 4 },
    { pos: "K", nflPosition: 7 },
  ] as const;

  for (const { pos, nflPosition } of positions) {
    try {
      const url =
        `https://fantasy.nfl.com/research/pointsagainst?position=${nflPosition}` +
        `&statCategory=stats&statSeason=2024&statType=seasonStats`;
      const data = await get(url);

      if (data[0]) {
        (data[0] as NFLTeamDefenseData[]).forEach(
          (teamData: NFLTeamDefenseData) => {
            if (teamData.Team && teamData.Rnk) {
              const defenseIndex = teamData.Team.toLowerCase().indexOf(
                " defense"
              );
              const teamName = teamData.Team.slice(0, defenseIndex)
                .toLowerCase() as FullNflTeam;

              if (!updateData[teamName]) {
                updateData[teamName] = {
                  QB: 0,
                  RB: 0,
                  WR: 0,
                  TE: 0,
                  K: 0,
                };
              }

              updateData[teamName][pos] = parseInt(teamData.Rnk);
            }
          }
        );
      }
    } catch (err) {
      console.error(`Failed to fetch defense-vs-position for ${pos}:`, err);
    }
  }

  await db.collection("nflDefenseVsPositionStats").doc("dist").set(updateData);
};

const parsePlayerFromScrapedData = (playerString: string) => {
  const playerSegments = playerString.split(" ");
  const [player, team, byeWeek] = [
    playerSegments.slice(0, -2).join(" "),
    playerSegments.slice(-2, -1)[0],
    playerSegments.slice(-1)[0].slice(1, -1) as Week,
  ];
  if (!player) {
    return null;
  }
  // Unsigned players don't have a team/bye week, so parsing needs updating.
  let resolvedTeam = team;
  let resolvedByeWeek = byeWeek;
  let resolvedPlayer = player;
  if (!playerTeamIsNflAbbreviation(resolvedTeam)) {
    resolvedTeam = "None";
    resolvedByeWeek = "1" as Week;
    resolvedPlayer = playerSegments.join(" ");
  }
  return {
    player: resolvedPlayer,
    team: resolvedTeam,
    byeWeek: resolvedByeWeek,
  };
};

async function fetchAndParseESPNSchedule(
  schedule: NFLSchedule,
  week: number
): Promise<void> {
  const url =
    `http://site.api.espn.com/apis/site/v2/sports/football/nfl/` +
    `scoreboard?seasontype=2&week=${week}`;

  try {
    const response = await fetchWithRetry(url);
    const data: ESPNResponse = (await response.json()) as ESPNResponse;

    for (const event of data.events) {
      const gameTime = new Date(event.date);

      for (const competitor of event.competitions[0].competitors) {
        const teamName = competitor.team.displayName.toLowerCase();
        const isHome = competitor.homeAway === "home";
        const opponent = event.competitions[0].competitors
          .find((c) => c.id !== competitor.id)
          ?.team.displayName.toLowerCase();

        if (!opponent) {
          console.error(`No opponent found for ${teamName} in week ${week}`);
          continue;
        }

        if (!schedule[teamName]) {
          schedule[teamName] = {};
        }

        schedule[teamName][data.week.number] = {
          opponent,
          isHome,
          gameTime: gameTime.toISOString(),
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching data for week ${week}:`, error);
  }
}

async function updateFirebase(schedule: NFLSchedule): Promise<void> {
  const scheduleRef = db.collection("nflSchedule");

  for (const [team, games] of Object.entries(schedule)) {
    await scheduleRef.doc(team).set(games);
  }

  console.log("Firebase updated successfully");
}

async function updateScheduleForAllWeeks(
  startWeek: number,
  endWeek: number
): Promise<void> {
  const schedule: NFLSchedule = {} as NFLSchedule;
  for (let week = startWeek; week <= endWeek; week++) {
    console.log(`Processing week ${week}...`);

    await fetchAndParseESPNSchedule(schedule, week);

    // Add a delay to avoid rate limiting
    await sleep(1000);
    console.log(schedule);
  }
  if (schedule && Object.keys(schedule).length > 0) {
    await updateFirebase(schedule);
  }
}

const fetchSeasonProjections = async () => {
  const playerAvgAdp: Record<string, number> = {};
  const overallUrl = "https://www.fantasypros.com/nfl/adp/overall.php";
  const overallTables = await get(overallUrl);
  const overallData = (overallTables[0] ?? []) as {
    "Player Team (Bye)": string;
    AVG: string;
  }[];
  for (const data of overallData) {
    if (!data["Player Team (Bye)"]) {
      continue;
    }
    const parsedData = parsePlayerFromScrapedData(data["Player Team (Bye)"]);
    if (!parsedData) {
      continue;
    }
    const { player } = parsedData;
    playerAvgAdp[player] = parseFloat(data.AVG);
  }
  for (const pos of singlePositionTypes) {
    try {
      const url = `https://www.fantasypros.com/nfl/adp/${pos.toLowerCase()}.php`;
      const tables = await get(url);
      const data = (tables[0] ?? []) as ScrapedADPData[];
      for (const playerData of data) {
        if (playerData["Player Team (Bye)"]) {
          const parsedData = parsePlayerFromScrapedData(
            playerData["Player Team (Bye)"]
          );
          if (parsedData) {
            const { player, team, byeWeek } = parsedData;
            const dbData: ProjectedPlayer = {
              fullName: player,
              sanitizedName: sanitizePlayerName(player),
              overall: parseInt(playerData.Overall) || 500,
              positionRank: `${pos}${playerData[pos]}`,
              team: (team as AbbreviatedNflTeam) ?? "None",
              byeWeek: byeWeek ?? "1",
              position: pos,
              average: playerAvgAdp[player] || 500,
            };
            await db.collection("playerADP").doc(player).set({ ...dbData });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ADP for position ${pos}:`, err);
    }
  }
};

export const fetchRankings = onSchedule("every day 00:00", async () => {
  if (await hasFetchedRecently("fetchRankings")) {
    console.log("fetchRankings already ran recently, skipping (idempotent).");
    return;
  }
  try {
    await fetchTeamDefensePerformance();
  } catch (err) {
    console.error("fetchTeamDefensePerformance failed:", err);
  }
  try {
    await fetchSeasonProjections();
  } catch (err) {
    console.error("fetchSeasonProjections failed:", err);
    return;
  }
  await markFetched("fetchRankings");
});

export const fetchNflSchedule = onSchedule("every day 00:00", async () => {
  if (await hasFetchedRecently("fetchNflSchedule")) {
    console.log("fetchNflSchedule already ran recently, skipping (idempotent).");
    return;
  }
  await updateScheduleForAllWeeks(1, 18);
  try {
    const url = "http://www.espn.com/nfl/schedulegrid/_/";
    const tables = await get(url);
    const data = (tables[0] ?? []) as unknown as Record<
      Week | "0",
      AbbreviatedNflTeam | "WSH"
    >[];
    // Skip checkpoint update when scrape returns nothing (page blocked/empty).
    if (data.length === 0) {
      console.warn("ESPN schedulegrid returned no tables, skipping update.");
      return;
    }
    const dbUpdate: TeamToSchedule = {} as TeamToSchedule;
    for (let i = 2; i < data.length; i++) {
      dbUpdate[AbbreviationToFullTeam[data[i]["0"]]] = data[i] as Record<
        Week | "0",
        AbbreviatedNflTeam
      >;
    }
    await db.collection("nflTeamSchedules").doc("dist").set(dbUpdate);
    await markFetched("fetchNflSchedule");
  } catch (err) {
    console.error("Failed to fetch ESPN schedulegrid:", err);
  }
});

export const runScoresForAllLeagues = onSchedule(
  "0 2,22 * * *",
  async () => {
    const serverUrl = getServerUrl();
    if (!serverUrl) {
      return;
    }
    let latestWeek = "1";
    try {
      latestWeek = (await getWeekFromPuppeteer()) || "1";
    } catch (err) {
      console.error("Failed to determine latest week, defaulting to 1:", err);
    }
    let allLeagues;
    try {
      allLeagues = await db.collection("leagues").get();
    } catch (err) {
      console.error("Failed to list leagues, aborting runScores:", err);
      return;
    }
    if (allLeagues.empty) {
      console.log("No leagues found, nothing to score.");
      return;
    }
    for (const league of allLeagues.docs) {
      const leagueId = league.id;
      const url = `${serverUrl}/api/v1/league/${leagueId}/runScores/`;
      console.log("fetching league at url: ", url);
      const body = { week: parseInt(latestWeek) || 1 };
      try {
        const response = await fetchWithRetry(
          url,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
          },
          MAX_RETRIES,
          INITIAL_BACKOFF_MS
        );
        console.log(`runScores succeeded for league ${leagueId}: ${response.status}`);
      } catch (err) {
        // Backend downtime or persistent failure: log and continue.
        console.error(
          `runScores failed for league ${leagueId} after ${MAX_RETRIES} ` +
            `attempts (backend may be down), continuing:`,
          err
        );
        continue;
      }
      // Small delay to avoid hammering the backend when many leagues exist.
      await sleep(500);
    }
  }
);

const getWeekFromPuppeteer = async (): Promise<string | null> => {
  try {
    const html = await fetchHtmlWithRetry(
      "https://www.fantasypros.com/nfl/stats/qb.php?range=week"
    );
    const $ = load(html);
    return $("#single-week").attr("value") ?? null;
  } catch (err) {
    console.error("Failed to fetch latest scored week:", err);
    return null;
  }
};

export const fetchLatestFantasyProsScoredWeek = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    try {
      const week = await getWeekFromPuppeteer();
      res.status(200).json({ week: parseInt(week || "1") });
    } catch (err) {
      console.error("fetchLatestFantasyProsScoredWeek failed:", err);
      res.status(500).json({ error: "Failed to fetch latest week" });
    }
  }
);
