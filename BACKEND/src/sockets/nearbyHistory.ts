export const NEARBY_HISTORY_MAX = 5000;
export const NEARBY_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

export function pruneNearbyHistoryEntries<T extends { at: number }>(
  entries: T[],
  now = Date.now(),
  ttlMs = NEARBY_HISTORY_TTL_MS,
  maxEntries = NEARBY_HISTORY_MAX,
): T[] {
  const kept = entries.filter((entry) => now - entry.at <= ttlMs);
  if (kept.length <= maxEntries) return kept;
  return kept.slice(kept.length - maxEntries);
}
