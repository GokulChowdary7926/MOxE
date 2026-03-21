import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockUsers } from '../../mocks/users';
import { mockHashtags } from '../../mocks/hashtags';
import { mockPlaces } from '../../mocks/places';
import { mockReels } from '../../mocks/reels';
import { getApiBase, getToken } from '../../services/api';

type TabId = 'top' | 'accounts' | 'tags' | 'places' | 'audio';

type SearchUserRow = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

type ExploreSearchResponse = {
  users?: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null }[];
  hashtags?: { name: string; postCount?: number }[];
  posts?: unknown[];
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'tags', label: 'Tags' },
  { id: 'places', label: 'Places' },
  { id: 'audio', label: 'Audio' },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').toLowerCase().trim();
  const [tab, setTab] = useState<TabId>('top');
  const [inputValue, setInputValue] = useState(q);
  const [apiSearch, setApiSearch] = useState<ExploreSearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setInputValue(q);
  }, [q]);

  useEffect(() => {
    const token = getToken();
    if (!q || !token) {
      setApiSearch(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    fetch(`${getApiBase()}/explore/search?q=${encodeURIComponent(q)}&type=all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ExploreSearchResponse | null) => {
        if (!cancelled && data) setApiSearch(data);
        else if (!cancelled) setApiSearch(null);
      })
      .catch(() => {
        if (!cancelled) setApiSearch(null);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const token = getToken();

  const apiUsersAsRows: SearchUserRow[] = useMemo(() => {
    const users = apiSearch?.users;
    if (!users?.length) return [];
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      avatarUrl: u.profilePhoto || '/logo.png',
    }));
  }, [apiSearch]);

  const accounts = useMemo(() => {
    if (token && q) {
      if (searchLoading) return [];
      if (apiSearch !== null) return apiUsersAsRows;
    }
    if (!q) return mockUsers;
    return mockUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
    );
  }, [q, apiUsersAsRows, apiSearch, searchLoading, token]);

  const tags = useMemo(() => {
    if (token && q) {
      if (searchLoading) return [];
      if (apiSearch !== null) {
        return (apiSearch.hashtags ?? []).map((h) => ({
          tag: (h.name || '').replace(/^#/, ''),
          postCount: h.postCount ?? 0,
        }));
      }
    }
    if (!q) return mockHashtags;
    return mockHashtags.filter((h) => h.tag.toLowerCase().includes(q));
  }, [q, apiSearch, token, searchLoading]);

  const places = useMemo(() => {
    if (!q) return mockPlaces;
    return mockPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [q]);

  const audioList = useMemo(() => {
    const seen = new Set<string>();
    return mockReels
      .map((r) => ({ id: r.id, title: r.audioTitle, artist: r.audioArtist }))
      .filter((a) => {
        const key = `${a.title}-${a.artist}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return !q || a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q);
      });
  }, [q]);

  const topItems = useMemo(() => {
    const users = accounts.slice(0, 3);
    const hashtags = tags.slice(0, 2);
    const placesSlice = places.slice(0, 2);
    return { users, hashtags, places: placesSlice };
  }, [accounts, tags, places]);

  const hasResults =
    tab === 'top' &&
    (topItems.users.length > 0 || topItems.hashtags.length > 0 || topItems.places.length > 0) ||
    (tab === 'accounts' && accounts.length > 0) ||
    (tab === 'tags' && tags.length > 0) ||
    (tab === 'places' && places.length > 0) ||
    (tab === 'audio' && audioList.length > 0);

  return (
    <PageLayout title="Search" backTo="/explore">
      <div className="py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-moxe-textSecondary" />
          <input
            type="search"
            placeholder="Search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder-moxe-textSecondary text-moxe-body focus:outline-none focus:ring-1 focus:ring-moxe-primary"
            aria-label="Search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = inputValue.trim();
                setSearchParams(val ? { q: val } : {});
                setTab('top');
              }
            }}
          />
        </div>

        <div className="flex border-b border-moxe-border overflow-x-auto gap-0 -mx-4 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-3 px-4 text-moxe-body font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-moxe-text text-moxe-text'
                  : 'border-transparent text-moxe-textSecondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!hasResults && (
          <EmptyState
            title="No results found"
            message={q ? `No results for "${q}"` : 'Try searching for people, tags, or places.'}
          />
        )}

        {hasResults && tab === 'top' && (
          <div className="space-y-6">
            {topItems.users.length > 0 && (
              <section>
                <ThemedText secondary className="text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Accounts
                </ThemedText>
                <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
                  {topItems.users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.username}`}
                      className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
                    >
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <ThemedText className="text-moxe-body font-semibold text-moxe-text">
                          {user.username}
                        </ThemedText>
                        <ThemedText secondary className="text-moxe-caption">
                          {user.displayName}
                        </ThemedText>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {topItems.hashtags.length > 0 && (
              <section>
                <ThemedText secondary className="text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Tags
                </ThemedText>
                <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
                  {topItems.hashtags.map((h) => (
                    <Link
                      key={h.tag}
                      to={`/hashtag/${h.tag}`}
                      className="flex items-center justify-between py-3 px-4 active:bg-moxe-surface/80"
                    >
                      <ThemedText className="text-moxe-body font-medium text-moxe-text">
                        #{h.tag}
                      </ThemedText>
                      <ThemedText secondary className="text-moxe-caption">
                        {h.postCount.toLocaleString()} posts
                      </ThemedText>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {topItems.places.length > 0 && (
              <section>
                <ThemedText secondary className="text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Places
                </ThemedText>
                <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
                  {topItems.places.map((p) => (
                    <Link
                      key={p.id}
                      to={`/location/${p.id}`}
                      className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
                    >
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <ThemedText className="text-moxe-body font-medium text-moxe-text">
                          {p.name}
                        </ThemedText>
                        <ThemedText secondary className="text-moxe-caption">
                          {p.category} · {p.distanceKm} km
                        </ThemedText>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {hasResults && tab === 'accounts' && (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {accounts.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
              >
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <ThemedText className="text-moxe-body font-semibold text-moxe-text">
                    {user.username}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {user.displayName}
                  </ThemedText>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasResults && tab === 'tags' && (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {tags.map((h) => (
              <Link
                key={h.tag}
                to={`/hashtag/${h.tag}`}
                className="flex items-center justify-between py-3 px-4 active:bg-moxe-surface/80"
              >
                <ThemedText className="text-moxe-body font-medium text-moxe-text">
                  #{h.tag}
                </ThemedText>
                <ThemedText secondary className="text-moxe-caption">
                  {h.postCount.toLocaleString()} posts
                </ThemedText>
              </Link>
            ))}
          </div>
        )}

        {hasResults && tab === 'places' && (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {places.map((p) => (
              <Link
                key={p.id}
                to={`/location/${p.id}`}
                className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
              >
                <img
                  src={p.imageUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <ThemedText className="text-moxe-body font-medium text-moxe-text">
                    {p.name}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {p.category} · {p.distanceKm} km
                  </ThemedText>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasResults && tab === 'audio' && (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {audioList.map((a) => (
              <Link
                key={a.id}
                to="/audio/stub"
                className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
              >
                <div className="w-10 h-10 rounded-lg bg-moxe-border flex items-center justify-center">
                  <ThemedText className="text-moxe-caption text-moxe-textSecondary">♪</ThemedText>
                </div>
                <div>
                  <ThemedText className="text-moxe-body font-medium text-moxe-text">
                    {a.title}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {a.artist}
                  </ThemedText>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
