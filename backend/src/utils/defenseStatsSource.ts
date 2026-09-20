import { getCurrentSeason } from "@ff-mern/ff-types";
import {
  buildDefenseSample,
  completedGames,
  DefenseSample,
} from "./defenseVsPosition.js";
import { playerStatsUrl } from "./nflverseWeekStats.js";

const TTL = 5 * 60 * 1000;
type Snapshot = { sample: DefenseSample; fetchedAt: string };
let cache: Snapshot | undefined;
let inFlight: Promise<Snapshot> | undefined;

const download = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok)
    throw new Error(`nflverse download failed: ${response.status}`);
  return response.text();
};

/** A shared, short-lived source cache allows corrections to flow into every league. */
export const loadDefenseStatsSource = async (): Promise<Snapshot> => {
  const currentSeason = getCurrentSeason();
  if (cache && Date.now() - Date.parse(cache.fetchedAt) < TTL) return cache;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const schedule = await download(
      "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv"
    );
    let season = currentSeason;
    let games = completedGames(schedule, season);
    // Preseason fallback only: an unavailable current-season feed is an error.
    if (!games.length) {
      season -= 1;
      games = completedGames(schedule, season);
    }
    const sample = buildDefenseSample(
      await download(playerStatsUrl(season)),
      games,
      season
    );
    const teams = new Set(
      sample.games.flatMap((game) => [game.home, game.away])
    );
    if (teams.size !== 32)
      throw new Error(`Incomplete defense coverage: ${teams.size}/32 teams`);
    cache = { sample, fetchedAt: new Date().toISOString() };
    return cache;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = undefined;
  }
};
