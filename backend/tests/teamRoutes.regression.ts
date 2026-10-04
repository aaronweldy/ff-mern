import { test, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import admin, { db } from "../src/config/firebase-config.js";
import router from "../src/route/team.js";
import {
  AbbreviationToFullTeam,
  FinalizedLineup,
  FinalizedPlayer,
  RosteredPlayer,
  Team,
} from "@ff-mern/ff-types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const player = (name: string, team: "BUF" | "MIA") =>
  new FinalizedPlayer(name, "WR", team, "WR");
const fixture = (id = "team") => {
  const team = new Team("Stored Team", "League", "owner@example.com", false, 3);
  team.id = id;
  team.owner = "owner";
  team.league = "league";
  team.rosteredPlayers = [
    new RosteredPlayer("Locked", "BUF", "WR"),
    new RosteredPlayer("Future", "MIA", "WR"),
  ];
  team.weekInfo = clone(team.weekInfo);
  team.weekInfo[1].finalizedLineup = {
    WR: [player("Future", "MIA")],
    bench: [],
  } as FinalizedLineup;
  team.weekInfo[2].finalizedLineup = {
    WR: [player("Locked", "BUF")],
    bench: [],
  } as FinalizedLineup;
  return clone(team);
};

test("team API enforces kickoff locks and saves only authorized complete transactions", async (t) => {
  // No credentials or external requests: all Firestore/auth calls are local fakes.
  const teams = new Map<string, Team>();
  let locked = true;
  let liveSchedule: Record<string, unknown> | undefined;
  let failProjections = false;
  let beforeTransaction: (() => void) | undefined;
  let writes = 0;
  const projectionData = Object.fromEntries(
    ["qb", "rb", "wr", "te", "k"].flatMap((pos) =>
      Array.from({ length: 11 }, (_, index) => [
        `${pos}:fixture ${index}`,
        index,
      ])
    )
  );
  delete projectionData["wr:fixture 0"];
  delete projectionData["wr:fixture 1"];
  projectionData["wr:locked"] = 1;
  projectionData["wr:future"] = 20;
  const snapshot = (collection: string, id: string) => ({
    exists: collection !== "teams" || teams.has(id),
    data: () => {
      if (collection === "teams")
        return teams.has(id) ? clone(teams.get(id)) : undefined;
      if (collection === "leagues") return { commissioners: ["commissioner"] };
      if (collection === "playerProjections") {
        if (failProjections) throw new Error("Fixture projection outage");
        return {
          version: 3,
          source: "sleeper",
          fetchedAt: Date.now(),
          positionCounts: { qb: 11, rb: 11, wr: 11, te: 11, k: 11 },
          projections: projectionData,
        };
      }
      throw new Error(`Unexpected collection ${collection}`);
    },
  });
  mock.method(db, "collection", (collection: string) => ({
    doc: (id: string) => ({
      collection,
      id,
      get: async () => snapshot(collection, id),
    }),
    get: async () => {
      assert.equal(collection, "nflSchedule");
      return {
        forEach: (callback: (doc: any) => void) => {
          if (liveSchedule) {
            Object.entries(liveSchedule).forEach(([id, games]) =>
              callback({ id, data: () => games })
            );
            return;
          }
          for (const [team, started] of [
            ["BUF", locked],
            ["MIA", false],
          ] as const) {
            callback({
              id: AbbreviationToFullTeam[team],
              data: () => ({
                "2": {
                  gameTime: new Date(
                    Date.now() + (started ? -60000 : 86400000)
                  ).toISOString(),
                  opponent: "",
                  isHome: true,
                },
              }),
            });
          }
        },
      };
    },
  }));
  mock.method(
    db,
    "runTransaction",
    async (callback: (transaction: any) => Promise<any>) => {
      beforeTransaction?.();
      beforeTransaction = undefined;
      const pending: Team[] = [];
      const result = await callback({
        get: async (ref: any) => {
          assert.equal(
            pending.length,
            0,
            "transaction cannot read after writing"
          );
          return snapshot(ref.collection, ref.id);
        },
        set: (ref: any, team: Team) => {
          assert.equal(ref.id, team.id);
          pending.push(clone(team));
        },
      });
      pending.forEach((team) => {
        teams.set(team.id, team);
        writes++;
      });
      return result;
    }
  );
  mock.method(admin.auth(), "verifyIdToken", async (token: string) => ({
    uid: token,
  }));
  mock.method(admin.auth(), "getUserByEmail", async () => ({ uid: "owner" }));
  const app = express();
  app.use(express.json());
  app.use("/team", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  const request = async (
    path: string,
    body: unknown,
    uid = "owner",
    method = "POST"
  ) => {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/team/${path}/`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${uid}`,
        },
        body: JSON.stringify(body),
      }
    );
    return { status: response.status, body: await response.json() };
  };
  const reset = () => {
    teams.clear();
    teams.set("team", fixture());
    writes = 0;
    locked = true;
    liveSchedule = undefined;
    failProjections = false;
  };
  try {
    for (const type of ["Projection", "LastWeek"]) {
      await t.test(
        `${type} rejects owner changes to locked players without a write`,
        async () => {
          reset();
          const before = clone(teams.get("team"));
          const response = await request("setLineupFromProjection", {
            team: before,
            week: "2",
            type,
          });
          assert.equal(response.status, 400);
          assert.match(response.body.message, /already started/);
          assert.equal(writes, 0);
          assert.deepEqual(teams.get("team"), before);
        }
      );
    }
    await t.test(
      "Team-page projection cannot swap Thursday Boswell for McLaughlin when the owner is commissioner",
      async () => {
        reset();
        const team = fixture();
        team.owner = "commissioner";
        team.rosteredPlayers = [
          new RosteredPlayer("Chris Boswell", "PIT", "K"),
          new RosteredPlayer("Chase McLaughlin", "TB", "K"),
        ];
        team.weekInfo[3].finalizedLineup = {
          K: [
            {
              ...new FinalizedPlayer("Chase McLaughlin", "K", "TB", "K"),
              backup: "",
            },
          ],
        } as FinalizedLineup;
        team.weekInfo[4] = {
          ...team.weekInfo[2],
          finalizedLineup: {
            K: [
              {
                ...new FinalizedPlayer("Chris Boswell", "K", "PIT", "K"),
                backup: "",
              },
            ],
          } as FinalizedLineup,
        };
        teams.set("team", clone(team));
        liveSchedule = {
          "pittsburgh steelers": {
            "4": {
              gameTime: "2026-10-02T00:15:00.000Z",
              opponent: "cleveland browns",
              isHome: false,
            },
          },
          "tampa bay buccaneers": {
            "4": {
              gameTime: "2026-10-04T17:00:00.000Z",
              opponent: "green bay packers",
              isHome: true,
            },
          },
        };
        delete projectionData["k:fixture 0"];
        delete projectionData["k:fixture 1"];
        projectionData["k:chris boswell"] = 8;
        projectionData["k:chase mclaughlin"] = 12;
        const clock = mock.method(Date, "now", () =>
          Date.parse("2026-10-04T12:00:00Z")
        );
        try {
          const response = await request(
            "setLineupFromProjection",
            { team: clone(team), week: "4", type: "Projection" },
            "commissioner"
          );
          assert.equal(response.status, 400);
          assert.equal(writes, 0);
          assert.equal(
            teams.get("team")?.weekInfo[4].finalizedLineup.K[0].fullName,
            "Chris Boswell"
          );
        } finally {
          clock.mock.restore();
        }
      }
    );
    for (const type of ["Projection", "LastWeek"]) {
      await t.test(
        `${type} honors kickoff locks for a commissioner on the regular Team page`,
        async () => {
          reset();
          const team = fixture();
          team.owner = "commissioner";
          teams.set("team", team);
          const response = await request(
            "setLineupFromProjection",
            { team: clone(team), week: "2", type },
            "commissioner"
          );
          assert.equal(response.status, 400);
          assert.equal(writes, 0);
        }
      );
      await t.test(
        `${type} rejects an owner claiming commissioner override`,
        async () => {
          reset();
          const response = await request(
            "setLineupFromProjection",
            { team: fixture(), week: "2", type, isAdmin: true },
            "owner"
          );
          assert.equal(response.status, 400);
          assert.equal(writes, 0);
        }
      );
    }
    await t.test(
      "manual commissioner edits require an explicit override",
      async () => {
        reset();
        const team = fixture();
        team.weekInfo[2].finalizedLineup.WR = [];
        const response = await request(
          "updateSingleTeam",
          { team },
          "commissioner",
          "PUT"
        );
        assert.equal(response.status, 400);
        assert.equal(writes, 0);
        const override = await request(
          "updateSingleTeam",
          { team, isAdmin: true },
          "commissioner",
          "PUT"
        );
        assert.equal(override.status, 200);
        assert.equal(writes, 1);
      }
    );
    await t.test(
      "bulk commissioner edits honor kickoff locks by default",
      async () => {
        reset();
        const team = fixture();
        team.weekInfo[2].finalizedLineup.WR = [];
        const response = await request(
          "updateTeams",
          { teams: [team] },
          "commissioner"
        );
        assert.equal(response.status, 400);
        assert.equal(writes, 0);
      }
    );
    await t.test(
      "forged isAdmin cannot bypass a manual owner's lock",
      async () => {
        reset();
        const team = fixture();
        team.weekInfo[2].finalizedLineup.WR[0] = clone(player("Future", "MIA"));
        const response = await request(
          "updateSingleTeam",
          { team, isAdmin: true },
          "owner",
          "PUT"
        );
        assert.equal(response.status, 400);
        assert.equal(writes, 0);
      }
    );
    await t.test(
      "bulk update rejects atomically when any team has a locked change",
      async () => {
        reset();
        teams.set("other", fixture("other"));
        const unchanged = fixture("other");
        unchanged.name = "Renamed";
        const changed = fixture();
        changed.weekInfo[2].finalizedLineup.WR = [];
        const response = await request("updateTeams", {
          teams: [unchanged, changed],
        });
        assert.equal(response.status, 400);
        assert.equal(writes, 0);
        assert.equal(teams.get("other")?.name, "Stored Team");
      }
    );
    for (const type of ["Projection", "LastWeek"]) {
      await t.test(
        `${type} works before kickoff and ignores stale client fields`,
        async () => {
          reset();
          locked = false;
          const stale = fixture();
          stale.name = "Stale Name";
          stale.weekInfo[1].addedPoints = 999;
          stale.rosteredPlayers = [];
          const response = await request("setLineupFromProjection", {
            team: stale,
            week: "2",
            type,
          });
          assert.equal(response.status, 200);
          assert.equal(
            response.body.team.weekInfo[2].finalizedLineup.WR[0].fullName,
            "Future"
          );
          assert.equal(response.body.team.name, "Stored Team");
          assert.equal(response.body.team.weekInfo[1].addedPoints, 0);
          assert.equal(writes, 1);
        }
      );
      await t.test(
        `${type} allows a verified commissioner override`,
        async () => {
          reset();
          const response = await request(
            "setLineupFromProjection",
            { team: fixture(), week: "2", type, isAdmin: true },
            "commissioner"
          );
          assert.equal(response.status, 200);
          assert.equal(writes, 1);
        }
      );
    }
    await t.test(
      "unrelated users cannot edit or quick-set a team",
      async () => {
        reset();
        for (const [path, body, method] of [
          [
            "setLineupFromProjection",
            { team: fixture(), week: "2", type: "LastWeek" },
            "POST",
          ],
          ["updateSingleTeam", { team: fixture(), isAdmin: true }, "PUT"],
          ["updateTeams", { teams: [fixture()] }, "POST"],
        ] as const) {
          assert.equal(
            (await request(path, body, "stranger", method)).status,
            403
          );
        }
        assert.equal(writes, 0);
      }
    );
    await t.test(
      "quick-set checks fresh transaction state rather than a stale preliminary read",
      async () => {
        reset();
        teams.get("team")!.weekInfo[2].finalizedLineup.WR[0] = clone(
          player("Future", "MIA")
        );
        beforeTransaction = () => teams.set("team", fixture());
        const response = await request("setLineupFromProjection", {
          team: fixture(),
          week: "2",
          type: "LastWeek",
        });
        assert.equal(response.status, 400);
        assert.equal(writes, 0);
      }
    );
    await t.test(
      "owner validation cannot overwrite a lineup from the client",
      async () => {
        reset();
        const stale = fixture();
        stale.weekInfo[2].finalizedLineup.WR = [];
        const response = await request("validateTeams", { teams: [stale] });
        assert.equal(response.status, 200);
        assert.equal(
          teams.get("team")?.weekInfo[2].finalizedLineup.WR[0].fullName,
          "Locked"
        );
      }
    );
    await t.test(
      "projection failures preserve the lineup and return a useful error",
      async () => {
        reset();
        failProjections = true;
        const response = await request("setLineupFromProjection", {
          team: fixture(),
          week: "2",
          type: "Projection",
        });
        assert.equal(response.status, 503);
        assert.match(response.body.message, /projections are unavailable/);
        assert.equal(writes, 0);
      }
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    mock.restoreAll();
  }
});
