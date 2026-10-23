import { test, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import admin, { db } from "../src/config/firebase-config.js";
import router from "../src/route/league.js";
import { FinalizedPlayer, Team, getCurrentSeason } from "@ff-mern/ff-types";

const clone = <T>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));
type Ref = { collection: string; id: string };
type Write = { kind: "set" | "update"; path: string; data: any };
const pathOf = (ref: Ref) => `${ref.collection}/${ref.id}`;

test("scoring API writes only changed results while preserving recalculation", async (t) => {
  // Exercise the real router, scoring, alias resolution and persistence with
  // local Firestore/auth/upstream fakes. No production credentials or writes.
  const stored = new Map<string, any>();
  const commits: Write[][] = [];
  const year = getCurrentSeason();
  const cachePath = `nflverseWeekStats/${year}week2`;
  const weeklyPath = `leagueScoringData/${year}2league`;
  let completed = false;
  let failScoreboard = false;
  let scoreboardRequests = 0;
  let transientScoreboardFailures = 0;
  let clock = Date.now();
  mock.method(Date, "now", () => clock);
  let failCommit = false;
  let version = 0;
  let beforeTransaction: (() => void) | undefined;
  const put = (path: string, data: any) => {
    stored.set(path, clone(data));
    version++;
  };
  const snapshot = (ref: Ref, state = stored) => ({
    id: ref.id,
    ref,
    exists: state.has(pathOf(ref)),
    data: () => clone(state.get(pathOf(ref))),
  });
  const substitutionLogs: any[] = [];
  const originalLog = console.log;
  mock.method(console, "log", (message: any, ...args: any[]) => {
    if (
      typeof message === "string" &&
      message.startsWith('{"event":"backup_substitution_applied"')
    ) {
      const entry = JSON.parse(message);
      // A substitution must already be committed when its log is emitted.
      assert.ok(
        stored
          .get(`teams/${entry.teamId}`)
          .weekInfo[entry.week].substitutions.some(
            (substitution: any) =>
              substitution.starter === entry.starter &&
              substitution.backup === entry.backup &&
              substitution.slot === entry.slot
          )
      );
      substitutionLogs.push(entry);
    } else originalLog(message, ...args);
  });
  mock.method(db, "collection", (collection: string) => ({
    doc: (id: string) => {
      const ref = { collection, id };
      return { ...ref, get: async () => snapshot(ref) };
    },
    where: (field: string, operator: string, value: string) => {
      assert.equal(operator, "==");
      return { collection, field, value };
    },
  }));
  mock.method(
    db,
    "runTransaction",
    async (callback: (tx: any) => Promise<any>) => {
      beforeTransaction?.();
      beforeTransaction = undefined;
      // Simulate Firestore's retry when an overlapping request changes a read
      // document, and reject reads after writes as the real API does.
      for (let attempt = 0; attempt < 5; attempt++) {
        const revision = version;
        const state = new Map(
          [...stored].map(([key, value]) => [key, clone(value)])
        );
        const pending: Write[] = [];
        const ensureReading = () =>
          assert.equal(pending.length, 0, "read after write");
        const result = await callback({
          getAll: async (...refs: Ref[]) => {
            ensureReading();
            return refs.map((ref) => snapshot(ref, state));
          },
          get: async (query: {
            collection: string;
            field: string;
            value: string;
          }) => {
            ensureReading();
            return {
              docs: [...state]
                .filter(
                  ([path, data]) =>
                    path.startsWith(`${query.collection}/`) &&
                    data[query.field] === query.value
                )
                .map(([path]) =>
                  snapshot(
                    {
                      collection: query.collection,
                      id: path.slice(query.collection.length + 1),
                    },
                    state
                  )
                ),
            };
          },
          set: (ref: Ref, data: any) =>
            pending.push({ kind: "set", path: pathOf(ref), data: clone(data) }),
          update: (ref: Ref, data: any) =>
            pending.push({
              kind: "update",
              path: pathOf(ref),
              data: clone(data),
            }),
        });
        if (revision !== version) continue;
        if (failCommit) throw new Error("Fixture commit failed");
        for (const write of pending) {
          put(
            write.path,
            write.kind === "set"
              ? write.data
              : { ...stored.get(write.path), ...write.data }
          );
        }
        commits.push(pending);
        return result;
      }
      throw new Error("Fixture transaction exhausted retries");
    }
  );
  mock.method(admin.auth(), "verifyIdToken", async (token: string) => ({
    uid: token,
  }));
  const originalFetch = globalThis.fetch;
  mock.method(globalThis, "fetch", async (input: any, init?: any) => {
    if (!String(input).startsWith("https://site.api.espn.com/")) {
      return originalFetch(input, init);
    }
    scoreboardRequests++;
    if (failScoreboard) throw new Error("Fixture scoreboard unavailable");
    if (scoreboardRequests <= transientScoreboardFailures)
      return new Response(null, { status: 403 });
    return new Response(
      JSON.stringify({
        season: { year, type: 2 },
        week: { number: 2 },
        events: [
          {
            competitions: [
              {
                status: { type: { completed } },
                competitors: [{ team: { abbreviation: "DET" } }],
              },
            ],
          },
        ],
      })
    );
  });

  const originalServiceToken = process.env.SCORING_SERVICE_TOKEN;
  process.env.SCORING_SERVICE_TOKEN = "fixture-service-token";
  const app = express();
  app.use(express.json());
  app.use("/league", router);
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      res.status(500).json({ error: err.message });
    }
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  const request = async (service = true, week = 2) => {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/league/league/runScores/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(service
            ? { "x-scoring-service-token": "fixture-service-token" }
            : { Authorization: "Bearer commissioner" }),
        },
        body: JSON.stringify({ week }),
      }
    );
    return { status: response.status, body: await response.json() };
  };
  const reset = () => {
    // Each fixture represents a fresh scoring interval, past the scoreboard TTL.
    clock += 300_000;
    stored.clear();
    commits.length = 0;
    substitutionLogs.length = 0;
    completed = false;
    failScoreboard = false;
    scoreboardRequests = 0;
    transientScoreboardFailures = 0;
    failCommit = false;
    beforeTransaction = undefined;
    put("leagues/league", {
      commissioners: ["commissioner"],
      numWeeks: 3,
      lastScoredWeek: 0,
      scoringSettings: [
        {
          position: "WR",
          points: 1,
          minimums: [],
          category: { qualifier: "per", statType: "REC", threshold: 1 },
        },
      ],
    });
    const stats = Object.fromEntries(
      [
        ["starter", "Starter", "0", "0"],
        ["backup", "Backup", "1", "12"],
        ["other", "Other", "1", "8"],
      ].map(([key, name, G, REC]) => [
        key,
        {
          Player: `${name} (DET)`,
          team: "DET",
          position: "WR",
          G,
          REC,
        },
      ])
    );
    put(cachePath, {
      fetchedAt: new Date(clock).toISOString(),
      playerMap: stats,
    });
    for (const [id, name] of [
      ["first", "Starter"],
      ["second", "Other"],
    ]) {
      const team = clone(new Team(id, "League", "owner@example.com", false, 3));
      team.id = id;
      team.league = "league";
      team.weekInfo[1].weekScore = 99;
      team.weekInfo[2].addedPoints = 7;
      team.weekInfo[2].finalizedLineup = {
        WR: [
          { ...new FinalizedPlayer(name, "WR", "DET", "WR"), backup: "Backup" },
        ],
        bench: [new FinalizedPlayer("Backup", "WR", "DET", "bench")],
      } as any;
      put(`teams/${id}`, team);
    }
  };
  const lastWrites = () => commits.at(-1)!;
  const paths = () =>
    lastWrites()
      .map((write) => write.path)
      .sort();

  try {
    await t.test(
      "first run commits results; unchanged scheduled runs upload no scores and return only status",
      async () => {
        reset();
        assert.deepEqual(await request(), {
          status: 200,
          body: { updated: true },
        });
        assert.equal(lastWrites().length, 5);
        const before = clone([...stored]);
        for (let i = 0; i < 3; i++) {
          assert.deepEqual(await request(), {
            status: 200,
            body: { updated: false },
          });
          assert.deepEqual(lastWrites(), []);
        }
        assert.deepEqual([...stored], before);
        assert.equal(scoreboardRequests, 1);
      }
    );
    await t.test(
      "temporary ESPN rejection recovers before saving and subsequent runs use the cache",
      async () => {
        reset();
        transientScoreboardFailures = 2;
        assert.deepEqual(await request(), {
          status: 200,
          body: { updated: true },
        });
        assert.equal(scoreboardRequests, 3);
        assert.equal(commits.length, 1);
        assert.deepEqual(await request(), {
          status: 200,
          body: { updated: false },
        });
        assert.equal(scoreboardRequests, 3);
      }
    );
    await t.test(
      "manual unchanged recalculation still returns full results and warnings",
      async () => {
        reset();
        delete stored.get(cachePath).playerMap.starter;
        await request();
        const response = await request(false);
        assert.equal(response.status, 200);
        assert.deepEqual(Object.keys(response.body).sort(), [
          "data",
          "errors",
          "teams",
        ]);
        assert.equal(response.body.teams.length, 2);
        assert.equal(response.body.errors.length, 1);
        assert.match(response.body.errors[0].desc, /Missing scoring data/);
        assert.equal(response.body.data.backup.scoring.totalPoints, 12);
        assert.deepEqual(lastWrites(), []);
      }
    );
    await t.test(
      "provider object key reordering does not cause score uploads",
      async () => {
        reset();
        await request();
        const cache = stored.get(cachePath);
        cache.playerMap = Object.fromEntries(
          Object.entries(cache.playerMap)
            .reverse()
            .map(([name, stats]) => [
              name,
              Object.fromEntries(Object.entries(stats as object).reverse()),
            ])
        );
        put(cachePath, cache);
        assert.deepEqual((await request()).body, { updated: false });
        assert.deepEqual(lastWrites(), []);
      }
    );
    await t.test(
      "zero-valued penalties compare equal after Firestore serializes negative zero",
      async () => {
        reset();
        stored.get("leagues/league").scoringSettings[0].points = -1;
        await request();
        assert.deepEqual((await request()).body, { updated: false });
        assert.deepEqual(lastWrites(), []);
      }
    );
    await t.test(
      "stat corrections update only affected teams and preserve other weeks and adjustments",
      async () => {
        reset();
        await request();
        stored.get("leagues/league").lastScoredWeek = 3;
        const cumulative = stored.get("cumulativePlayerScores/league");
        cumulative.Other.pointsByWeek[0] = 5;
        cumulative.Other.totalPointsInSeason += 5;
        put("cumulativePlayerScores/league", cumulative);
        stored.get(cachePath).playerMap.other.REC = "10";
        assert.deepEqual((await request()).body, { updated: true });
        assert.deepEqual(
          paths(),
          ["cumulativePlayerScores/league", weeklyPath, "teams/second"].sort()
        );
        const team = stored.get("teams/second");
        assert.equal(team.weekInfo[2].weekScore, 10);
        assert.equal(team.weekInfo[2].addedPoints, 7);
        assert.equal(team.weekInfo[1].weekScore, 99);
        assert.equal(stored.get("leagues/league").lastScoredWeek, 3);
        assert.equal(
          stored.get("cumulativePlayerScores/league").Other.totalPointsInSeason,
          15
        );
        await request();
        assert.deepEqual(lastWrites(), []);
      }
    );
    await t.test(
      "scoring settings changes are recalculated without changing the NFL stats",
      async () => {
        reset();
        await request();
        stored.get("leagues/league").scoringSettings[0].points = 2;
        assert.deepEqual((await request()).body, { updated: true });
        assert.equal(stored.get("teams/second").weekInfo[2].weekScore, 16);
        assert.equal(
          stored.get(weeklyPath).playerData.backup.scoring.totalPoints,
          24
        );
      }
    );
    await t.test(
      "fresh submitted lineups are scored even when stats and settings are unchanged",
      async () => {
        reset();
        await request();
        beforeTransaction = () => {
          const team = stored.get("teams/first");
          team.weekInfo[2].finalizedLineup.WR = [
            new FinalizedPlayer("Other", "WR", "DET", "WR"),
          ];
          put("teams/first", team);
        };
        assert.deepEqual((await request()).body, { updated: true });
        assert.deepEqual(paths(), ["teams/first"]);
        assert.equal(stored.get("teams/first").weekInfo[2].weekScore, 8);
      }
    );
    await t.test(
      "game completion applies backups without a change to the player feed",
      async () => {
        reset();
        await request();
        assert.equal(stored.get("teams/first").weekInfo[2].weekScore, 0);
        completed = true;
        clock += 300_000;
        stored.get(cachePath).fetchedAt = new Date(clock).toISOString();
        assert.deepEqual((await request()).body, { updated: true });
        assert.deepEqual(paths(), ["teams/first"]);
        const info = stored.get("teams/first").weekInfo[2];
        assert.equal(info.weekScore, 12);
        assert.equal(info.finalizedLineup.WR[0].fullName, "Starter");
        assert.equal(info.scoringLineup.WR[0].fullName, "Backup");
        assert.deepEqual(substitutionLogs, [
          {
            event: "backup_substitution_applied",
            leagueId: "league",
            season: year,
            week: 2,
            teamId: "first",
            starter: "Starter",
            backup: "Backup",
            slot: "WR",
          },
        ]);
        await request();
        assert.deepEqual(lastWrites(), []);
        assert.equal(substitutionLogs.length, 1);
        // A score correction with the same substitution does not announce it again.
        stored.get(cachePath).playerMap.backup.REC = "14";
        assert.deepEqual((await request()).body, { updated: true });
        assert.equal(stored.get("teams/first").weekInfo[2].weekScore, 14);
        assert.equal(substitutionLogs.length, 1);
      }
    );
    await t.test(
      "changed backup assignments log the new substitution",
      async () => {
        reset();
        completed = true;
        await request();
        const team = stored.get("teams/first");
        team.weekInfo[2].finalizedLineup.WR[0].backup = "Other";
        team.weekInfo[2].finalizedLineup.bench.push(
          new FinalizedPlayer("Other", "WR", "DET", "bench")
        );
        put("teams/first", team);
        await request();
        assert.equal(substitutionLogs.length, 2);
        assert.equal(substitutionLogs[1].backup, "Other");
        await request();
        assert.equal(substitutionLogs.length, 2);
      }
    );
    await t.test(
      "failed commits never log a calculated substitution",
      async () => {
        reset();
        completed = true;
        failCommit = true;
        const before = clone([...stored]);
        assert.equal((await request()).status, 500);
        assert.deepEqual(substitutionLogs, []);
        assert.deepEqual([...stored], before);
      }
    );
    await t.test(
      "commissioner adjustments survive an unchanged run without uploading the team",
      async () => {
        reset();
        await request();
        stored.get("teams/first").weekInfo[2].addedPoints = 25;
        assert.deepEqual((await request()).body, { updated: false });
        assert.deepEqual(lastWrites(), []);
        assert.equal(stored.get("teams/first").weekInfo[2].addedPoints, 25);
      }
    );
    await t.test(
      "missing weekly and cumulative output is rebuilt instead of skipped",
      async () => {
        reset();
        await request();
        stored.delete(weeklyPath);
        stored.delete("cumulativePlayerScores/league");
        assert.deepEqual((await request()).body, { updated: true });
        assert.deepEqual(
          paths(),
          ["cumulativePlayerScores/league", weeklyPath].sort()
        );
      }
    );
    await t.test(
      "overlapping identical requests retry and commit score payloads only once",
      async () => {
        reset();
        completed = true;
        const results = await Promise.all([request(), request()]);
        assert.equal(scoreboardRequests, 1);
        assert.ok(results.every((result) => result.status === 200));
        assert.deepEqual(results.map((result) => result.body.updated).sort(), [
          false,
          true,
        ]);
        assert.equal(commits.filter((writes) => writes.length > 0).length, 1);
        assert.equal(substitutionLogs.length, 1);
      }
    );
    await t.test(
      "settings changed during a run abort every score write",
      async () => {
        reset();
        beforeTransaction = () => {
          const league = stored.get("leagues/league");
          league.scoringSettings[0].points = 3;
          put("leagues/league", league);
        };
        const response = await request();
        assert.equal(response.status, 500);
        assert.match(response.body.error, /Scoring settings changed/);
        assert.equal(commits.length, 0);
        assert.equal(stored.has(weeklyPath), false);
      }
    );
    await t.test(
      "a missing lineup or failed game lookup never partially saves results",
      async () => {
        for (const failure of ["lineup", "scoreboard"]) {
          reset();
          completed = true;
          if (failure === "lineup")
            delete stored.get("teams/second").weekInfo[2].finalizedLineup;
          else failScoreboard = true;
          const before = clone([...stored]);
          assert.equal((await request()).status, 500);
          assert.equal(commits.length, 0);
          assert.deepEqual([...stored], before);
          assert.deepEqual(substitutionLogs, []);
        }
      }
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
    if (originalServiceToken === undefined)
      delete process.env.SCORING_SERVICE_TOKEN;
    else process.env.SCORING_SERVICE_TOKEN = originalServiceToken;
    mock.restoreAll();
  }
});
