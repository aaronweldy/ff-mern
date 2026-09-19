import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSleeperProjections,
  projectionPlayerKey,
  loadSleeperProjections,
} from "../src/utils/sleeperProjections.js";
import { buildProjectedLineup } from "../src/utils/projectedLineup.js";
import {
  RosteredPlayer,
  FinalizedLineup,
  LineupSettings,
} from "@ff-mern/ff-types";

const fixture = () =>
  ["QB", "RB", "WR", "TE", "K"].flatMap((position) =>
    Array.from({ length: 12 }, (_, i) => ({
      season: "2026",
      week: 2,
      season_type: "regular",
      sport: "nfl",
      category: "proj",
      player_id: `${position}-${i}`,
      player: { first_name: position, last_name: `Player ${i}`, position },
      stats: { pts_std: i },
    }))
  );

test("parses weekly point projections, skips ADP-only records, and preserves zero", () => {
  const rows = fixture();
  rows[0].stats = { adp_dd_ppr: 1000 } as any;
  const cache = parseSleeperProjections(rows, 2026, 2);
  assert.equal(cache.positionCounts.qb, 11);
  assert.equal(cache.projections["qb:qb player 0"], undefined);
  assert.equal(cache.projections["rb:rb player 0"], 0);
  assert.equal(cache.source, "sleeper");
});

test("rejects wrong weeks, seasons, ADP-only feeds, and truncated position coverage", () => {
  assert.throws(
    () => parseSleeperProjections(fixture(), 2026, 3),
    /Incomplete/
  );
  assert.throws(
    () => parseSleeperProjections(fixture(), 2025, 2),
    /Incomplete/
  );
  assert.throws(
    () =>
      parseSleeperProjections(
        fixture().map((r) => ({ ...r, stats: { adp_dd_ppr: 1000 } })),
        2026,
        2
      ),
    /Incomplete/
  );
  assert.throws(
    () =>
      parseSleeperProjections(
        fixture().filter((r) => r.player.position !== "K"),
        2026,
        2
      ),
    /Incomplete/
  );
});

test("matches punctuation and suffix differences without mixing positions", () => {
  assert.equal(
    projectionPlayerKey(" C.J. Stroud ", "QB"),
    projectionPlayerKey("CJ Stroud", "QB")
  );
  assert.equal(
    projectionPlayerKey("Brian Thomas Jr.", "WR"),
    projectionPlayerKey("Brian Thomas", "WR")
  );
  assert.notEqual(
    projectionPlayerKey("Same Name", "QB"),
    projectionPlayerKey("Same Name", "WR")
  );
  const rows = fixture();
  rows.push({ ...rows[0], player_id: "different-id" });
  assert.throws(() => parseSleeperProjections(rows, 2026, 2), /Ambiguous/);
});

test("handles HTTP failures without treating them as an empty projection feed", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
  try {
    await assert.rejects(loadSleeperProjections(2026, 2), /HTTP 503/);
  } finally {
    globalThis.fetch = original;
  }
});

const roster = () => [
  new RosteredPlayer("Top WR", "BUF", "WR"),
  new RosteredPlayer("Second WR", "BUF", "WR"),
  new RosteredPlayer("Only RB", "BUF", "RB"),
  new RosteredPlayer("No Projection", "BUF", "WR"),
];
const projections = { "wr:top wr": 20, "wr:second wr": 15, "rb:only rb": 30 };
const previous = {
  "WR/RB": [{}],
  WR: [{}],
  RB: [{}],
  bench: [],
} as FinalizedLineup;

test("maximizes starters before flex regardless of stored key order and updates player position", () => {
  const before = JSON.stringify(previous);
  const lineup = buildProjectedLineup(roster(), previous, projections);
  assert.equal(lineup.RB[0].fullName, "Only RB");
  assert.equal(lineup.WR[0].fullName, "Top WR");
  assert.equal(lineup["WR/RB"][0].fullName, "Second WR");
  assert.equal(lineup["WR/RB"][0].position, "WR");
  assert.equal(lineup.bench[0].fullName, "No Projection");
  assert.equal(JSON.stringify(previous), before);
});

test("leaves input unchanged when missing projections prevent a full lineup", () => {
  const before = JSON.stringify(previous);
  assert.throws(
    () => buildProjectedLineup(roster(), previous, { "wr:top wr": 20 }),
    /Not enough/
  );
  assert.equal(JSON.stringify(previous), before);
});

test("initializes empty lineups from settings and accepts a real zero projection", () => {
  const lineup = buildProjectedLineup(
    roster(),
    {} as FinalizedLineup,
    { "rb:only rb": 0 },
    { RB: 1 } as LineupSettings
  );
  assert.equal(lineup.RB[0].fullName, "Only RB");
  assert.equal(lineup.bench.length, 3);
});
