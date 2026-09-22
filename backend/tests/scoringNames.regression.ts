import { test } from "node:test";
import assert from "node:assert/strict";
import { FinalizedPlayer, PlayerScoreData, Team } from "@ff-mern/ff-types";
import { withRosterScoreAliases } from "../src/utils/scoringNames.js";
import { resolveScoringLineup } from "../src/utils/scoringResolution.js";
import {
  calculateCumulativeScores,
  consolidateCumulativeScores,
} from "../src/utils/cumulativeScoring.js";

test("season totals merge split weeks, preserve display names, and rerun without duplication", () => {
  const previous = {
    "Patrick Mahomes II": {
      position: "QB",
      team: "KC",
      pointsByWeek: [53.5, 0],
      totalPointsInSeason: 53.5,
    },
    "Patrick Mahomes": {
      position: "QB",
      team: "KC",
      pointsByWeek: [0, 90.8],
      totalPointsInSeason: 90.8,
    },
  } as Parameters<typeof calculateCumulativeScores>[0];
  const before = JSON.stringify(previous);
  const { data } = fixture();
  const result = calculateCumulativeScores(previous, 2, data);
  assert.equal(result["Patrick Mahomes II"].totalPointsInSeason, 144.3);
  assert.deepEqual(result["Patrick Mahomes II"].pointsByWeek, [53.5, 90.8]);
  assert.equal(result["Patrick Mahomes"], undefined);
  assert.deepEqual(calculateCumulativeScores(result, 2, data), result);
  data["patrick mahomes"].scoring.totalPoints = 80;
  assert.equal(
    calculateCumulativeScores(result, 2, data)["Patrick Mahomes II"]
      .totalPointsInSeason,
    133.5
  );
  assert.equal(JSON.stringify(previous), before);
});

test("season consolidation counts duplicate weeks once and preserves conflicts and unrelated players", () => {
  const entry = {
    position: "QB",
    team: "KC",
    pointsByWeek: [53.5, 90.8],
    totalPointsInSeason: 144.3,
  };
  const previous = {
    "Patrick Mahomes II": entry,
    "Patrick Mahomes": { ...entry },
  } as Parameters<typeof consolidateCumulativeScores>[0];
  assert.deepEqual(consolidateCumulativeScores(previous), {
    "Patrick Mahomes II": entry,
  });
  for (const reason of ["conflict", "team", "position"]) {
    const data = JSON.parse(JSON.stringify(previous));
    if (reason === "conflict") data["Patrick Mahomes"].pointsByWeek[0] = 45;
    if (reason === "team") data["Patrick Mahomes"].team = "BUF";
    if (reason === "position") data["Patrick Mahomes"].position = "RB";
    assert.deepEqual(consolidateCumulativeScores(data), data, reason);
  }
});

const fixture = () => {
  const team = {
    id: "suffix-regression",
    rosteredPlayers: [],
    weekInfo: [
      null,
      null,
      {
        finalizedLineup: {
          RB: [new FinalizedPlayer("James Cook III", "RB", "BUF", "RB")],
          "QB/WR/RB/TE": [
            new FinalizedPlayer(
              "Patrick Mahomes II",
              "QB",
              "KC",
              "QB/WR/RB/TE"
            ),
          ],
          bench: [],
        },
      },
    ],
  } as unknown as Team;
  const data = {
    "james cook": {
      team: "BUF",
      position: "RB",
      statistics: { Player: "James Cook (BUF)", G: "1" },
      scoring: { totalPoints: 66.9, categories: { rushing: 13.5 } },
    },
    "patrick mahomes": {
      team: "KC",
      position: "QB",
      statistics: { Player: "Patrick Mahomes (KC)", G: "1" },
      scoring: { totalPoints: 90.8, categories: { passing: 19.1 } },
    },
  } as PlayerScoreData;
  return { team, data };
};

