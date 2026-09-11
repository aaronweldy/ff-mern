import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DatabasePlayer } from "@ff-mern/ff-types";
import { defaultScoringSettings } from "../constants/league.js";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";
import { calculatePlayerScore } from "./scoring.js";

// These rows are from the completed 2025 regular-season opener. The expected
// values are the fields the existing FantasyPros scraper stores for scoring.
// They form the initial migration baseline; add a row whenever a new scoring
// category is introduced.
const legacyAaronRodgers: Pick<
  DatabasePlayer,
  "Player" | "team" | "position" | "ATT" | "CMP" | "YDS" | "TD" | "INT" | "ATT_2" | "YDS_2" | "TD_2" | "PCT" | "Y/A" | "Y/CMP" | "FL"
> = {
  Player: "Aaron Rodgers (PIT)",
  team: "PIT",
  position: "qb",
  ATT: "30",
  CMP: "22",
  YDS: "244",
  TD: "4",
  INT: "0",
  ATT_2: "1",
  YDS_2: "-1",
  TD_2: "0",
  PCT: "73.33",
  "Y/A": "8.13",
  "Y/CMP": "11.09",
  FL: "0",
};

const legacyMattPrater: Pick<
  DatabasePlayer,
  "Player" | "team" | "position" | "FG" | "FGA" | "20-29" | "40-49" | "50+" | "XPT" | "XPA"
> = {
  Player: "Matt Prater (BUF)",
  team: "BUF",
  position: "k",
  FG: "3",
  FGA: "3",
  "20-29": "1",
  "40-49": "1",
  "50+": "1",
  XPT: "2",
  XPA: "2",
};

describe("nflverse weekly-stat parity", () => {
  it("normalizes quarterback fields used by existing scoring", () => {
    const stat = normalizeNflverseWeeklyStat({
      player_display_name: "Aaron Rodgers",
      position: "QB",
      team: "PIT",
      attempts: 30,
      completions: 22,
      passing_yards: 244,
      passing_tds: 4,
      passing_interceptions: 0,
      carries: 1,
      rushing_yards: -1,
      rushing_tds: 0,
      fumbles_lost_total: 0,
    });

    assert.ok(stat);
    for (const [field, expected] of Object.entries(legacyAaronRodgers)) {
      assert.equal(stat[field as keyof DatabasePlayer], expected, field);
    }
  });

  it("normalizes detailed kicker makes, including 50-plus yard field goals", () => {
    const stat = normalizeNflverseWeeklyStat({
      player_display_name: "Matt Prater",
      position: "K",
      team: "BUF",
      fg_made: 3,
      fg_att: 3,
      fg_made_20_29: 1,
      fg_made_40_49: 1,
      fg_made_50_59: 1,
      fg_made_60_: 0,
      pat_made: 2,
      pat_att: 2,
    });

    assert.ok(stat);
    for (const [field, expected] of Object.entries(legacyMattPrater)) {
      assert.equal(stat[field as keyof DatabasePlayer], expected, field);
    }
  });

  it("converts nflverse's Rams abbreviation to the application's abbreviation", () => {
    const stat = normalizeNflverseWeeklyStat({
      player_display_name: "Matthew Stafford",
      position: "QB",
      team: "LA",
    });

    assert.equal(stat?.team, "LAR");
  });

  it("produces the same Standard and PPR scores as the legacy stat shape", () => {
    const normalizedRodgers = normalizeNflverseWeeklyStat({
      player_display_name: "Aaron Rodgers",
      position: "QB",
      team: "PIT",
      attempts: 30,
      completions: 22,
      passing_yards: 244,
      passing_tds: 4,
      passing_interceptions: 0,
      carries: 1,
      rushing_yards: -1,
      rushing_tds: 0,
      fumbles_lost_total: 0,
    });
    const normalizedPrater = normalizeNflverseWeeklyStat({
      player_display_name: "Matt Prater",
      position: "K",
      team: "BUF",
      fg_made_20_29: 1,
      fg_made_40_49: 1,
      fg_made_50_59: 1,
    });

    assert.ok(normalizedRodgers);
    assert.ok(normalizedPrater);
    for (const format of ["Standard", "PPR"]) {
      const settings = defaultScoringSettings[format];
      assert.equal(
        calculatePlayerScore(normalizedRodgers, "QB", settings).totalPoints,
        calculatePlayerScore(legacyAaronRodgers as DatabasePlayer, "QB", settings)
          .totalPoints,
        `${format} quarterback score`
      );
      assert.equal(
        calculatePlayerScore(normalizedPrater, "K", settings).totalPoints,
        calculatePlayerScore(legacyMattPrater as DatabasePlayer, "K", settings)
          .totalPoints,
        `${format} kicker score`
      );
    }
  });
});
