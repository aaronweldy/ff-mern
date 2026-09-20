import {
  AbbreviationToFullTeam,
  AbbreviatedNflTeam,
  DatabasePlayer,
  FullNflTeam,
  ScoringSetting,
  SinglePosition,
  TeamFantasyPositionPerformance,
} from "@ff-mern/ff-types";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";
import { parseCsvRows } from "./nflverseWeekStats.js";
import { calculatePlayerScore } from "./scoring.js";

const positions: SinglePosition[] = ["QB", "RB", "WR", "TE", "K"];
const aliases: Record<string, string> = {
  LA: "LAR",
  STL: "LAR",
  SD: "LAC",
  OAK: "LV",
  JAX: "JAC",
};
const teamName = (code: string): FullNflTeam | undefined =>
  AbbreviationToFullTeam[(aliases[code] || code) as AbbreviatedNflTeam];
const blank = (): Record<SinglePosition, number> => ({
  QB: 0,
  RB: 0,
  WR: 0,
  TE: 0,
  K: 0,
});

export type DefenseSample = {
  season: number;
  games: { id: string; week: number; home: FullNflTeam; away: FullNflTeam }[];
  players: {
    gameId: string;
    defense: FullNflTeam;
    position: SinglePosition;
    stats: DatabasePlayer;
  }[];
};

export const csvRecords = (
  csv: string,
  required: string[]
): Record<string, string>[] => {
  const [header, ...rows] = parseCsvRows(csv);
  if (!header || required.some((field) => !header.includes(field))) {
    throw new Error("Incomplete nflverse CSV schema");
  }
  return rows
    .filter((row) => row.some(Boolean))
    .map((row) => {
      if (row.length !== header.length)
        throw new Error("Truncated nflverse CSV row");
      return Object.fromEntries(
        header.map((field, index) => [field, row[index]])
      );
    });
};

export const completedGames = (
  csv: string,
  season: number
): DefenseSample["games"] =>
  csvRecords(csv, [
    "season",
    "week",
    "game_type",
    "game_id",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
  ])
    .filter(
      (row) =>
        Number(row.season) === season &&
        row.game_type === "REG" &&
        row.home_score !== "" &&
        row.away_score !== "" &&
        Number.isFinite(Number(row.home_score)) &&
        Number.isFinite(Number(row.away_score))
    )
    .map((row) => {
      const home = teamName(row.home_team);
      const away = teamName(row.away_team);
      if (!home || !away) throw new Error("Unknown nflverse schedule team");
      return { id: row.game_id, week: Number(row.week), home, away };
    });

/** Excludes unplayed games and games whose player feed has not arrived yet. */
export const buildDefenseSample = (
  csv: string,
  games: DefenseSample["games"],
  season: number
): DefenseSample => {
  const rows = csvRecords(csv, [
    "player_id",
    "player_display_name",
    "position",
    "season",
    "season_type",
    "game_id",
    "team",
    "opponent_team",
    "completions",
    "attempts",
    "passing_yards",
    "passing_tds",
    "passing_interceptions",
    "carries",
    "rushing_yards",
    "rushing_tds",
    "receptions",
    "targets",
    "receiving_yards",
    "receiving_tds",
    "fumbles_lost_total",
    "fg_made",
    "fg_att",
    "fg_made_0_19",
    "fg_made_20_29",
    "fg_made_30_39",
    "fg_made_40_49",
    "fg_made_50_59",
    "fg_made_60_",
    "pat_made",
    "pat_att",
  ]);
  const scheduled = new Map(games.map((game) => [game.id, game]));
  const players: DefenseSample["players"] = [];
  const quarterbacks = new Map<string, Set<string>>();
  const seen = new Set<string>();
  const coveredPositions = new Set<string>();
  for (const row of rows) {
    if (
      Number(row.season) !== season ||
      row.season_type !== "REG" ||
      !positions.includes(row.position as SinglePosition)
    )
      continue;
    const game = scheduled.get(row.game_id);
    if (!game) continue;
    const team = teamName(row.team);
    const defense = teamName(row.opponent_team);
    if (
      !team ||
      !defense ||
      !(
        (team === game.home && defense === game.away) ||
        (team === game.away && defense === game.home)
      )
    ) {
      throw new Error("Player opponent does not match nflverse schedule");
    }
    const key = `${row.game_id}:${row.player_id}`;
    if (!row.player_id || seen.has(key))
      throw new Error("Missing or duplicate nflverse player ID");
    seen.add(key);
    const stats = normalizeNflverseWeeklyStat(row);
    if (!stats) throw new Error("Invalid nflverse player");
    if (
      Object.entries(stats).some(
        ([field, value]) =>
          !["Player", "team", "position"].includes(field) &&
          !Number.isFinite(Number(value))
      )
    ) {
      throw new Error("Invalid numeric nflverse statistic");
    }
    const position = row.position as SinglePosition;
    players.push({ gameId: game.id, defense, position, stats });
    if (position === "QB") {
      const teams = quarterbacks.get(game.id) || new Set<string>();
      teams.add(team);
      quarterbacks.set(game.id, teams);
    }
  }
  const included = games.filter(
    (game) => quarterbacks.get(game.id)?.size === 2
  );
  const ids = new Set(included.map((game) => game.id));
  const includedPlayers = players.filter((player) => ids.has(player.gameId));
  includedPlayers.forEach((player) => coveredPositions.add(player.position));
  if (positions.some((position) => !coveredPositions.has(position)))
    throw new Error("Incomplete nflverse position coverage");
  return { season, games: included, players: includedPlayers };
};

export const rankDefenseSample = (
  sample: DefenseSample,
  settings: ScoringSetting[]
) => {
  const totals: Record<string, Record<SinglePosition, number>> = {};
  const gamesPlayed: Record<string, number> = {};
  for (const game of sample.games) {
    for (const team of [game.home, game.away]) {
      gamesPlayed[team] = (gamesPlayed[team] || 0) + 1;
      totals[team] ||= blank();
    }
  }
  for (const player of sample.players) {
    const points = calculatePlayerScore(
      player.stats,
      player.position,
      settings
    ).totalPoints;
    if (!Number.isFinite(points)) throw new Error("Non-finite defense score");
    totals[player.defense][player.position] += points;
  }
  const data = {} as TeamFantasyPositionPerformance;
  const averages: Record<string, Record<SinglePosition, number>> = {};
  for (const team of Object.keys(gamesPlayed)) {
    data[team as FullNflTeam] = blank();
    averages[team] = blank();
    positions.forEach((position) => {
      averages[team][position] = totals[team][position] / gamesPlayed[team];
    });
  }
  for (const position of positions) {
    const sorted = Object.keys(gamesPlayed).sort(
      (a, b) =>
        averages[b][position] - averages[a][position] || a.localeCompare(b)
    );
    let rank = 1;
    sorted.forEach((team, index) => {
      if (
        index &&
        averages[team][position] !== averages[sorted[index - 1]][position]
      )
        rank = index + 1;
      data[team as FullNflTeam][position] = rank;
    });
  }
  return {
    data,
    metadata: {
      source: "nflverse",
      season: sample.season,
      throughWeek: Math.max(0, ...sample.games.map((game) => game.week)),
      gamesPlayed,
      averages,
    },
  };
};
