import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Plus, Eye, Bookmark } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import { Avatar } from '../../components/ui/Avatar';
import { MediaGridThumb } from '../../components/media/MediaGridThumb';

const TABS = ['Reels', 'Audio', 'Accounts'] as const;

type RankedReel = {
  id: string;
  caption: string | null;
  thumbnail: string;
  video: string;
  views?: number;
  account: {
    id: string;
    username: string;
    displayName: string | null;
    profilePhoto: string | null;
    verifiedBadge?: boolean | null;
  };
};

type DiscoverPost = {
  id: string;
  media?: unknown;
  caption?: string | null;
  account?: { username: string };
};

function firstPostThumb(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) return null;
  const m = media[0] as { url?: string; uri?: string };
  return m.url || m.uri || null;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InsightsInspirationPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Reels');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reels, setReels] = useState<RankedReel[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<DiscoverPost[]>([]);
  const [audioItems, setAudioItems] = useState<{ id: string; title: string; artist: string | null; usageCount: number }[]>(
    [],
  );

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setReels([]);
      setDiscoverPosts([]);
      setAudioItems([]);
      setError('Sign in to browse inspiration.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [reelRes, discRes, audioRes] = await Promise.all([
        fetch(`${getApiBase()}/ranking/reels?limit=12`, { headers }),
        fetch(`${getApiBase()}/explore/discover?limit=6`, { headers }),
        fetch(`${getApiBase()}/creator/trending-audio?limit=24`, { headers }),
      ]);

      if (!reelRes.ok) {
        setReels([]);
      } else {
        const pack = (await reelRes.json()) as { reels?: RankedReel[] };
        setReels(Array.isArray(pack.reels) ? pack.reels : []);
      }

      if (discRes.ok) {
        const p = (await discRes.json()) as { posts?: DiscoverPost[] };
        setDiscoverPosts(Array.isArray(p.posts) ? p.posts : []);
      } else {
        setDiscoverPosts([]);
      }

      if (audioRes.ok) {
        const a = (await audioRes.json()) as {
          items?: { id: string; title: string; artist: string | null; usageCount: number }[];
        };
        setAudioItems(Array.isArray(a.items) ? a.items : []);
      } else {
        setAudioItems([]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load inspiration');
      setReels([]);
      setDiscoverPosts([]);
      setAudioItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const suggestedAccounts = useMemo(() => {
    const m = new Map<
      string,
      { id: string; username: string; displayName: string | null; profilePhoto: string | null; verifiedBadge?: boolean | null }
    >();
    for (const r of reels) {
      const a = r.account;
      if (a?.id && !m.has(a.id)) m.set(a.id, a);
    }
    return [...m.values()].slice(0, 20);
  }, [reels]);

  return (
    <SettingsPageShell title="Inspiration" backTo="/insights" right={<button type="button" className="p-1 text-white" aria-label="Add"><Plus className="w-5 h-5" /></button>}>
      <div className="flex gap-2 px-4 py-3 border-b border-[#262626]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-moxe-border text-moxe-text font-semibold' : 'bg-moxe-surface text-moxe-textSecondary border border-moxe-border'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="px-4 py-4 text-[#737373] text-sm">Loading…</p>}
      {error && !loading && <p className="px-4 py-4 text-[#a8a8a8] text-sm">{error}</p>}

      <div className="px-4 py-4">
        {tab === 'Reels' && !loading && !error && (
          <>
            <h2 className="text-white font-semibold mb-3">Popular reels for you</h2>
            {reels.length === 0 ? (
              <p className="text-[#737373] text-sm mb-6">No reels to show yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {reels.map((r) => (
                  <Link
                    key={r.id}
                    to="/reels"
                    className="flex-shrink-0 w-[200px] aspect-[9/16] rounded-xl bg-[#262626] overflow-hidden relative"
                  >
                    {r.thumbnail ? (
                      <MediaGridThumb url={r.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <p className="absolute top-2 left-2 right-2 text-white text-xs font-medium line-clamp-2">
                      {r.caption || `@${r.account?.username ?? 'reel'}`}
                    </p>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-white text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {formatViews(r.views ?? 0)}
                      </span>
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <h2 className="text-white font-semibold mt-6 mb-3">Suggested for you</h2>
            {discoverPosts.length === 0 ? (
              <p className="text-[#737373] text-sm">No suggested posts yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {discoverPosts.map((p) => {
                  const thumb = firstPostThumb(p.media);
                  return (
                    <Link
                      key={p.id}
                      to={`/post/${p.id}`}
                      className="aspect-[9/16] rounded-xl bg-[#262626] overflow-hidden relative block"
                    >
                      {thumb ? (
                        <MediaGridThumb url={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <p className="absolute bottom-2 left-2 right-2 text-white text-xs line-clamp-2">
                        {p.caption || p.account?.username || 'Post'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
        {tab === 'Audio' && !loading && !error && (
          <div className="space-y-3">
            {audioItems.length === 0 ? (
              <p className="text-[#737373] text-sm">No trending audio yet.</p>
            ) : (
              audioItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-[#363636]"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#363636] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.title}</p>
                    <p className="text-[#a8a8a8] text-xs truncate">
                      {item.artist || 'Unknown'} · {item.usageCount.toLocaleString()} uses
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === 'Accounts' && !loading && !error && (
          <>
            <h2 className="text-white font-semibold mb-3">Creators from your reel feed</h2>
            {suggestedAccounts.length === 0 ? (
              <p className="text-[#737373] text-sm">No accounts to suggest yet.</p>
            ) : (
              <div className="space-y-2">
                {suggestedAccounts.map((acc) => (
                  <Link
                    key={acc.id}
                    to={`/profile/${acc.username}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-transparent hover:border-[#363636]"
                  >
                    <Avatar uri={acc.profilePhoto} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium flex items-center gap-1">
                        {acc.username}{' '}
                        {acc.verifiedBadge ? <span className="text-[#0095f6]">✓</span> : null}
                      </p>
                      <p className="text-[#a8a8a8] text-xs truncate">{acc.displayName || ' '}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
