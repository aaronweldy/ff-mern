import { canonicalizePlayerName } from "./nflverseParity.js";
import {
  projectionPositions,
  PROJECTION_CACHE_VERSION,
  readProjectionCache,
} from "./projectionCache.js";

export const projectionPlayerKey = (name: string, position: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[.']/g, "")
    .replace(/\s+/g, " ");
  return `${position.toLowerCase()}:${canonicalizePlayerName(normalized)}`;
};

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const parseSleeperProjections = (
  data: unknown,
  season: number,
  week: number
) => {
  if (!Array.isArray(data))
    throw new Error("Invalid Sleeper projection response");
  const projections: Record<string, number> = {};
  const positionCounts: Record<string, number> = Object.fromEntries(
    projectionPositions.map((pos) => [pos, 0])
  );
  const ids = new Map<string, string>();
  for (const value of data) {
    const row = record(value);
    const player = record(row.player);
    const stats = record(row.stats);
    const pos = String(player.position ?? "").toLowerCase();
    if (
      !projectionPositions.includes(
        pos as (typeof projectionPositions)[number]
      ) ||
      String(row.season) !== String(season) ||
      row.week !== week ||
      row.season_type !== "regular" ||
      row.category !== "proj" ||
      row.sport !== "nfl"
    )
      continue;
    // Sleeper includes thousands of ADP-only records. They are not zero-point
    // projections, nor evidence that the weekly projection feed is complete.
    if (
      typeof stats.pts_std !== "number" ||
      !Number.isFinite(stats.pts_std) ||
      typeof player.first_name !== "string" ||
      typeof player.last_name !== "string" ||
      !player.first_name.trim() ||
      !player.last_name.trim() ||
      typeof row.player_id !== "string"
    )
      continue;
    const key = projectionPlayerKey(
      `${player.first_name} ${player.last_name}`,
      pos
    );
    if (ids.has(key) && ids.get(key) !== row.player_id) {
      throw new Error(`Ambiguous Sleeper player name: ${key}`);
    }
    if (!ids.has(key)) positionCounts[pos]++;
    ids.set(key, row.player_id);
    projections[key] = stats.pts_std;
  }
  const cache = {
    version: PROJECTION_CACHE_VERSION,
    source: "sleeper",
    fetchedAt: Date.now(),
    positionCounts,
    projections,
  };
  if (!readProjectionCache(cache))
    throw new Error(
      `Incomplete Sleeper projections for ${season} week ${week}`
    );
  return cache;
};

export const loadSleeperProjections = async (season: number, week: number) => {
  const response = await fetch(
    `https://api.sleeper.app/projections/nfl/${season}/${week}?season_type=regular`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!response.ok)
    throw new Error(`Sleeper projections returned HTTP ${response.status}`);
  return parseSleeperProjections(await response.json(), season, week);
};
