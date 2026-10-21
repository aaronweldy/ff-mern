import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, mock } from "node:test";
import { FinalizedPlayer, PlayerScoreData, Team } from "@ff-mern/ff-types";
import { defaultScoringSettings } from "../src/constants/league.js";
import { calculatePlayerScore } from "../src/utils/scoring.js";
import {
  completedTeamsFromScoreboard,
  resolveScoringLineup,
} from "../src/utils/scoringResolution.js";
import {
  loadNflverseWeeklyStats,
  parseCsvRows,
  parseNflverseWeeklyStats,
  withNflverseNonparticipants,
} from "../src/utils/nflverseWeekStats.js";

const fixture = (name: string) =>
  readFileSync(
    new URL(`./fixtures/2026-week6/${name}.csv`, import.meta.url),
    "utf8"
  );
const raw = parseNflverseWeeklyStats(fixture("stats"), 2026, 6);
const roster = fixture("rosters");
const enriched = withNflverseNonparticipants(raw, roster, 2026, 6);
const [header, ...rows] = parseCsvRows(fixture("games"));
const games = rows
  .filter((row) => row.length === header.length)
  .map((row) =>
    Object.fromEntries(header.map((key, index) => [key, row[index]]))
  );
const completed = completedTeamsFromScoreboard(
  {
    season: { year: 2026, type: 2 },
    week: { number: 6 },
    events: games.map((game) => ({
      competitions: [
        {
          status: {
            type: {
              completed: game.home_score !== "" && game.away_score !== "",
            },
          },
          competitors: [game.home_team, game.away_team].map((abbreviation) => ({
            team: {
              abbreviation: abbreviation === "LA" ? "LAR" : abbreviation,
            },
          })),
        },
      ],
    })),
  },
  2026,
  6
);

const score = (stats = enriched): PlayerScoreData =>
  Object.fromEntries(
    Object.entries(stats).map(([name, statistics]) => [
      name,
      {
        statistics,
        team: statistics.team,
        position: statistics.position.toUpperCase(),
        scoring: calculatePlayerScore(
          statistics,
          statistics.position.toUpperCase() as "RB" | "WR",
          defaultScoringSettings.PPR
        ),
      },
    ])
  ) as PlayerScoreData;

const cases = [
  {
    starter: "Jeremiyah Love",
    backup: "Tyler Allgeier",
    position: "RB",
    team: "ARI",
    backupTeam: "ARI",
    points: 5.8,
  },
  {
    starter: "DJ Moore",
    backup: "Keon Coleman",
    position: "WR",
    team: "BUF",
    backupTeam: "BUF",
    points: 13.9,
  },
  {
    starter: "Adonai Mitchell",
    backup: "Jaylen Waddle",
    position: "WR",
    team: "NYJ",
    backupTeam: "DEN",
    points: 6.4,
  },
] as const;
const lineup = (example: (typeof cases)[number]): Team =>
  ({
    id: "week6-replay",
    weekInfo: {
      6: {
        finalizedLineup: {
          [example.position]: [
            {
              ...new FinalizedPlayer(
                example.starter,
                example.position,
                example.team,
                example.position
              ),
              backup: example.backup,
            },
          ],
          bench: [
            new FinalizedPlayer(
              example.backup,
              example.position,
              example.backupTeam,
              "bench"
            ),
          ],
        },
      },
    },
  } as unknown as Team);

for (const example of cases) {
  test(`actual 2026 week 6: ${example.starter} -> ${example.backup}`, () => {
    const team = lineup(example);
    const original = JSON.stringify(team);
    const before = resolveScoringLineup(team, 6, score(raw), completed);
    assert.equal(before.substitutions.length, 0);
    assert.equal(before.weekScore, 0);
    const after = resolveScoringLineup(team, 6, score(), completed);
    assert.deepEqual(after.substitutions, [
      {
        starter: example.starter,
        backup: example.backup,
        slot: example.position,
      },
    ]);
    assert.equal(after.weekScore, example.points);
    assert.deepEqual(after.errors, []);
    assert.equal(JSON.stringify(team), original);
    assert.deepEqual(resolveScoringLineup(team, 6, score(), completed), after);
    assert.equal(
      resolveScoringLineup(team, 6, score(), new Set()).substitutions.length,
      0
    );
  });
}

test("actual week 6: active missing stats and active zero scores do not become DNPs", () => {
  assert.equal(enriched["justin watson"], undefined);
  assert.equal(enriched["calvin ridley"].G, "1");
  const team = lineup(cases[1]);
  const player = team.weekInfo[6].finalizedLineup.WR[0];
  Object.assign(player, {
    fullName: "Calvin Ridley",
    sanitizedName: "calvin ridley",
    team: "TEN",
  });
  const result = resolveScoringLineup(team, 6, score(), completed);
  assert.equal(result.weekScore, 0);
  assert.equal(result.substitutions.length, 0);
  assert.equal(enriched["james conner"].G, "0");
});

test("roster joins respect week, season, game type, ambiguity and existing stats", () => {
  for (const csv of [
    roster.replaceAll(",6,REG,", ",7,REG,"),
    roster.replaceAll("2026,", "2025,"),
    roster.replaceAll(",REG,", ",POST,"),
  ])
    assert.deepEqual(withNflverseNonparticipants(raw, csv, 2026, 6), raw);
  const conflicting = roster + "2026,6,REG,other,DJ Moore,WR,CHI,ACT\n";
  assert.equal(
    withNflverseNonparticipants(raw, conflicting, 2026, 6)["dj moore"],
    undefined
  );
  const stats = {
    ...raw,
    "dj moore": { ...raw["keon coleman"], Player: "DJ Moore (BUF)", G: "1" },
  };
  assert.equal(
    withNflverseNonparticipants(stats, roster, 2026, 6)["dj moore"].G,
    "1"
  );
  assert.deepEqual(raw, parseNflverseWeeklyStats(fixture("stats"), 2026, 6));
});

test("roster downloads are integrated and failures cannot supply guessed participation", async () => {
  let rosterStatus = 200;
  let rosterBody = roster;
  let statsBody = fixture("stats");
  const calls: string[] = [];
  const mockedFetch = mock.method(globalThis, "fetch", async (input: any) => {
    const url = String(input);
    calls.push(url);
    return url.includes("weekly_rosters")
      ? new Response(rosterBody, { status: rosterStatus })
      : new Response(statsBody);
  });
  try {
    assert.deepEqual(await loadNflverseWeeklyStats(2026, 6), enriched);
    assert.equal(calls.length, 2);
    rosterStatus = 503;
    await assert.rejects(
      loadNflverseWeeklyStats(2026, 6),
      /roster download failed: 503/
    );
    rosterStatus = 200;
    rosterBody = "unexpected,columns\n";
    await assert.rejects(loadNflverseWeeklyStats(2026, 6), /roster schema/);
    rosterBody = roster + "truncated,row\n";
    await assert.rejects(loadNflverseWeeklyStats(2026, 6), /Truncated/);
    calls.length = 0;
    statsBody = "player_display_name,season,week,season_type\n";
    assert.deepEqual(await loadNflverseWeeklyStats(2026, 6), {});
    assert.equal(calls.length, 1);
  } finally {
    mockedFetch.mock.restore();
  }
});
