import {
  AbbreviatedNflTeam,
  DatabasePlayer,
  SinglePosition,
} from "@ff-mern/ff-types";

/**
 * The subset of a weekly nflverse player-stat row that the scoring importer
 * needs. Keeping this structural lets the download layer use either a CSV or
 * a parsed cache without coupling scoring to either representation.
 */
export type NflverseWeeklyStatRow = Record<string, string | number | null | undefined>;

const supportedPositions = new Set<SinglePosition>(["QB", "RB", "WR", "TE", "K"]);

const numberAt = (row: NflverseWeeklyStatRow, field: string): string => {
  const value = row[field];
  return value === null || value === undefined || value === "" ? "0" : String(value);
};

const ratio = (numerator: number, denominator: number): string =>
  denominator === 0 ? "0" : (numerator / denominator).toFixed(2);

const numeric = (row: NflverseWeeklyStatRow, field: string): number =>
  Number(row[field] || 0);

const normalizeTeam = (team: string): AbbreviatedNflTeam =>
  // nflverse uses LA for the Rams and JAX for Jacksonville, while the
  // application historically stores LAR and JAC.
  (team === "LA" ? "LAR" : team === "JAX" ? "JAC" : team) as AbbreviatedNflTeam;

const legacyRate = (numerator: number, denominator: number): string =>
  denominator === 0 ? "0" : (numerator / denominator).toFixed(1);

/**
 * Converts nflverse's weekly player statistics into the legacy FantasyPros
 * shape consumed by the current scoring engine. This is intentionally a pure
 * adapter so it can be parity-tested before it is wired into production.
 */
export const normalizeNflverseWeeklyStat = (
  row: NflverseWeeklyStatRow
): DatabasePlayer | null => {
  const position = String(row.position || "").toUpperCase() as SinglePosition;
  const team = normalizeTeam(String(row.team || ""));
  const playerName = String(row.player_display_name || row.player_name || "");
  if (!supportedPositions.has(position) || !team || !playerName) return null;

  const completions = numeric(row, "completions");
  const attempts = numeric(row, "attempts");
  const carries = numeric(row, "carries");
  const receptions = numeric(row, "receptions");

  const stats = {
    Player: `${playerName} (${team})`,
    team,
    position: position.toLowerCase(),
    G: "1",
    ATT: numberAt(row, position === "QB" ? "attempts" : "carries"),
    CMP: numberAt(row, "completions"),
    YDS: numberAt(row, position === "QB" ? "passing_yards" : position === "RB" ? "rushing_yards" : "receiving_yards"),
    TD: numberAt(row, position === "QB" ? "passing_tds" : position === "RB" ? "rushing_tds" : "receiving_tds"),
    INT: numberAt(row, "passing_interceptions"),
    FL: numberAt(row, "fumbles_lost_total"),
    REC: numberAt(row, "receptions"),
    TGT: numberAt(row, "targets"),
    "Y/R": legacyRate(numeric(row, "receiving_yards"), receptions),
    "Y/A":
      position === "QB"
        ? ratio(
            Number(legacyRate(numeric(row, "passing_yards"), attempts)),
            1
          )
        : position === "RB"
          ? legacyRate(numeric(row, "rushing_yards"), carries)
          : "0",
    PCT: ratio(Number(legacyRate(completions * 100, attempts)), 1),
    "Y/CMP": ratio(numeric(row, "passing_yards"), completions),
    YDS_2: numberAt(row, position === "QB" ? "rushing_yards" : position === "RB" ? "receiving_yards" : "rushing_yards"),
    TD_2: numberAt(row, position === "QB" ? "rushing_tds" : position === "RB" ? "receiving_tds" : "rushing_tds"),
    ATT_2: numberAt(row, position === "QB" ? "carries" : "carries"),
    "Y/A_2": ratio(numeric(row, "rushing_yards"), carries),
    FG: numberAt(row, "fg_made"),
    FGA: numberAt(row, "fg_att"),
    "1-19": numberAt(row, "fg_made_0_19"),
    "20-29": numberAt(row, "fg_made_20_29"),
    "30-39": numberAt(row, "fg_made_30_39"),
    "40-49": numberAt(row, "fg_made_40_49"),
    "50+": String(numeric(row, "fg_made_50_59") + numeric(row, "fg_made_60_")),
    XPT: numberAt(row, "pat_made"),
    XPA: numberAt(row, "pat_att"),
  } as DatabasePlayer;

  return stats;
};
