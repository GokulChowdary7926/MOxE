export type SearchRecentEntry = {
  username: string;
  displayName: string;
  /** From explore/search when user opens a profile from results */
  profilePhoto?: string | null;
};

const RECENT_KEY = 'moxe_search_recent_v1';
const MAX_RECENT = 12;

export function loadSearchRecent(): SearchRecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: unknown) => x && typeof (x as SearchRecentEntry).username === 'string')
      .map((x: SearchRecentEntry) => {
        const username = (x.username || '').replace(/^@/, '').trim();
        const displayName = (x.displayName || username || '').trim() || username;
        const photo =
          typeof x.profilePhoto === 'string' && x.profilePhoto.trim() ? x.profilePhoto.trim() : undefined;
        return { username, displayName, ...(photo ? { profilePhoto: photo } : {}) };
      })
      .filter((x) => x.username)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveSearchRecent(entries: SearchRecentEntry[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

/** Add or move to front; username is normalized (no @). */
export function pushSearchRecent(
  username: string,
  displayName?: string,
  profilePhoto?: string | null,
): SearchRecentEntry[] {
  const u = username.replace(/^@/, '').trim().split(/\s+/)[0];
  if (!u) return loadSearchRecent();
  const prev = loadSearchRecent();
  const photo =
    typeof profilePhoto === 'string' && profilePhoto.trim() ? profilePhoto.trim() : undefined;
  const entry: SearchRecentEntry = {
    username: u,
    displayName: displayName?.trim() || u,
    ...(photo ? { profilePhoto: photo } : {}),
  };
  const next = [entry, ...prev.filter((r) => r.username !== u)].slice(0, MAX_RECENT);
  saveSearchRecent(next);
  return next;
}
