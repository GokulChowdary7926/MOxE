/**
 * Mock recent searches for Your Activity > Recent searches.
 * Types: user, hashtag, place
 */

export type RecentSearchType = 'user' | 'hashtag' | 'place';

export type RecentSearchEntry = {
  id: string;
  type: RecentSearchType;
  term: string;
  subtitle?: string; // e.g. "Account" or "Place" or "Tag"
  refId?: string; // user id, tag string, place id
};

export const mockRecentSearches: RecentSearchEntry[] = [
  { id: 'rs1', type: 'user', term: 'urban.explorer', subtitle: 'Account', refId: 'u2' },
  { id: 'rs2', type: 'hashtag', term: 'sunset', subtitle: 'Tag', refId: 'sunset' },
  { id: 'rs3', type: 'place', term: 'MOxE Coffee Lab', subtitle: 'Place', refId: 'pl1' },
  { id: 'rs4', type: 'user', term: 'coffee.and.code', subtitle: 'Account', refId: 'u3' },
  { id: 'rs5', type: 'hashtag', term: 'travel', subtitle: 'Tag', refId: 'travel' },
];
