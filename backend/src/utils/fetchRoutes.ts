import {
  DatabasePlayer,
  League,
  PlayerScoreData,
  RosteredPlayer,
  sanitizePlayerName,
  SinglePosition,
  Team,
  AbbreviatedNflTeam,
  Week,
  ScrapedPlayerProjection,
  getCurrentSeason,
  AbbreviationToFullTeam,
} from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import { get } from './tableScraper.js';
import { calculatePlayerScore } from "./scoring.js";
import { loadNflverseWeeklyStats } from "./nflverseWeekStats.js";

export type ScrapedPlayer = Record<string, string>;
export const positions = ["qb", "rb", "wr", "te", "k"];
export const longPositions = [
  "Quarterbacks",
  "Running Backs",
  "Wide Receivers",
  "Tight Ends",
];

const getUsableProjectionMap = (
  data: unknown
): Record<string, number> | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const projections = Object.entries(data).filter(
    ([playerName, projection]) =>
      playerName !== "" &&
      typeof projection === "number" &&
      Number.isFinite(projection)
  );

  // One valid entry per position is the minimum signal that a cached scrape
  // contains useful data. In particular, an empty Firestore document must not
  // become a permanent cache hit after a page was temporarily unavailable.
  return projections.length >= positions.length
    ? Object.fromEntries(projections)
    : null;
};

const sliceTeamFromName = (name: string) => {
  const lastSpace = name.lastIndexOf(" ");
  return name.substring(0, lastSpace);
};

export const fetchPlayerProjections = async (week: Week) => {
  const season = getCurrentSeason();
  const check = await db
    .collection("playerProjections")
    .doc(`${season}week${week}`)
    .get();
  const cachedProjections = getUsableProjectionMap(check.data());
  if (cachedProjections) {
    return cachedProjections;
  }
  if (check.exists) {
    console.warn(
      `Ignoring unusable projection cache for ${season} week ${week}`
    );
  }

  const scrapedProjections: Record<string, number> = {};
  for (const pos of positions) {
    const url = `https://www.fantasypros.com/nfl/projections/${pos}.php?week=${week}`;
    const tableData = await get(url);
    let parsedForPosition = 0;
    for (const player of (tableData[0] ?? []) as ScrapedPlayerProjection[]) {
      if (!player.Player) {
        continue;
      }
      const projection = Number.parseFloat(player.FPTS);
      const playerName = sliceTeamFromName(sanitizePlayerName(player.Player));
      if (!playerName || !Number.isFinite(projection)) {
        continue;
      }
      scrapedProjections[playerName] = projection;
      parsedForPosition++;
    }
    if (parsedForPosition === 0) {
      throw new Error(`No usable ${pos} projections returned for week ${week}`);
    }
  }

  const usableProjections = getUsableProjectionMap(scrapedProjections);
  if (!usableProjections) {
    throw new Error(`No usable projections returned for week ${week}`);
  }

  await db
    .collection("playerProjections")
    .doc(`${season}week${week}`)
    .set(usableProjections);
  return usableProjections;
};

export const fetchPlayers = () => {
  return new Promise<RosteredPlayer[]>(async (resolve, _) => {
    const players: RosteredPlayer[] = [];
    const kickerUrl = "https://www.fantasypros.com/nfl/projections/k.php";
    const kickerData = await get(kickerUrl);
    for (const player of kickerData[0]) {
      const lastSpaceIndex = player["Player"].lastIndexOf(" ");
      const name = player["Player"].slice(0, lastSpaceIndex);
      const team = player["Player"].slice(lastSpaceIndex + 1);
      players.push(new RosteredPlayer(name, team, "K"));
    }
    for (const [abbrevTeam, fullTeam] of Object.entries(
      AbbreviationToFullTeam
    )) {
      const url = `https://www.fantasypros.com/nfl/depth-chart/${fullTeam
        .split(" ")
        .join("-")}.php`;
      const tableData = await get(url);
      for (let i = 0; i < longPositions.length; ++i) {
        for (const player of tableData[i]) {
          players.push(
            new RosteredPlayer(
              player[longPositions[i]],
              abbrevTeam as AbbreviatedNflTeam,
              positions[i].toUpperCase() as SinglePosition
            )
          );
        }
      }
    }
    resolve(players);
  });
};

const NFLVERSE_CACHE_TTL_MS = 5 * 60 * 1000;
const nflverseInflight = new Map<
  string,
  Promise<Record<string, DatabasePlayer>>
>();

export const fetchNflverseWeeklyStats = async (
  season: number,
  week: number
): Promise<Record<string, DatabasePlayer>> => {
  const cacheKey = `${season}week${week}`;
  const inflight = nflverseInflight.get(cacheKey);
  if (inflight) return inflight;

  const loadAndCache = (async (): Promise<Record<string, DatabasePlayer>> => {
    const reference = db.collection("nflverseWeekStats").doc(cacheKey);
    const cached = await reference.get();
    const fetchedAt = cached.data()?.fetchedAt as string | undefined;
    const cachedStats = cached.data()?.playerMap as Record<string, DatabasePlayer> | undefined;
    if (
      cachedStats &&
      Object.keys(cachedStats).length > 0 &&
      fetchedAt &&
      Date.now() - new Date(fetchedAt).getTime() < NFLVERSE_CACHE_TTL_MS
    ) {
      return cachedStats;
    }

    const playerMap = await loadNflverseWeeklyStats(season, week);
    // Do not cache an empty/future week. This lets the next scoring attempt
    // see newly published nflverse data instead of holding a false cache hit.
    if (Object.keys(playerMap).length > 0) {
      await reference.set({
        fetchedAt: new Date().toISOString(),
        playerMap,
      });
    }
    return playerMap;
  })();
  nflverseInflight.set(cacheKey, loadAndCache);
  try {
    return await loadAndCache;
  } finally {
    nflverseInflight.delete(cacheKey);
  }
};

export const scoreAllPlayers = async (
  league: League,
  leagueId: string,
  week: number,
  persist = true
) => {
  const data: PlayerScoreData = {};
  const stats = await fetchNflverseWeeklyStats(getCurrentSeason(), week);
  if (Object.keys(stats).length === 0) {
    return data;
  }
  Object.entries(stats).forEach(([sanitizedName, statistics]) => {
    const player = new RosteredPlayer(
      statistics.Player.slice(0, statistics.Player.indexOf("(") - 1),
      statistics.team as AbbreviatedNflTeam,
      statistics.position.toUpperCase() as SinglePosition
    );
    const score = calculatePlayerScore(
      statistics,
      player.position,
      league.scoringSettings
    );
    data[sanitizedName] = {
      team: statistics.team as AbbreviatedNflTeam,
      position: player.position,
      scoring: {
        totalPoints: score.totalPoints,
        categories: score.categories,
      },
      statistics,
    };
  });
  const yearWeek = getCurrentSeason() + week.toString();
  if (persist) await db
    .collection("leagueScoringData")
    .doc(yearWeek + leagueId)
    .set({ playerData: data });
  return data;
};

export const getTeamsInLeague = async (id: string) => {
  return await db
    .collection("teams")
    .where("league", "==", id)
    .get()
    .then((teamSnapshot) => {
      const teams: Team[] = [];
      teamSnapshot.forEach((teamData) => {
        teams.push(teamData.data() as Team);
      });
      return teams;
    });
};
