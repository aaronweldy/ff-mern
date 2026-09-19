import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readProjectionCache,
  projectionPositions,
  PROJECTION_CACHE_VERSION,
  PROJECTION_CACHE_TTL_MS,
} from "../src/utils/projectionCache.js";

const now = Date.now();
const fixture = () => ({
  version: PROJECTION_CACHE_VERSION,
  source: "sleeper",
  fetchedAt: now,
  positionCounts: Object.fromEntries(
    projectionPositions.map((pos) => [pos, 11])
  ),
  projections: Object.fromEntries(
    projectionPositions.flatMap((pos) =>
      Array.from({ length: 11 }, (_, i) => [`${pos} player ${i}`, i])
    )
  ),
});

test("rejects legacy caches, including five valid entries and large partial maps", () => {
  assert.equal(
    readProjectionCache({ a: 23.2, b: 15.3, c: 13.8, d: 9.3, e: 8.1 }, now),
    null
  );
  assert.equal(readProjectionCache(fixture().projections, now), null);
});

test("accepts complete fresh projections, including zero projections", () => {
  const cache = fixture();
  assert.deepEqual(readProjectionCache(cache, now), cache.projections);
});

test("expires projections and rejects future timestamps", () => {
  assert.equal(
    readProjectionCache(fixture(), now + PROJECTION_CACHE_TTL_MS),
    null
  );
  assert.equal(readProjectionCache(fixture(), now - 1), null);
});

test("rejects a missing position, truncated map, and invalid scores", () => {
  const cache = fixture();
  cache.positionCounts.k = 0;
  assert.equal(readProjectionCache(cache, now), null);
  const truncated = fixture();
  delete truncated.projections["qb player 0"];
  assert.equal(readProjectionCache(truncated, now), null);
  const invalid = fixture();
  invalid.projections["qb player 0"] = NaN;
  assert.equal(readProjectionCache(invalid, now), null);
});

test("rejects the provider's ten-player-per-position preview", () => {
  const cache = fixture();
  for (const pos of projectionPositions) {
    cache.positionCounts[pos] = 10;
    delete cache.projections[`${pos} player 10`];
  }
  assert.equal(readProjectionCache(cache, now), null);
});

test("rejects other providers and invalid fetch timestamps", () => {
  assert.equal(
    readProjectionCache({ ...fixture(), source: "fantasypros" }, now),
    null
  );
  assert.equal(
    readProjectionCache({ ...fixture(), fetchedAt: NaN }, now),
    null
  );
});
