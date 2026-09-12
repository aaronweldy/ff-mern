import { DatabasePlayer, sanitizePlayerName } from "@ff-mern/ff-types";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";

const playerStatsUrl = (season: number) =>
  `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;

const parseCsv = (csv: string): Record<string, string>[] => {
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

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((dataRow) => dataRow.length === header.length)
    .map((dataRow) =>
      Object.fromEntries(header.map((field, index) => [field, dataRow[index]]))
    );
};

export const parseNflverseWeeklyStats = (
  csv: string,
  season: number,
  week: number
): Record<string, DatabasePlayer> => {
  const stats: Record<string, DatabasePlayer> = {};
  for (const row of parseCsv(csv)) {
    if (
      Number(row.season) !== season ||
      Number(row.week) !== week ||
      row.season_type !== "REG"
    ) {
      continue;
    }
    const normalized = normalizeNflverseWeeklyStat(row);
    if (!normalized) continue;
    const name = String(row.player_display_name || row.player_name);
    stats[sanitizePlayerName(name)] = normalized;
  }
  return stats;
};

/** Downloads and normalizes one regular-season nflverse player-stat week. */
export const loadNflverseWeeklyStats = async (
  season: number,
  week: number
): Promise<Record<string, DatabasePlayer>> => {
  const response = await fetch(playerStatsUrl(season));
  if (!response.ok) {
    throw new Error(
      `nflverse download failed: ${response.status} ${response.statusText}`
    );
  }
  return parseNflverseWeeklyStats(await response.text(), season, week);
};
