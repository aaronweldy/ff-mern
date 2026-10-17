import { test } from "node:test";
import assert from "node:assert/strict";
import type { DatabasePlayer } from "@ff-mern/ff-types";
import type { DocumentReference } from "firebase-admin/firestore";
import { readOrRefreshNflverseStats } from "../src/utils/nflverseStatsCache.js";

const now = Date.parse("2026-10-16T12:00:00Z");
const stats = {
  player: { Player: "Player (DET)", REC: "5" } as DatabasePlayer,
};
const fixture = (cached?: any) => {
  const writes: { kind: string; data: any; precondition?: any }[] = [];
  const revision = { seconds: 100, nanoseconds: 0 };
  const ref = {
    get: async () => ({ data: () => cached, updateTime: revision }),
    set: async (data: any) => writes.push({ kind: "set", data }),
    update: async (data: any, precondition: any) =>
      writes.push({ kind: "update", data, precondition }),
  } as unknown as DocumentReference;
  return { ref, writes, revision };
};

test("fresh stats avoid downloads and writes", async () => {
  const { ref, writes } = fixture({
    playerMap: stats,
    fetchedAt: new Date(now - 1000).toISOString(),
  });
  const result = await readOrRefreshNflverseStats(
    ref,
    async () => {
      throw new Error("Must use cache");
    },
    now
  );
  assert.deepEqual(result, stats);
  assert.deepEqual(writes, []);
});

test("expired unchanged stats upload only the timestamp with the original snapshot precondition", async () => {
  const { ref, writes, revision } = fixture({
    playerMap: stats,
    fetchedAt: new Date(now - 300_000).toISOString(),
  });
  const reordered = {
    player: { REC: "5", Player: "Player (DET)" } as DatabasePlayer,
  };
  assert.deepEqual(
    await readOrRefreshNflverseStats(ref, async () => reordered, now),
    stats
  );
  assert.deepEqual(writes, [
    {
      kind: "update",
      data: { fetchedAt: new Date(now).toISOString() },
      precondition: { lastUpdateTime: revision },
    },
  ]);
});

test("missing, invalid and future timestamps are revalidated; changed stats are saved", async () => {
  for (const fetchedAt of [
    undefined,
    "invalid",
    new Date(now + 60_000).toISOString(),
  ]) {
    const { ref, writes } = fixture({ playerMap: stats, fetchedAt });
    const changed = { player: { ...stats.player, REC: "6" } };
    assert.deepEqual(
      await readOrRefreshNflverseStats(ref, async () => changed, now),
      changed
    );
    assert.deepEqual(writes, [
      {
        kind: "set",
        data: { fetchedAt: new Date(now).toISOString(), playerMap: changed },
      },
    ]);
  }
  const { ref, writes } = fixture();
  await readOrRefreshNflverseStats(ref, async () => stats, now);
  assert.equal(writes[0].kind, "set");
});

test("an empty week is not cached and a download failure does not freshen stale stats", async () => {
  const { ref, writes } = fixture({ playerMap: stats, fetchedAt: "invalid" });
  assert.deepEqual(
    await readOrRefreshNflverseStats(ref, async () => ({}), now),
    {}
  );
  await assert.rejects(
    readOrRefreshNflverseStats(
      ref,
      async () => {
        throw new Error("Source unavailable");
      },
      now
    ),
    /Source unavailable/
  );
  assert.deepEqual(writes, []);
});

test("a concurrent cache refresh conflict aborts rather than marking different data fresh", async () => {
  const { ref } = fixture({ playerMap: stats, fetchedAt: "invalid" });
  ref.update = async () => {
    throw new Error("FAILED_PRECONDITION");
  };
  await assert.rejects(
    readOrRefreshNflverseStats(ref, async () => stats, now),
    /FAILED_PRECONDITION/
  );
});
