import { DatabasePlayer, sanitizePlayerName } from "@ff-mern/ff-types";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";
import { canonicalizePlayerName } from "./nflverseParity.js";

export const playerStatsUrl = (season: number) =>
  `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;

export const weeklyRostersUrl = (season: number) =>
  `https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_${season}.csv`;

export const parseCsvRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if (character === "\n" && !quoted) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (value || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
};

export const parseNflverseWeeklyStats = (
  csv: string,
  season: number,
  week: number
): Record<string, DatabasePlayer> => {
  const stats: Record<string, DatabasePlayer> = {};
  const [header, ...dataRows] = parseCsvRows(csv);
  if (!header || header.length === 0) return stats;

  const column = (name: string) => header.indexOf(name);
  const seasonColumn = column("season");
  const weekColumn = column("week");
  const seasonTypeColumn = column("season_type");
  const displayNameColumn = column("player_display_name");
  const playerNameColumn = column("player_name");
  if (
    seasonColumn < 0 ||
    weekColumn < 0 ||
    seasonTypeColumn < 0 ||
    (displayNameColumn < 0 && playerNameColumn < 0)
  ) {
    return stats;
  }

  for (const dataRow of dataRows) {
    if (
      dataRow.length !== header.length ||
      Number(dataRow[seasonColumn]) !== season ||
      Number(dataRow[weekColumn]) !== week ||
      dataRow[seasonTypeColumn] !== "REG"
    ) {
      continue;
    }
    const row = Object.fromEntries(
      header.map((field, index) => [field, dataRow[index]])
    );
    const normalized = normalizeNflverseWeeklyStat(row);
    if (!normalized) continue;
    const name = String(
      dataRow[displayNameColumn] ||
        (playerNameColumn >= 0 ? dataRow[playerNameColumn] : "")
    );
    stats[sanitizePlayerName(name)] = normalized;
  }
  return stats;
};

/** Add explicit nonparticipants; absence from the stats feed alone proves nothing. */
export const withNflverseNonparticipants = (
  stats: Record<string, DatabasePlayer>,
  rosterCsv: string,
  season: number,
  week: number
): Record<string, DatabasePlayer> => {
  const [header, ...rows] = parseCsvRows(rosterCsv);
  const required = [
    "season",
    "week",
    "game_type",
    "full_name",
    "gsis_id",
    "position",
    "team",
    "status",
  ];
  if (!header || required.some((field) => !header.includes(field)))
    throw new Error("Incomplete nflverse weekly roster schema");

  const identity = (name: string) =>
    canonicalizePlayerName(sanitizePlayerName(name));
  const existing = new Set(Object.keys(stats).map(identity));
  const candidates = new Map<string, Record<string, string>[]>();
  for (const values of rows) {
    if (!values.some(Boolean)) continue;
    if (values.length !== header.length)
      throw new Error("Truncated nflverse weekly roster row");
    const row = Object.fromEntries(
      header.map((field, index) => [field, values[index]])
    );
    if (
      Number(row.season) !== season ||
      Number(row.week) !== week ||
      row.game_type !== "REG" ||
      !row.full_name ||
      !row.gsis_id
    )
      continue;
    const key = identity(row.full_name);
    const matches = candidates.get(key) || [];
    matches.push(row);
    candidates.set(key, matches);
  }

  const result = { ...stats };
  for (const [key, matches] of candidates) {
    // Ambiguous roster identities and observed participation take priority.
    if (existing.has(key) || matches.length !== 1) continue;
    const row = matches[0];
    if (!["INA", "RES", "EXE"].includes(row.status)) continue;
    const normalized = normalizeNflverseWeeklyStat({
      player_display_name: row.full_name,
      position: row.position,
      team: row.team,
    });
    if (normalized)
      result[sanitizePlayerName(row.full_name)] = { ...normalized, G: "0" };
  }
  return result;
};

/** Downloads scoring stats and explicit participation for one regular-season week. */
export const loadNflverseWeeklyStats = async (
  season: number,
  week: number
): Promise<Record<string, DatabasePlayer>> => {
  const response = await fetch(playerStatsUrl(season), {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(
      `nflverse download failed: ${response.status} ${response.statusText}`
    );
  }
  const stats = parseNflverseWeeklyStats(await response.text(), season, week);
  // Do not turn an empty or unpublished scoring week into an all-zero week.
  if (!Object.keys(stats).length) return stats;
  const rosterResponse = await fetch(weeklyRostersUrl(season), {
    signal: AbortSignal.timeout(15000),
  });
  if (!rosterResponse.ok)
    throw new Error(
      `nflverse weekly roster download failed: ${rosterResponse.status}`
    );
  return withNflverseNonparticipants(
    stats,
    await rosterResponse.text(),
    season,
    week
  );
};
