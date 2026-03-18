/**
 * Favorites feed – posts from accounts the user marked as Favorites.
 * E2E: GET /posts/feed/favorites, same feed UI as Home.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';
import { getApiBase, getToken } from '../../services/api';
import { MobileShell } from '../../components/layout/MobileShell';
import { ChevronLeft, Star } from 'lucide-react';

type FeedItem = {
  id: string;
  author: { username: string; displayName?: string | null; avatarUri?: string | null };
  mediaUrls: string[];
  caption?: string | null;
  locationName?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  isLiked: boolean;
  isSaved: boolean;
  screenshotProtection?: boolean;
  adCampaignId?: string;
  sponsorAccountId?: string;
};

export default function FavoritesFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${getApiBase()}/posts/feed/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Unable to load favorites feed.');
          setItems([]);
          return;
        }
        const raw = data.items ?? data.feed ?? data;
        const mapped: FeedItem[] = Array.isArray(raw)
          ? raw.map((p: any) => {
              const mediaArray: string[] =
                Array.isArray(p.media) && p.media.length
                  ? p.media.map((m: any) => m.url || m.uri || m.mediaUrl).filter(Boolean)
                  : [p.mediaUrl ?? p.media_uri ?? ''].filter(Boolean);
              return {
                id: p.id,
                author: {
                  username: p.author?.username ?? 'unknown',
                  displayName: p.author?.displayName ?? null,
                  avatarUri: p.author?.avatarUrl ?? p.author?.avatarUri ?? null,
                },
                mediaUrls: mediaArray.length ? mediaArray : [''],
                caption: p.caption ?? null,
                locationName: p.locationName ?? p.location ?? null,
                likeCount: p.likeCount ?? p.likesCount ?? 0,
                commentCount: p.commentCount ?? p.commentsCount ?? 0,
                shareCount: p.shareCount ?? p.sharesCount ?? 0,
                isLiked: !!p.viewerHasLiked,
                isSaved: !!p.viewerHasSaved,
                screenshotProtection: !!p.screenshotProtection,
                adCampaignId: p.adCampaignId ?? undefined,
                sponsorAccountId: p.accountId ?? undefined,
              };
            })
          : [];
        setItems(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load favorites.');
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
  }, [navigate]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-white/10 bg-black/90 safe-area-pt">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -m-2 text-white"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-center flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-[#facc15]" fill="currentColor" />
            Favorites
          </span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          {error && (
            <p className="px-4 py-4 text-sm text-red-400">{error}</p>
          )}
          {loading && (
            <p className="px-4 py-4 text-sm text-[#8e8e8e]">Loading favorites feed…</p>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="px-4 py-8 text-center text-[#8e8e8e]">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No posts from Favorites yet.</p>
              <p className="text-xs mt-1">Mark accounts as Favorites in Settings → Privacy to see their posts here.</p>
            </div>
          )}
          {!loading &&
            items.map((p) => (
              <article key={p.id} className="pt-0 pb-4">
                <FeedPost
                  id={p.id}
                  author={{ ...p.author, displayName: p.author?.displayName ?? undefined }}
                  location={p.locationName ?? undefined}
                  mediaUris={p.mediaUrls}
                  caption={p.caption ?? undefined}
                  likeCount={p.likeCount}
                  commentCount={p.commentCount}
                  shareCount={p.shareCount}
                  isLiked={p.isLiked}
                  isSaved={p.isSaved}
                  screenshotProtection={p.screenshotProtection}
                  adCampaignId={p.adCampaignId}
                  sponsorAccountId={p.sponsorAccountId}
                  variant="dark"
                />
              </article>
            ))}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
