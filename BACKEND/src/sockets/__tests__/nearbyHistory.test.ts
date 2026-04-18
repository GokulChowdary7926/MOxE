import { pruneNearbyHistoryEntries } from '../nearbyHistory';

describe('nearby history retention', () => {
  it('drops entries older than TTL and keeps recent ones', () => {
    const now = Date.now();
    const ttl = 24 * 60 * 60 * 1000;
    const entries = [
      { at: now - ttl - 1, id: 'expired' },
      { at: now - ttl + 1, id: 'kept-edge' },
      { at: now - 1000, id: 'recent' },
    ];

    const result = pruneNearbyHistoryEntries(entries, now, ttl, 5000);
    expect(result.map((e) => e.id)).toEqual(['kept-edge', 'recent']);
  });

  it('enforces max history size by keeping newest entries', () => {
    const now = Date.now();
    const ttl = 24 * 60 * 60 * 1000;
    const entries = Array.from({ length: 6 }, (_, i) => ({
      at: now - (6 - i) * 1000,
      id: `m${i + 1}`,
    }));

    const result = pruneNearbyHistoryEntries(entries, now, ttl, 3);
    expect(result.map((e) => e.id)).toEqual(['m4', 'm5', 'm6']);
  });
});
