import { isDeepStrictEqual } from "node:util";
import type { DocumentReference } from "firebase-admin/firestore";
import type { DatabasePlayer } from "@ff-mern/ff-types";

const NFLVERSE_CACHE_TTL_MS = 5 * 60 * 1000;
type PlayerMap = Record<string, DatabasePlayer>;

export const readOrRefreshNflverseStats = async (
  reference: DocumentReference,
  load: () => Promise<PlayerMap>,
  now = Date.now()
): Promise<PlayerMap> => {
  const snapshot = await reference.get();
  const cached = snapshot.data();
  const cachedStats = cached?.playerMap as PlayerMap | undefined;
  const fetchedAt = Date.parse(cached?.fetchedAt);
  if (
    cachedStats &&
    Object.keys(cachedStats).length > 0 &&
    Number.isFinite(fetchedAt) &&
    fetchedAt <= now &&
    now - fetchedAt < NFLVERSE_CACHE_TTL_MS
  ) {
    return cachedStats;
  }

  const playerMap = await load();
  // Empty/future weeks must not hide newly published stats behind the TTL.
  if (Object.keys(playerMap).length > 0) {
    const timestamp = new Date(now).toISOString();
    if (isDeepStrictEqual(cachedStats, playerMap)) {
      // Do not upload an unchanged player map just to refresh its expiry.
      // The precondition prevents pairing this timestamp with a concurrent
      // refresh's different data. The next request can retry a conflict.
      await reference.update(
        { fetchedAt: timestamp },
        { lastUpdateTime: snapshot.updateTime! }
      );
    } else {
      await reference.set({ fetchedAt: timestamp, playerMap });
    }
  }
  return playerMap;
};
