import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { getApiBase, getToken, recordLinkOpenServer, recordRecentSearchServer } from '../../services/api';
import { pushSearchRecent } from '../../utils/searchRecent';

type TabId = 'top' | 'accounts' | 'tags' | 'places' | 'audio';

type SearchUserRow = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  /** Only when returned by API — used for Explore recent avatars, not the /logo.png fallback */
  apiProfilePhoto?: string | null;
};

type ExploreSearchResponse = {
  users?: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null }[];
  hashtags?: { name: string; postCount?: number }[];
  posts?: unknown[];
};

type ApiPlace = { id: string; name: string };

type PlaceRow = {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  distanceKm: string;
};

type AudioRow = { id: string; title: string; artist: string; spotifyUrl: string };

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
  const [apiPlaces, setApiPlaces] = useState<ApiPlace[]>([]);
  const [apiAudio, setApiAudio] = useState<AudioRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setInputValue(q);
  }, [q]);

  useEffect(() => {
    const token = getToken();
    if (!q || !token) {
      setApiSearch(null);
      setApiPlaces([]);
      setApiAudio([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const base = getApiBase();
    Promise.allSettled([
      fetch(`${base}/explore/search?q=${encodeURIComponent(q)}&type=all`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${base}/location/search?q=${encodeURIComponent(q)}&limit=15`, { headers }).then((r) =>
        r.ok ? r.json() : { places: [] },
      ),
      fetch(`${base}/spotify/search?q=${encodeURIComponent(q)}&limit=15`).then((r) =>
        r.ok ? r.json() : { tracks: [] },
      ),
    ]).then((outcomes) => {
      if (cancelled) return;
      const searchData =
        outcomes[0].status === 'fulfilled'
          ? (outcomes[0].value as ExploreSearchResponse | null)
          : null;
      const locData =
        outcomes[1].status === 'fulfilled'
          ? (outcomes[1].value as { places?: ApiPlace[] })
          : { places: [] };
      const spotData =
        outcomes[2].status === 'fulfilled'
          ? (outcomes[2].value as { tracks?: { id: string; name: string; artists: string }[] })
          : { tracks: [] };
      setApiSearch(searchData);
      setApiPlaces(Array.isArray(locData?.places) ? locData.places : []);
      const tracks = spotData?.tracks ?? [];
      setApiAudio(
        tracks.map((t) => ({
          id: t.id,
          title: t.name,
          artist: t.artists || '',
          spotifyUrl: `https://open.spotify.com/track/${t.id}`,
        })),
      );
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
      apiProfilePhoto: u.profilePhoto ?? null,
      avatarUrl: u.profilePhoto || '/logo.png',
    }));
  }, [apiSearch]);

  const accounts = useMemo(() => {
    if (!token || !q) return [];
    if (searchLoading) return [];
    return apiUsersAsRows;
  }, [q, apiUsersAsRows, searchLoading, token]);

  const tags = useMemo(() => {
    if (!token || !q) return [];
    if (searchLoading) return [];
    return (apiSearch?.hashtags ?? []).map((h) => ({
      tag: (h.name || '').replace(/^#/, ''),
      postCount: h.postCount ?? 0,
    }));
  }, [q, apiSearch, token, searchLoading]);

  const places = useMemo((): PlaceRow[] => {
    if (!token || !q) return [];
    if (searchLoading) return [];
    return apiPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: '/logo.png',
      category: 'Location',
      distanceKm: '—',
    }));
  }, [q, apiPlaces, searchLoading, token]);

  const audioList = useMemo(() => {
    if (!token || !q) return [];
    if (searchLoading) return [];
    return apiAudio;
  }, [q, apiAudio, searchLoading, token]);

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
    <PageLayout title="Search" backTo="/explore" className="bg-black">
      <div className="py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e] pointer-events-none" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#8e8e8e] text-[15px] focus:outline-none focus:ring-1 focus:ring-moxe-primary"
            aria-label="Search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = inputValue.trim();
                if (val) {
                  pushSearchRecent(val, val);
                  recordRecentSearchServer('query', val);
                }
                setSearchParams(val ? { q: val } : {});
                setTab('top');
              }
            }}
          />
        </div>

        <div className="flex border-b border-moxe-border overflow-x-auto gap-0 no-scrollbar -mx-3 px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`py-2.5 px-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
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
            message={
              !token
                ? 'Sign in to search people, tags, places, and music.'
                : q
                  ? `No results for "${q}"`
                  : 'Try searching for people, tags, or places.'
            }
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
                      onClick={() => {
                        pushSearchRecent(user.username, user.displayName, user.apiProfilePhoto);
                        recordRecentSearchServer('user', user.username, user.id);
                      }}
                      className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
                    >
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <ThemedText className="text-moxe-body font-semibold text-moxe-text">
                          {user.displayName}
                        </ThemedText>
                        <ThemedText secondary className="text-moxe-caption">
                          @{user.username}
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
                      onClick={() => recordRecentSearchServer('hashtag', h.tag, h.tag)}
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
                      key={p.id + p.name}
                      to={`/location/${encodeURIComponent(p.name)}`}
                      onClick={() => recordRecentSearchServer('place', p.name, p.id)}
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
                onClick={() => {
                  pushSearchRecent(user.username, user.displayName, user.apiProfilePhoto);
                  recordRecentSearchServer('user', user.username, user.id);
                }}
                className="flex items-center gap-3 py-3 px-4 active:bg-moxe-surface/80"
              >
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <ThemedText className="text-moxe-body font-semibold text-moxe-text">
                    {user.displayName}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    @{user.username}
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
                onClick={() => recordRecentSearchServer('hashtag', h.tag, h.tag)}
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
                to={`/location/${encodeURIComponent(p.name)}`}
                onClick={() => recordRecentSearchServer('place', p.name, p.id)}
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
              <a
                key={a.id}
                href={a.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordLinkOpenServer(a.spotifyUrl, `${a.title} — ${a.artist}`)}
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
              </a>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
