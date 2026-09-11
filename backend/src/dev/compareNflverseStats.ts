import { DatabasePlayer, League, sanitizePlayerName } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import { normalizeNflverseWeeklyStat } from "../utils/nflverseStats.js";
import { compareNflverseStats } from "../utils/nflverseParity.js";

const STATS_URL = (season: number) =>
  `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;

type Arguments = {
  season: number;
  week: number;
  leagueId?: string;
};

const usage =
  "Usage: yarn workspace backend compare:nflverse -- <season> <week> [--league <leagueId>]";

const parseArguments = (args: string[]): Arguments => {
  const commandArgs = args[0] === "--" ? args.slice(1) : args;
  const [seasonText, weekText, ...options] = commandArgs;
  const season = Number(seasonText);
  const week = Number(weekText);
  if (!Number.isInteger(season) || !Number.isInteger(week) || week < 1) {
    throw new Error(usage);
  }
  const leagueFlag = options.indexOf("--league");
  const leagueId = leagueFlag >= 0 ? options[leagueFlag + 1] : undefined;
  if (leagueFlag >= 0 && !leagueId) throw new Error(usage);
  return { season, week, leagueId };
};

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

const fetchNflverseWeek = async (
  season: number,
  week: number
): Promise<Record<string, DatabasePlayer>> => {
  const response = await fetch(STATS_URL(season));
  if (!response.ok) {
    throw new Error(`nflverse download failed: ${response.status} ${response.statusText}`);
  }
  const rows = parseCsv(await response.text());
  const stats: Record<string, DatabasePlayer> = {};
  for (const row of rows) {
    if (
      Number(row.season) !== season ||
      Number(row.week) !== week ||
      row.season_type !== "REG"
    ) {
      continue;
    }
    const normalized = normalizeNflverseWeeklyStat(row);
    if (!normalized) continue;
    const player = sanitizePlayerName(String(row.player_display_name || row.player_name));
    stats[player] = normalized;
  }
  return stats;
};

const run = async (): Promise<void> => {
  const { season, week, leagueId } = parseArguments(process.argv.slice(2));
  const weekStats = await db.collection("weekStats").doc(`${season}week${week}`).get();
  if (!weekStats.exists) {
    throw new Error(`No cached legacy stats exist for ${season} week ${week}.`);
  }
  const legacyStats = weekStats.data()?.playerMap as Record<string, DatabasePlayer>;
  if (!legacyStats || Object.keys(legacyStats).length === 0) {
    throw new Error(`The cached legacy stats for ${season} week ${week} are empty.`);
  }

  let league: League | undefined;
  if (leagueId) {
    const leagueDocument = await db.collection("leagues").doc(leagueId).get();
    if (!leagueDocument.exists) throw new Error(`League ${leagueId} was not found.`);
    league = leagueDocument.data() as League;
  }

  const nflverseStats = await fetchNflverseWeek(season, week);
  const report = compareNflverseStats(
    legacyStats,
    nflverseStats,
    league?.scoringSettings
  );
  console.log(
    JSON.stringify(
      {
        season,
        week,
        leagueId: leagueId || null,
        ...report,
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
