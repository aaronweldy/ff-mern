import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AbbreviationToFullTeam,
  FinalizedLineup,
  FinalizedPlayer,
  NFLSchedule,
  RosteredPlayer,
  Team,
} from "@ff-mern/ff-types";
import { assertLineupUnlocked } from "../src/utils/lineupLocks.js";
import { buildProjectedLineup } from "../src/utils/projectedLineup.js";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const kickoff = Date.parse("2026-10-01T00:00:00Z");
const schedule: NFLSchedule = {
  [AbbreviationToFullTeam.BUF]: {
    "2": {
      gameTime: new Date(kickoff).toISOString(),
      opponent: "",
      isHome: true,
    },
  },
  [AbbreviationToFullTeam.MIA]: {
    "2": {
      gameTime: new Date(kickoff + 86400000).toISOString(),
      opponent: "",
      isHome: false,
    },
  },
};
const player = (name: string, team: "BUF" | "MIA") => ({
  ...new FinalizedPlayer(name, "WR", team, "WR"),
  backup: "",
});
const fixture = () => {
  const team = new Team("Team", "League", "Owner", false, 3);
  team.id = "team";
  team.league = "league";
  team.owner = "owner";
  team.rosteredPlayers = [
    new RosteredPlayer("Locked", "BUF", "WR"),
    new RosteredPlayer("Future", "MIA", "WR"),
    new RosteredPlayer("Other Future", "MIA", "WR"),
  ];
  team.weekInfo = clone(team.weekInfo);
  team.weekInfo[2].finalizedLineup = {
    WR: [player("Locked", "BUF")],
    bench: [player("Future", "MIA")],
  } as FinalizedLineup;
  return team;
};
const check = (
  before: Team,
  after: Team,
  commissioner = false,
  now = kickoff
) => assertLineupUnlocked(before, after, schedule, commissioner, now);

test("owners cannot bench a starter at or after kickoff; pregame edits succeed", () => {
  const before = fixture();
  const after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0] = player("Future", "MIA");
  assert.doesNotThrow(() => check(before, after, false, kickoff - 1));
  assert.throws(() => check(before, after), /already started/);
  assert.throws(
    () => check(before, after, false, kickoff + 1),
    /already started/
  );
  assert.doesNotThrow(() => check(before, after, true));
});

test("started bench players cannot enter newly added or previously empty starter slots", () => {
  const before = fixture();
  before.weekInfo[2].finalizedLineup = {} as FinalizedLineup;
  const after = clone(before);
  after.weekInfo[2].finalizedLineup = {
    WR: [player("Locked", "BUF")],
  } as FinalizedLineup;
  assert.throws(() => check(before, after), /already started/);
});

test("removing a locked slot or entire week is rejected", () => {
  const before = fixture();
  for (const change of ["slot", "week"] as const) {
    const after = clone(before);
    if (change === "slot")
      after.weekInfo[2].finalizedLineup = {} as FinalizedLineup;
    else after.weekInfo = after.weekInfo.slice(0, 2);
    assert.throws(() => check(before, after), /already started/);
  }
});

test("backup changes lock both the starter and already-started backups", () => {
  const before = fixture();
  let after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0].backup = "Future";
  assert.throws(() => check(before, after), /already started/);
  before.weekInfo[2].finalizedLineup.WR[0] = player("Future", "MIA");
  after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0].backup = "Locked";
  assert.throws(() => check(before, after), /already started/);
  before.weekInfo[2].finalizedLineup.WR[0].backup = "Locked";
  after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0].backup = "Other Future";
  assert.throws(() => check(before, after), /already started/);
});

test("changing superflex scoring eligibility is rejected after a starter starts", () => {
  const before = fixture();
  const after = clone(before);
  after.weekInfo[2].isSuperflex = true;
  assert.throws(() => check(before, after), /settings/);
});

test("unchanged locked starters do not prevent editing unstarted slots or non-lineup settings", () => {
  const before = fixture();
  before.weekInfo[2].finalizedLineup.WR.push(player("Future", "MIA"));
  const after = clone(before);
  after.name = "Renamed";
  after.weekInfo[2].finalizedLineup.WR[1] = player("Other Future", "MIA");
  after.weekInfo[2].finalizedLineup.bench.reverse();
  assert.doesNotThrow(() => check(before, after));
});

test("a forged NFL team cannot unlock a stored bench player", () => {
  const before = fixture();
  before.weekInfo[2].finalizedLineup.WR[0] = player("Future", "MIA");
  const after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0] = player("Locked", "MIA");
  assert.throws(() => check(before, after), /already started/);
});

test("a forged position cannot unlock a stored player", () => {
  const before = fixture();
  before.weekInfo[2].finalizedLineup.WR[0] = player("Future", "MIA");
  const after = clone(before);
  after.weekInfo[2].finalizedLineup.WR[0] = {
    ...player("Locked", "MIA"),
    position: "QB",
  };
  assert.throws(() => check(before, after), /already started/);
});

test("highest-projection and last-week replacements are checked like manual edits", () => {
  const before = fixture();
  before.weekInfo[1].finalizedLineup = {
    WR: [player("Future", "MIA")],
  } as FinalizedLineup;
  for (const lineup of [
    buildProjectedLineup(
      before.rosteredPlayers,
      before.weekInfo[2].finalizedLineup,
      { "wr:locked": 1, "wr:future": 20, "wr:other future": 10 }
    ),
    before.weekInfo[1].finalizedLineup,
  ]) {
    const after = clone(before);
    after.weekInfo[2].finalizedLineup = lineup;
    assert.throws(() => check(before, after), /already started/);
  }
});