test("Week 2 suffixes expose scores and breakdowns under roster keys and count both starters", () => {
  const { team, data } = fixture();
  const before = JSON.stringify({ team, data });
  const scores = withRosterScoreAliases(data, [team], 2);
  assert.equal(scores["james cook iii"], data["james cook"]);
  assert.equal(scores["patrick mahomes ii"], data["patrick mahomes"]);
  const result = resolveScoringLineup(team, 2, scores, new Set(["BUF", "KC"]));
  assert.equal(result.weekScore, 157.7);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.substitutions, []);
  assert.equal(JSON.stringify({ team, data }), before);
  assert.deepEqual(withRosterScoreAliases(scores, [team], 2), scores);
  // Aliases retain source display names, so cumulative calculation stays unique.
  assert.deepEqual(
    calculateCumulativeScores({}, 2, scores),
    calculateCumulativeScores({}, 2, data)
  );
});

test("exact historical keys win over canonical alternatives", () => {
  const { team, data } = fixture();
  data["james cook iii"] = {
    ...data["james cook"],
    scoring: { totalPoints: 5, categories: {} },
  };
  assert.equal(
    withRosterScoreAliases(data, [team], 2)["james cook iii"].scoring
      .totalPoints,
    5
  );
});

test("conflicting cached aliases cannot supply another roster variant", () => {
  const { team, data } = fixture();
  data["james cook jr"] = {
    ...data["james cook"],
    scoring: { totalPoints: 5, categories: {} },
  };
  assert.equal(withRosterScoreAliases(data, [team], 2)["james cook iii"], undefined);
});

test("suffix matching works in either direction, including punctuation and whitespace", () => {
  const { team, data } = fixture();
  team.weekInfo[2].finalizedLineup.RB[0] = new FinalizedPlayer(
    "James Cook",
    "RB",
    "BUF",
    "RB"
  );
  data["James  Cook Jr."] = data["james cook"];
  delete data["james cook"];
  assert.equal(
    withRosterScoreAliases(data, [team], 2)["james cook"].scoring.totalPoints,
    66.9
  );
});

test("ambiguous names, wrong positions and wrong teams remain missing", () => {
  for (const reason of ["ambiguous", "position", "team"]) {
    const { team, data } = fixture();
    if (reason === "ambiguous")
      data["james cook jr"] = {
        ...data["james cook"],
        statistics: {
          ...data["james cook"].statistics,
          Player: "James Cook Jr (BUF)",
        },
      };
    if (reason === "position") data["james cook"].position = "WR";
    if (reason === "team") data["james cook"].team = "KC";
    const scores = withRosterScoreAliases(data, [team], 2);
    assert.equal(scores["james cook iii"], undefined, reason);
    assert.equal(
      resolveScoringLineup(team, 2, scores, new Set()).errors.length,
      1
    );
  }
});

test("resolved lineups and current roster players also receive aliases", () => {
  const { team, data } = fixture();
  team.rosteredPlayers = [
    new FinalizedPlayer("James Cook Jr", "RB", "BUF", "bench") as never,
  ];
  team.weekInfo[2].scoringLineup = {
    bench: [new FinalizedPlayer("Patrick Mahomes Jr", "QB", "KC", "bench")],
  } as Team["weekInfo"][number]["finalizedLineup"];
  const scores = withRosterScoreAliases(data, [team], 2);
  assert.equal(scores["james cook jr"].scoring.totalPoints, 66.9);
  assert.equal(scores["patrick mahomes jr"].scoring.totalPoints, 90.8);
});

test("an already-starting backup cannot be used again under a different suffix", () => {
  const { team, data } = fixture();
  const starter = new FinalizedPlayer("Missing Runner", "RB", "BUF", "RB");
  starter.backup = "James Cook";
  team.weekInfo[2].finalizedLineup.RB.push(starter);
  team.weekInfo[2].finalizedLineup.bench.push(
    new FinalizedPlayer("James Cook", "RB", "BUF", "bench")
  );
  data["missing runner"] = {
    ...data["james cook"],
    statistics: { ...data["james cook"].statistics, G: "0" },
    scoring: { totalPoints: 0, categories: {} },
  };
  const result = resolveScoringLineup(
    team,
    2,
    withRosterScoreAliases(data, [team], 2),
    new Set(["BUF"])
  );
  assert.equal(result.weekScore, 157.7);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(result.substitutions, []);
});
