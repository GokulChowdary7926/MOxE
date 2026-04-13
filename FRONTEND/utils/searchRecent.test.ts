import { describe, it, expect, beforeEach } from '@jest/globals';
import { loadSearchRecent, pushSearchRecent, saveSearchRecent } from './searchRecent';

describe('searchRecent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadSearchRecent returns empty array when unset', () => {
    expect(loadSearchRecent()).toEqual([]);
  });

  it('saveSearchRecent and loadSearchRecent round-trip', () => {
    const entries = [
      { username: 'alice', displayName: 'Alice', profilePhoto: 'https://x.test/a.jpg' },
      { username: 'bob', displayName: 'Bob' },
    ];
    saveSearchRecent(entries);
    expect(loadSearchRecent()).toEqual(entries);
  });

  it('pushSearchRecent strips @ and moves duplicate to front', () => {
    saveSearchRecent([{ username: 'bob', displayName: 'Bob' }]);
    const next = pushSearchRecent('@alice', 'Alice');
    expect(next[0]).toEqual({ username: 'alice', displayName: 'Alice' });
    expect(next[1]).toEqual({ username: 'bob', displayName: 'Bob' });
    const again = pushSearchRecent('bob', 'Bobby', 'https://x.test/b.jpg');
    expect(again[0]).toEqual({
      username: 'bob',
      displayName: 'Bobby',
      profilePhoto: 'https://x.test/b.jpg',
    });
    expect(again.find((e) => e.username === 'alice')).toBeDefined();
  });

  it('pushSearchRecent ignores empty username', () => {
    saveSearchRecent([{ username: 'x', displayName: 'X' }]);
    expect(pushSearchRecent('  ', 'Nope')).toEqual([{ username: 'x', displayName: 'X' }]);
  });

  it('caps at 12 entries', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      username: `u${i}`,
      displayName: `U${i}`,
    }));
    saveSearchRecent(many);
    expect(loadSearchRecent().length).toBe(12);
  });
});
