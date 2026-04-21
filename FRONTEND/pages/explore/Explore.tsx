import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Layers, Clapperboard } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';
import { normalizeToArray } from '../../utils/safeAccess';
import { getFirstMediaUrl, ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { MediaGridThumb } from '../../components/media/MediaGridThumb';
import {
  loadSearchRecent,
  saveSearchRecent,
  pushSearchRecent,
  type SearchRecentEntry,
} from '../../utils/searchRecent';

type ExploreItem = {
  id: string;
  kind: 'post' | 'reel';
  thumbUrl: string;
  screenshotProtection?: boolean;
  viewCount?: number;
};

/** Mobile type scale: section 13px / row title 14px / meta 12px / input 15px */

function recentAvatarInitial(displayName: string, username: string): string {
  const s = (displayName || username || '?').trim();
  const ch = s.charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

/**
 * Explore — mobile search bar + vertical recent list + masonry grid.
 */
export default function Explore() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<SearchRecentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setRecent(loadSearchRecent());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const token = getToken();
      const API_BASE = getApiBase();

      const mapToItems = (list: any[]): ExploreItem[] =>
        list
          .map((p: any) => {
            const kind: 'post' | 'reel' =
              p._exploreKind === 'reel' ||
              (typeof p.video === 'string' && p.video.length > 0 && !Array.isArray(p.media))
                ? 'reel'
                : 'post';
            const thumbUrl =
              kind === 'reel'
                ? p.thumbnail || p.thumbUrl || p.video || ''
                : getFirstMediaUrl(p) || (p.mediaUrl ?? p.thumbUrl ?? '');
            return {
              id: p.id,
              kind,
              thumbUrl,
              screenshotProtection: !!p.screenshotProtection,
              viewCount: p.viewCount ?? p.likeCount ?? p.likes ?? 0,
            };
          })
          .filter((i) => i.thumbUrl);

      /** Backend `/ranking/explore` returns scores `{ itemId: "POST:uuid"|"REEL:uuid", score }`. */
      async function hydrateRankingContent(raw: any[]): Promise<any[]> {
        const postIds: string[] = [];
        const reelIds: string[] = [];
        for (const x of raw) {
          if (x?.id && (x.media != null || x.caption !== undefined) && !x.video) {
            postIds.push(String(x.id));
            continue;
          }
          if (x?.id && x.video) {
            reelIds.push(String(x.id));
            continue;
          }
          const key = x?.itemId ?? x?.contentId;
          if (!key || typeof key !== 'string') continue;
          const [type, id] = key.split(':');
          if (type === 'POST' && id) postIds.push(id);
          else if (type === 'REEL' && id) reelIds.push(id);
        }
        const uniquePosts = [...new Set(postIds)].slice(0, 40);
        const uniqueReels = [...new Set(reelIds)].slice(0, 40);
        if (!uniquePosts.length && !uniqueReels.length) return [];
        const headers = { Authorization: `Bearer ${token}` };
        const [posts, reels] = await Promise.all([
          Promise.all(
            uniquePosts.map((id) =>
              fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, { headers }).then((r) => (r.ok ? r.json() : null)),
            ),
          ),
          Promise.all(
            uniqueReels.map((id) =>
              fetch(`${API_BASE}/reels/${encodeURIComponent(id)}`, { headers }).then((r) => (r.ok ? r.json() : null)),
            ),
          ),
        ]);
        const out: any[] = [];
        for (const p of posts) {
          if (p) out.push({ ...p, _exploreKind: 'post' });
        }
        for (const r of reels) {
          if (r) out.push({ ...r, _exploreKind: 'reel' });
        }
        return out;
      }

      try {
        if (token) {
          let list: any[] = [];
          const q = '?limit=40';
          const rankingRes = await fetch(`${API_BASE}/ranking/explore${q}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rankingRes.ok) {
            const rankingData = await rankingRes.json().catch(() => ({}));
            const raw = normalizeToArray(rankingData.items ?? rankingData) as any[];
            const first = raw[0] as { itemId?: string; id?: string } | undefined;
            if (raw.length && first?.itemId != null && first?.id == null) {
              list = await hydrateRankingContent(raw);
            } else {
              list = raw;
            }
          }
          if (cancelled) return;
          if (list.length > 0) {
            const mapped = mapToItems(list);
            if (mapped.length > 0) {
              setItems(mapped);
              return;
            }
          }

          const feedRes = await fetch(`${API_BASE}/posts/feed`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const feedData = await feedRes.json().catch(() => ({}));
          if (cancelled) return;
          if (feedRes.ok) {
            const feedList = normalizeToArray(feedData.items ?? feedData.feed ?? feedData);
            const mappedFeed = mapToItems(feedList);
            if (mappedFeed.length > 0) {
              setItems(mappedFeed);
              return;
            }
          }

          const discoverRes = await fetch(`${API_BASE}/explore/discover?limit=40`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const discoverData = await discoverRes.json().catch(() => ({}));
          if (cancelled) return;
          if (discoverRes.ok) {
            const discoverList = normalizeToArray(discoverData.posts ?? discoverData);
            const mappedDiscover = mapToItems(discoverList);
            if (mappedDiscover.length > 0) {
              setItems(mappedDiscover);
              return;
            }
          }

          const searchRes = await fetch(`${API_BASE}/explore/search?type=posts&q=${encodeURIComponent('a')}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const searchData = await searchRes.json().catch(() => ({}));
          if (cancelled) return;
          if (searchRes.ok) {
            const postList = normalizeToArray(searchData.posts ?? searchData.items ?? searchData);
            const mappedSearch = mapToItems(postList);
            if (mappedSearch.length > 0) {
              setItems(mappedSearch);
              return;
            }
          }

          setItems([]);
        } else {
          setItems([]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load explore.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearRecent = () => {
    setRecent([]);
    saveSearchRecent([]);
  };

  const removeRecent = (username: string) => {
    const next = recent.filter((r) => r.username !== username);
    setRecent(next);
    saveSearchRecent(next);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const next = pushSearchRecent(q, q);
    setRecent(next);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const tileMeta = useMemo(() => {
    return items.map((it, i) => {
      const tall = i % 7 === 2 || i % 7 === 5;
      const carousel = i % 4 !== 1;
      const reel = it.kind === 'reel' || tall || i % 6 === 0;
      return { tall, carousel, reel };
    });
  }, [items]);

  return (
    <ThemedView className="flex flex-1 flex-col min-h-0 w-full bg-black overflow-hidden">
      {/* MOxE search header: dark bar + gray pill */}
      <header className="shrink-0 px-3 pt-2.5 pb-2.5 safe-area-pt bg-black border-b border-[#262626]">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center min-w-0 rounded-xl bg-[#262626] pl-3 pr-2 h-9 border border-[#363636]">
            <Search className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              enterKeyHint="search"
              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none focus:ring-0 text-[15px] text-moxe-text placeholder:text-[#8e8e8e] px-2"
              aria-label="Search"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-moxe-textSecondary active:bg-white/10"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </form>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-black touch-pan-y">
        {recent.length > 0 && (
          <section className="border-b border-[#262626] px-3 pt-2 pb-1">
            <div className="flex items-center justify-between py-1">
              <h2 className="text-[13px] font-semibold text-white leading-tight">Recent</h2>
              <button
                type="button"
                onClick={clearRecent}
                className="text-[12px] font-semibold text-moxe-primary active:opacity-70 py-1"
              >
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-[#262626]">
              {recent.map((entry) => {
                const av = entry.profilePhoto?.trim();
                const initial = recentAvatarInitial(entry.displayName, entry.username);
                return (
                  <li key={entry.username} className="flex items-center gap-2 min-h-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(entry.username)}`)}
                      className="flex flex-1 items-center gap-2.5 py-2.5 min-w-0 text-left active:bg-white/5 rounded-lg -mx-1 px-1"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#262626] border border-[#363636] shrink-0 overflow-hidden flex items-center justify-center">
                        {av ? (
                          <img src={ensureAbsoluteMediaUrl(av)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[13px] font-semibold text-[#a8a8a8]" aria-hidden>
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-white leading-snug truncate">
                          {entry.displayName}
                        </p>
                        <p className="text-[12px] text-[#a8a8a8] leading-snug truncate">@{entry.username}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(entry.username)}
                      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#a8a8a8] active:bg-white/10"
                      aria-label={`Remove ${entry.username}`}
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {loading && (
          <div className="flex items-center justify-center min-h-[120px]">
            <ThemedText secondary className="text-[12px] text-[#8e8e8e]">
              Loading…
            </ThemedText>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center min-h-[120px] gap-2 px-4">
            <ThemedText secondary className="text-[12px] text-center text-[#8e8e8e]">
              {error}
            </ThemedText>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[160px] px-4">
            <p className="text-[12px] text-center text-[#8e8e8e]">No explore posts yet.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="columns-3 gap-[2px] px-[2px] pt-2 pb-24">
            {items.map((item, i) => {
              const meta = tileMeta[i] ?? { tall: false, carousel: false, reel: false };
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() =>
                    item.kind === 'reel' ? navigate('/reels') : navigate(`/post/${item.id}`)
                  }
                  className={`relative mb-[2px] w-full break-inside-avoid overflow-hidden bg-[#111] block ${
                    meta.tall ? 'aspect-[3/5]' : 'aspect-square'
                  }`}
                >
                  <div
                    className="w-full h-full"
                    onContextMenu={(e) => {
                      if (item.screenshotProtection) e.preventDefault();
                    }}
                  >
                    <MediaGridThumb
                      url={item.thumbUrl}
                      alt=""
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                  {meta.carousel && (
                    <span className="absolute top-1 right-1 text-white drop-shadow-md">
                      <Layers className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  )}
                  {meta.reel && (
                    <span className="absolute bottom-1 left-1 text-white drop-shadow-md">
                      <Clapperboard className="w-3.5 h-3.5" strokeWidth={2} />
                    </span>
                  )}
                  {item.viewCount != null && item.viewCount > 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-1 py-0.5 text-left text-[9px] text-white font-semibold tabular-nums">
                      {(() => {
                        const n = item.viewCount as number;
                        if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
                        if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
                        return String(n);
                      })()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
