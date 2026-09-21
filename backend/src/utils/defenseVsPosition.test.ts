import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AbbreviationToFullTeam, ScoringSetting } from "@ff-mern/ff-types";
import {
  buildDefenseSample,
  completedGames,
  csvRecords,
  DefenseSample,
  rankDefenseSample,
} from "./defenseVsPosition.js";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";

const home = AbbreviationToFullTeam.BUF;
const away = AbbreviationToFullTeam.MIA;
const settings: ScoringSetting[] = [
  {
    position: "RB",
    points: 1,
    category: { qualifier: "per", statType: "RUSH YD", threshold: 10 },
    minimums: [],
  },
];
const player = (
  id: string,
  defense: typeof home,
  yards: number,
  receptions = 0
) => ({
  gameId: id,
  defense,
  position: "RB" as const,
  stats: normalizeNflverseWeeklyStat({
    player_display_name: "Runner",
    position: "RB",
    team: "BUF",
    rushing_yards: yards,
    receptions,
  })!,
});

describe("defense rankings", () => {
  it("counts games, not players, including zero points; breaks ranking ties equally", () => {
    const sample: DefenseSample = {
      season: 2025,
      games: [
        { id: "one", week: 1, home, away },
        { id: "two", week: 3, home, away },
      ],
      players: [
        player("one", away, 100),
        player("one", away, 40),
        player("two", home, 100),
      ],
    };
    const result = rankDefenseSample(sample, settings);
    assert.equal(result.metadata.gamesPlayed[away], 2);
    assert.equal(result.metadata.averages[away].RB, 7);
    assert.equal(result.data[away].RB, 1);
    assert.equal(result.data[home].RB, 2);
    assert.equal(result.data[home].TE, 1);
    assert.equal(result.data[away].TE, 1);
    assert.equal(result.metadata.throughWeek, 3);
  });
  it("changes rankings with league scoring and applies per-player bonuses", () => {
    const sample: DefenseSample = {
      season: 2025,
      games: [{ id: "one", week: 1, home, away }],
      players: [player("one", away, 100), player("one", home, 50, 10)],
    };
    assert.equal(rankDefenseSample(sample, settings).data[away].RB, 1);
    const ppr: ScoringSetting = {
      position: "RB",
      points: 1,
      category: { qualifier: "per", statType: "REC", threshold: 1 },
      minimums: [],
    };
    assert.equal(
      rankDefenseSample(sample, [...settings, ppr]).data[home].RB,
      1
    );
    const bonus: ScoringSetting = {
      position: "RB",
      points: 5,
      category: {
        qualifier: "greater than",
        statType: "RUSH YD",
        threshold: 100,
      },
      minimums: [],
    };
    assert.equal(
      rankDefenseSample(sample, [bonus]).metadata.averages[away].RB,
      5
    );
  });
  it("counts zero and negative scores", () => {
    const sample: DefenseSample = {
      season: 2025,
      games: [{ id: "one", week: 1, home, away }],
      players: [player("one", away, -10)],
    };
    const result = rankDefenseSample(sample, settings);
    assert.equal(result.data[home].RB, 1);
    assert.equal(result.metadata.averages[away].RB, -1);
  });
});

const scheduleHeader =
  "season,week,game_type,game_id,home_team,away_team,home_score,away_score";
it("only includes completed regular-season games, normalizing Rams and Jaguars codes", () => {
  const games = completedGames(
    [
      scheduleHeader,
      "2025,1,REG,g1,LA,JAX,0,3",
      "2025,2,REG,g2,BUF,MIA,,",
      "2025,3,REG,g3,BUF,MIA,7,",
      "2025,19,POST,g4,BUF,MIA,10,7",
      "2024,1,REG,g5,BUF,MIA,10,7",
    ].join("\n"),
    2025
  );
  assert.equal(games.length, 1);
  assert.equal(games[0].home, AbbreviationToFullTeam.LAR);
  assert.equal(games[0].away, AbbreviationToFullTeam.JAC);
});
it("parses quoted CSV and rejects incomplete schemas and truncated rows", () => {
  assert.equal(
    csvRecords('name,points\n"Name, Jr.",0\n', ["name"])[0].name,
    "Name, Jr."
  );
  assert.throws(() => csvRecords("name\na", ["game_id"]));
  assert.throws(() => csvRecords("name,points\na", ["name"]));
});

const fields =
  "player_id,player_display_name,position,season,season_type,game_id,team,opponent_team,completions,attempts,passing_yards,passing_tds,passing_interceptions,carries,rushing_yards,rushing_tds,receptions,targets,receiving_yards,receiving_tds,fumbles_lost_total,fg_made,fg_att,fg_made_0_19,fg_made_20_29,fg_made_30_39,fg_made_40_49,fg_made_50_59,fg_made_60_,pat_made,pat_att".split(
    ","
  );
const row = (
  id: string,
  position: string,
  team: string,
  opponent: string,
  game = "one"
) =>
  Object.fromEntries(
    fields.map((field) => [
      field,
      (
        {
          player_id: id,
          player_display_name: id,
          position,
          team,
          opponent_team: opponent,
          game_id: game,
          season: "2025",
          season_type: "REG",
        } as Record<string, string>
      )[field] ?? "0",
    ])
  );
const csv = (rows: Record<string, string>[]) =>
  [
    fields.join(","),
    ...rows.map((record) => fields.map((field) => record[field]).join(",")),
  ].join("\n");
const validRows = [
  row("qb1", "QB", "BUF", "MIA"),
  row("qb2", "QB", "MIA", "BUF"),
  ...["RB", "WR", "TE", "K"].map((pos) => row(pos, pos, "BUF", "MIA")),
];
const games = [
  { id: "one", week: 1, home, away },
  { id: "two", week: 2, home, away },
];
it("excludes games with unpublished stats without losing genuine zero-point positions", () => {
  const sample = buildDefenseSample(
    csv([...validRows, row("qb3", "QB", "BUF", "MIA", "two")]),
    games,
    2025
  );
  assert.equal(sample.games.length, 1);
  assert.equal(sample.players.length, 6);
  assert.equal(
    rankDefenseSample(sample, settings).metadata.averages[home].K,
    0
  );
});
it("rejects duplicate players, mismatched opponents, invalid numbers and missing positions", () => {
  assert.throws(() =>
    buildDefenseSample(csv([...validRows, validRows[0]]), games, 2025)
  );
  assert.throws(() =>
    buildDefenseSample(
      csv([{ ...validRows[0], opponent_team: "NYJ" }, ...validRows.slice(1)]),
      games,
      2025
    )
  );
  assert.throws(() =>
    buildDefenseSample(
      csv([{ ...validRows[0], passing_yards: "bad" }, ...validRows.slice(1)]),
      games,
      2025
    )
  );
  assert.throws(() =>
    buildDefenseSample(
      csv(validRows.filter((record) => record.position !== "K")),
      games,
      2025
    )
  );
});
