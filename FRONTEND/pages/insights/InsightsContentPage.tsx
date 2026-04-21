import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Filter, Play } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { MediaGridThumb } from '../../components/media/MediaGridThumb';

type TopContentRow = {
  id: string;
  type: 'post' | 'reel' | 'story';
  engagement: number;
  createdAt: string;
  analytics: { views: number; likes: number; comments: number } | null;
};

type CreatorAnalyticsPayload = {
  totals: { views: number };
  topContent: TopContentRow[];
};

type Enriched = { caption: string; thumb: string | null };

function firstMediaUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) return null;
  const m = media[0] as { url?: string; uri?: string };
  return m.url || m.uri || null;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InsightsContentPage() {
  const currentAccount = useCurrentAccount() as { id?: string } | null;
  const accountId = currentAccount?.id;
  const [contentFilter, setContentFilter] = useState<'all' | 'reels' | 'posts'>('all');
  const [rangeDays, setRangeDays] = useState<7 | 30>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topContent, setTopContent] = useState<TopContentRow[]>([]);
  const [totals, setTotals] = useState<{ views: number } | null>(null);
  const [enriched, setEnriched] = useState<Record<string, Enriched>>({});

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setTopContent([]);
      setTotals(null);
      setError('Sign in to view content insights.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = new Date();
      from.setDate(from.getDate() - rangeDays);
      const qs = `from=${encodeURIComponent(from.toISOString())}`;
      const res = await fetch(`${getApiBase()}/analytics/creator?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setTopContent([]);
        setTotals(null);
        setError(await readApiError(res).catch(() => 'Could not load analytics'));
        return;
      }
      const data = (await res.json()) as CreatorAnalyticsPayload;
      setTopContent(Array.isArray(data.topContent) ? data.topContent : []);
      setTotals(data.totals ?? null);
    } catch (e: unknown) {
      setTopContent([]);
      setTotals(null);
      setError(e instanceof Error ? e.message : 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return topContent.filter((row) => {
      if (contentFilter === 'all') return true;
      if (contentFilter === 'reels') return row.type === 'reel';
      return row.type === 'post' || row.type === 'story';
    });
  }, [topContent, contentFilter]);

  useEffect(() => {
    if (loading) return;
    const token = getToken();
    if (!token) {
      setEnriched({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const out: Record<string, Enriched> = {};
      const posts = filtered.filter((r) => r.type === 'post');
      await Promise.all(
        posts.map(async (r) => {
          try {
            const res = await fetch(`${getApiBase()}/posts/${encodeURIComponent(r.id)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              out[r.id] = { caption: '', thumb: null };
              return;
            }
            const p = (await res.json()) as { caption?: string | null; media?: unknown };
            out[r.id] = { caption: p.caption?.trim() || '', thumb: firstMediaUrl(p.media) };
          } catch {
            out[r.id] = { caption: '', thumb: null };
          }
        }),
      );

      const reels = filtered.filter((r) => r.type === 'reel');
      if (reels.length && accountId) {
        try {
          const res = await fetch(
            `${getApiBase()}/reels?accountId=${encodeURIComponent(accountId)}&limit=100`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const pack = (await res.json()) as {
            items?: { id: string; thumbnail?: string; caption?: string | null }[];
          };
          const items = pack.items ?? [];
          for (const r of reels) {
            const hit = items.find((x) => x.id === r.id);
            out[r.id] = {
              caption: hit?.caption?.trim() || '',
              thumb: hit?.thumbnail ?? null,
            };
          }
        } catch {
          for (const r of reels) {
            if (!out[r.id]) out[r.id] = { caption: '', thumb: null };
          }
        }
      } else {
        for (const r of reels) {
          out[r.id] = { caption: '', thumb: null };
        }
      }

      for (const r of filtered.filter((x) => x.type === 'story')) {
        out[r.id] = { caption: 'Story', thumb: null };
      }

      if (!cancelled) setEnriched(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [filtered, loading, accountId]);

  const toPath = (row: TopContentRow): string => {
    if (row.type === 'post') return `/post/${row.id}`;
    if (row.type === 'reel') return `/reels`;
    return '/';
  };

  return (
    <SettingsPageShell title="Content" backTo="/insights">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#262626] flex-wrap">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-sm ${contentFilter === 'all' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
          onClick={() => setContentFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-sm ${contentFilter === 'reels' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
          onClick={() => setContentFilter('reels')}
        >
          Reels
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-sm ${contentFilter === 'posts' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
          onClick={() => setContentFilter('posts')}
        >
          Posts
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-sm ${rangeDays === 7 ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
          onClick={() => setRangeDays(7)}
        >
          7 days
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-lg text-sm ${rangeDays === 30 ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
          onClick={() => setRangeDays(30)}
        >
          30 days
        </button>
        <button type="button" className="ml-auto p-2 text-[#a8a8a8]" aria-label="Filter">
          <Filter className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between mb-4 gap-2">
          <h2 className="text-white font-bold text-xl">Views</h2>
          {totals && !loading && !error && (
            <span className="text-[#a8a8a8] text-sm">{formatViews(totals.views)} total</span>
          )}
        </div>
        {loading && <p className="text-[#737373] text-sm">Loading…</p>}
        {error && !loading && <p className="text-[#a8a8a8] text-sm">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-[#737373] text-sm">No content in this period yet.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {!loading &&
            !error &&
            filtered.map((item) => {
              const views = item.analytics?.views ?? 0;
              const meta = enriched[item.id];
              const caption =
                meta?.caption ||
                (item.type === 'story' ? 'Story' : item.type === 'reel' ? 'Reel' : 'Post');
              const thumb = meta?.thumb;
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={toPath(item)}
                  className="aspect-[9/16] rounded-lg bg-[#262626] overflow-hidden relative block"
                >
                  {thumb ? (
                    <MediaGridThumb url={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute top-2 right-2 text-white/90 text-xs flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {item.type === 'reel' ? 'Reel' : item.type === 'story' ? 'Story' : 'Post'}
                  </span>
                  <p className="absolute left-2 right-2 top-2 text-white text-xs line-clamp-2">{caption}</p>
                  <p className="absolute bottom-2 left-2 text-white font-semibold text-sm">{formatViews(views)}</p>
                </Link>
              );
            })}
        </div>
      </div>
    </SettingsPageShell>
  );
}
