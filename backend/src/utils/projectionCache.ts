export const projectionPositions = ["qb", "rb", "wr", "te", "k"] as const;
export const PROJECTION_CACHE_VERSION = 3;
export const PROJECTION_CACHE_TTL_MS = 15 * 60 * 1000;
// Require broad coverage at every fantasy position, not an ADP-only feed
// or a truncated preview.
export const MIN_PROJECTIONS_PER_POSITION = 11;

export const readProjectionCache = (
  data: unknown,
  now = Date.now()
): Record<string, number> | null => {
  if (!data || typeof data !== "object") return null;
  const cache = data as Record<string, unknown>;
  if (
    cache.version !== PROJECTION_CACHE_VERSION ||
    cache.source !== "sleeper" ||
    typeof cache.fetchedAt !== "number" ||
    !Number.isFinite(cache.fetchedAt) ||
    cache.fetchedAt > now ||
    now - cache.fetchedAt >= PROJECTION_CACHE_TTL_MS
  ) {
    return null;
  }
  const counts = cache.positionCounts as Record<string, number> | undefined;
  if (
    !counts ||
    projectionPositions.some(
      (pos) =>
        !Number.isInteger(counts[pos]) ||
        counts[pos] < MIN_PROJECTIONS_PER_POSITION
    )
  )
    return null;
  const projections = cache.projections;
  if (
    !projections ||
    typeof projections !== "object" ||
    Array.isArray(projections)
  )
    return null;
  const entries = Object.entries(projections);
  if (
    entries.length !==
      projectionPositions.reduce((sum, pos) => sum + counts[pos], 0) ||
    entries.some(
      ([name, value]) =>
        !name || typeof value !== "number" || !Number.isFinite(value)
    )
  ) {
    return null;
  }
  return projections as Record<string, number>;
};
