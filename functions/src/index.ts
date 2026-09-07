import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  ESPNResponse,
  FullNflTeam,
  getCurrentSeason,
  NFLSchedule,
  playerTeamIsNflAbbreviation,
  ProjectedPlayer,
  sanitizePlayerName,
  ScrapedADPData,
  SinglePosition,
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
    // FantasyPros stats tables have a two-row thead: a group row
    // (PASSING/RUSHING/MISC) followed by the actual stat row. Always use
    // the header row with the most cells so group rows are skipped.
    // Tables with a single header row behave exactly as before.
    const $headRows = $table.find("thead tr");
    let $headerRow = $table.find("tr").first();
    if ($headRows.length > 0) {
      let maxCells = -1;
      $headRows.each((__, row) => {
        const cellCount = $(row).find("th, td").length;
        if (cellCount > maxCells) {
          maxCells = cellCount;
          $headerRow = $(row);
        }
      });
    }
    const headers: string[] = [];
    const seenCounts: Record<string, number> = {};
    $headerRow.find("th, td").each((index, cell) => {
      let text = $(cell).text().trim().replace(/\s+/g, " ");
      if (text === "") {
        text = String(index);
      }
      // Duplicate column names (e.g. passing/rushing ATT/YDS/TD) get
      // _2/_3 suffixes, matching the DatabasePlayer key convention.
      const seen = seenCounts[text] ?? 0;
      seenCounts[text] = seen + 1;
      headers.push(seen === 0 ? text : `${text}_${seen + 1}`);
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

// ---------- Defense-vs-position ----------
//
// Computed in-house instead of scraped: for each week, every player's
// FantasyPros FPTS are attributed to the defense they faced (via the
// schedule), averaged per game, and ranked 1-32 per position. Rank 1
// surrenders the most points (easiest matchup), matching the old data's
// convention and the frontend's coloring.

const DEFENSE_FPTS_POSITIONS = [
  { pos: "QB" as SinglePosition, fp: "qb" },
  { pos: "RB" as SinglePosition, fp: "rb" },
  { pos: "WR" as SinglePosition, fp: "wr" },
  { pos: "TE" as SinglePosition, fp: "te" },
  { pos: "K" as SinglePosition, fp: "k" },
];

// nflverse uses LA for the Rams; our team codes use LAR.
const normalizeNflverseTeamCode = (code: string): string =>
  code === "LA" ? "LAR" : code;

const GAMES_CSV_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";

type GamesCsvInfo = {
  // season -> latest REG week with a recorded score
  latestScoredWeek: Record<number, number>;
  // season -> team (full name) -> week -> opponent (full name)
  opponents: Record<number, Record<string, Record<string, string>>>;
};

const fetchGamesCsvInfo = async (): Promise<GamesCsvInfo> => {
  const csv = await fetchWithRetry(
    GAMES_CSV_URL,
    { headers: { Accept: "text/csv" } }
  ).then((res) => res.text());
  const info: GamesCsvInfo = { latestScoredWeek: {}, opponents: {} };
  const lines = csv.split("\n");
  const head = lines[0].split(",");
  const col = (name: string) => head.indexOf(name);
  const seasonI = col("season");
  const weekI = col("week");
  const typeI = col("game_type");
  const homeI = col("home_team");
  const awayI = col("away_team");
  const homeScoreI = col("home_score");
  const awayScoreI = col("away_score");
  const toFull = (code: string): FullNflTeam | null => {
    if (!code) {
      return null;
    }
    return (
      AbbreviationToFullTeam[
        normalizeNflverseTeamCode(code) as AbbreviatedNflTeam
      ] ?? null
    );
  };
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols[typeI] !== "REG") {
      continue;
    }
    const season = parseInt(cols[seasonI]);
    const week = parseInt(cols[weekI]);
    if (isNaN(season) || isNaN(week)) {
      continue;
    }
    const home = toFull(cols[homeI]);
    const away = toFull(cols[awayI]);
    if (!home || !away) {
      console.warn(
        `Unknown team code in schedule: ${cols[homeI]} vs ${cols[awayI]}`
      );
      continue;
    }
    if (!info.opponents[season]) {
      info.opponents[season] = {};
    }
    if (!info.opponents[season][home]) {
      info.opponents[season][home] = {};
    }
    if (!info.opponents[season][away]) {
      info.opponents[season][away] = {};
    }
    info.opponents[season][home][String(week)] = away;
    info.opponents[season][away][String(week)] = home;
    if (cols[homeScoreI] !== "" || cols[awayScoreI] !== "") {
      info.latestScoredWeek[season] = Math.max(
        info.latestScoredWeek[season] ?? 0,
        week
      );
    }
  }
  return info;
};

type DefenseWeekStat = {
  team: AbbreviatedNflTeam;
  position: SinglePosition;
  fpts: number;
};

const parseDefensePlayerRow = (
  row: Record<string, string>,
  pos: SinglePosition
): DefenseWeekStat | null => {
  const rawName = row["Player"];
  if (!rawName) {
    return null;
  }
  const open = rawName.lastIndexOf("(");
  const close = rawName.lastIndexOf(")");
  if (open < 0 || close < 0 || close <= open + 1) {
    return null;
  }
  const team = rawName.slice(open + 1, close).toUpperCase();
  if (!playerTeamIsNflAbbreviation(team)) {
    return null;
  }
  const fpts = parseFloat(row["FPTS"]);
  if (isNaN(fpts)) {
    return null;
  }
  return { team, position: pos, fpts };
};

