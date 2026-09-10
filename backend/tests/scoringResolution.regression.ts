import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCumulativeScores } from "../src/utils/cumulativeScoring.js";
import {
  resolveScoringLineup,
  completedTeamsFromScoreboard,
} from "../src/utils/scoringResolution.js";
import type { Team, PlayerScoreData } from "@ff-mern/ff-types";

const fixture = () => {
  const player = (name: string, lineup: string, backup = "") => ({
    fullName: name,
    sanitizedName: name,
    position: "WR",
    team: "DET",
    lineup,
    backup,
  });
  const team = {
    id: "test",
    weekInfo: [
      null,
      {
        finalizedLineup: {
          WR: [
            player("first", "WR", "backup"),
            player("second", "WR", "backup"),
          ],
          bench: [player("backup", "bench")],
        },
      },
    ],
  } as unknown as Team;
  const data = Object.fromEntries(
    ["first", "second", "backup"].map((name) => [
      name,
      {
        team: "DET",
        position: "WR",
        statistics: { G: name === "backup" ? "1" : "0" },
        scoring: { totalPoints: name === "backup" ? 12 : 0, categories: {} },
      },
    ])
  ) as PlayerScoreData;
  return { team, data };
};

test("a backup already starting cannot be used again", () => {
  const { team, data } = fixture();
  const backup = team.weekInfo[1].finalizedLineup.bench[0];
  team.weekInfo[1].finalizedLineup.WR.push({ ...backup, lineup: "WR" });
  const result = resolveScoringLineup(team, 1, data, new Set(["DET"]));
  assert.equal(result.substitutions.length, 0);
  assert.equal(result.weekScore, 12);
  assert.equal(result.errors.length, 2);
});

test("Washington aliases match game status", () => {
  const { team, data } = fixture();
  data.first.team = "WAS";
  data.second.team = "WAS";
  assert.equal(resolveScoringLineup(team, 1, data, new Set(["WSH"])).substitutions.length, 1);
});

test("shared backup scores once, leaves submitted lineup intact, and reruns identically", () => {
  const { team, data } = fixture();
  const original = JSON.stringify(team);
  const result = resolveScoringLineup(team, 1, data, new Set(["DET"]));
  assert.equal(result.weekScore, 12);
  assert.equal(result.substitutions.length, 1);
  assert.equal(result.substitutions[0].starter, "first");
  assert.equal(result.errors.length, 1);
  assert.equal(result.lineup.WR[1].fullName, "second");
  assert.equal(JSON.stringify(team), original);
  Object.assign(team.weekInfo[1], {
    scoringLineup: result.lineup,
    substitutions: result.substitutions,
  });
  assert.deepEqual(
    resolveScoringLineup(team, 1, data, new Set(["DET"])).lineup,
    result.lineup
  );
});

test("unfinished games and unknown participation never trigger substitutions", () => {
  const { team, data } = fixture();
  assert.equal(
    resolveScoringLineup(team, 1, data, new Set()).substitutions.length,
    0
  );
  for (const games of [undefined, "", "garbage", "1"]) {
    data.first.statistics.G = games as string;
    data.second.statistics.G = games as string;
    assert.equal(
      resolveScoringLineup(team, 1, data, new Set(["DET"])).substitutions
        .length,
      0
    );
  }
});

test("missing, ineligible, and unscored backups retain starters without crashing", () => {
  for (const reason of ["missing", "position", "stats"]) {
    const { team, data } = fixture();
    if (reason === "missing") team.weekInfo[1].finalizedLineup.bench = [];
    if (reason === "position")
      team.weekInfo[1].finalizedLineup.bench[0].position = "QB";
    if (reason === "stats") delete data.backup;
    const result = resolveScoringLineup(team, 1, data, new Set(["DET"]));
    assert.equal(result.substitutions.length, 0);
    assert.equal(result.weekScore, 0);
    assert.equal(result.errors.length, 2);
  }
});

test("completed scoreboard must match requested season, week, and regular season", () => {
  const board = {
    season: { year: 2026, type: 2 },
    week: { number: 1 },
    events: [
      {
        competitions: [
          {
            status: { type: { completed: true } },
            competitors: [{ team: { abbreviation: "DET" } }],
          },
        ],
      },
      {
        competitions: [
          {
            status: { type: { completed: false } },
            competitors: [{ team: { abbreviation: "GB" } }],
          },
        ],
      },
    ],
  };
  assert.deepEqual([...completedTeamsFromScoreboard(board, 2026, 1)], ["DET"]);
  assert.equal(completedTeamsFromScoreboard(board, 2025, 1).size, 0);
  assert.equal(completedTeamsFromScoreboard(board, 2026, 2).size, 0);
  board.season.type = 1;
  assert.equal(completedTeamsFromScoreboard(board, 2026, 1).size, 0);
});

test("cumulative reruns replace the week and preserve other weeks and display names", () => {
  const { data } = fixture();
  data.backup.statistics.Player = "Backup (DET)";
  const first = calculateCumulativeScores({}, 1, data);
  assert.equal(first.Backup.totalPointsInSeason, 12);
  assert.deepEqual(calculateCumulativeScores(first, 1, data), first);
  data.backup.scoring.totalPoints = 5;
  const second = calculateCumulativeScores(first, 2, data);
  assert.equal(second.Backup.totalPointsInSeason, 17);
  data.backup.scoring.totalPoints = 7;
  const corrected = calculateCumulativeScores(second, 1, data);
  assert.equal(corrected.Backup.totalPointsInSeason, 12);
  assert.deepEqual(corrected.Backup.pointsByWeek.slice(0, 2), [7, 5]);
  assert.equal(first.Backup.totalPointsInSeason, 12);
});

test("kicker replacements require completed games and preserve the submitted kicker", () => {
  const { team, data } = fixture();
  const kicker = {
    ...team.weekInfo[1].finalizedLineup.WR[0],
    position: "K",
    lineup: "K",
  } as const;
  team.weekInfo[1].finalizedLineup.WR = [];
  team.weekInfo[1].finalizedLineup.K = [kicker];
  team.weekInfo[1].finalizedLineup.bench = [];
  data.first.position = "K";
  data.backup.position = "K";
  assert.equal(
    resolveScoringLineup(team, 1, data, new Set()).substitutions.length,
    0
  );
  const result = resolveScoringLineup(team, 1, data, new Set(["DET"]));
  assert.equal(result.weekScore, 12);
  assert.equal(result.lineup.K[0].sanitizedName, "backup");
  assert.equal(team.weekInfo[1].finalizedLineup.K[0].sanitizedName, "first");
});

test("regular slots receive shared backups before flex slots regardless of object order", () => {
  const { team, data } = fixture();
  const [first, second] = team.weekInfo[1].finalizedLineup.WR;
  team.weekInfo[1].finalizedLineup = {
    "WR/RB/TE": [{ ...second, lineup: "WR/RB/TE" }],
    WR: [first],
    bench: team.weekInfo[1].finalizedLineup.bench,
  } as Team["weekInfo"][number]["finalizedLineup"];
  const result = resolveScoringLineup(team, 1, data, new Set(["DET"]));
  assert.equal(result.substitutions[0].starter, "first");
  assert.equal(result.weekScore, 12);
});