/**
 * Weekly stats backing the defense computation. Cached in Firestore so the
 * 5 position pages are only scraped once per season/week. Uses its own
 * collection to stay out of the scoring pipeline's way.
 */
const fetchDefenseWeekStats = async (
  season: number,
  week: number
): Promise<Record<string, DefenseWeekStat> | null> => {
  const docId = `${season}week${week}`;
  const cached = await db.collection("defenseWeekStats").doc(docId).get();
  if (cached.exists) {
    const playerMap = cached.data()?.playerMap as
      | Record<string, DefenseWeekStat>
      | undefined;
    if (playerMap && Object.keys(playerMap).length >= 50) {
      return playerMap;
    }
  }
  const pages = await Promise.all(
    DEFENSE_FPTS_POSITIONS.map(async ({ pos, fp }) => {
      try {
        const table = await get(
          `https://www.fantasypros.com/nfl/stats/${fp}.php?year=${season}&week=${week}&range=week`
        );
        return { pos, rows: (table[0] ?? []) as Record<string, string>[] };
      } catch (err) {
        console.error(
          `Defense scrape failed for ${pos} season ${season} week ${week}:`,
          err
        );
        return { pos, rows: [] as Record<string, string>[] };
      }
    })
  );
  if (pages.some((page) => page.rows.length === 0)) {
    console.warn(
      `Incomplete stats for season ${season} week ${week}, skipping week.`
    );
    return null;
  }
  const stats: Record<string, DefenseWeekStat> = {};
  for (const { pos, rows } of pages) {
    for (const row of rows) {
      const parsed = parseDefensePlayerRow(row, pos);
      if (parsed) {
        stats[sanitizePlayerName(row["Player"])] = parsed;
      }
    }
  }
  if (Object.keys(stats).length < 50) {
    console.warn(
      `Too few usable rows for season ${season} week ${week}, skipping week.`
    );
    return null;
  }
  await db.collection("defenseWeekStats").doc(docId).set({ playerMap: stats });
  return stats;
};

const fetchTeamDefensePerformance = async () => {
  const csvInfo = await fetchGamesCsvInfo();
  const currentSeason = getCurrentSeason();
  // Use the current season once it has scored games, otherwise fall back
  // to the last completed season (e.g. preseason).
  const season =
    (csvInfo.latestScoredWeek[currentSeason] ?? 0) >= 1
      ? currentSeason
      : currentSeason - 1;
  const maxWeek = csvInfo.latestScoredWeek[season] ?? 0;
  const schedule = csvInfo.opponents[season] ?? {};
  if (maxWeek < 1 || Object.keys(schedule).length === 0) {
    console.error(
      `No completed games found for season ${season}, keeping existing defense stats.`
    );
    return;
  }
  const totals: Record<string, Record<SinglePosition, number>> = {};
  const games: Record<string, number> = {};
  const blankTotals = (): Record<SinglePosition, number> => ({
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
  });
  for (let week = 1; week <= maxWeek; week++) {
    const stats = await fetchDefenseWeekStats(season, week);
    if (!stats) {
      continue;
    }
    const weekKey = String(week);
    for (const [team, weeks] of Object.entries(schedule)) {
      if (weeks[weekKey]) {
        games[team] = (games[team] ?? 0) + 1;
      }
    }
    for (const stat of Object.values(stats)) {
      const teamFull = AbbreviationToFullTeam[stat.team];
      const opponent = schedule[teamFull]?.[weekKey];
      if (!opponent) {
        continue;
      }
      if (!totals[opponent]) {
        totals[opponent] = blankTotals();
      }
      totals[opponent][stat.position] += stat.fpts;
    }
  }
  const updateData = {} as TeamFantasyPositionPerformance;
  const defenses = Object.keys(games).filter((team) => games[team] > 0);
  for (const { pos } of DEFENSE_FPTS_POSITIONS) {
    defenses
      .map((def) => ({
        def,
        avg: (totals[def]?.[pos] ?? 0) / (games[def] || 1),
      }))
      .sort((a, b) => b.avg - a.avg)
      .forEach(({ def }, index) => {
        if (!updateData[def as FullNflTeam]) {
          updateData[def as FullNflTeam] = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0 };
        }
        updateData[def as FullNflTeam][pos] = index + 1;
      });
  }
  // Never wipe good data: only overwrite with a complete 32-team table.
  const teams = Object.keys(updateData);
  const complete =
    teams.length === 32 &&
    teams.every((team) =>
      DEFENSE_FPTS_POSITIONS.every(
        ({ pos }) => typeof updateData[team as FullNflTeam][pos] === "number"
      )
    );
  if (!complete) {
    console.error(
      `Incomplete defense data (${teams.length}/32 teams), keeping existing stats.`
    );
    return;
  }
  await db.collection("nflDefenseVsPositionStats").doc("dist").set(updateData);
  console.log(
    `Updated defense-vs-position from ${season} season (${maxWeek} weeks).`
  );
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

export const fetchRankings = onSchedule(
  // 9min timeout: the first run backfills a full season of weekly stats.
  { schedule: "every day 00:00", timeoutSeconds: 540 },
  async () => {
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
  }
);

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
