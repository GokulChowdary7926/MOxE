/**
 * Favorites feed – posts from accounts the user marked as Favorites.
 * E2E: GET /posts/feed/favorites, same feed UI as Home.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';
import { getApiBase, getToken } from '../../services/api';
import { feedAuthorFromApiItem } from '../../utils/feedAuthorFromApiItem';
import { MobileShell } from '../../components/layout/MobileShell';
import { ChevronLeft, Star } from 'lucide-react';
import { fetchClientSettings } from '../../services/clientSettings';

type FeedItem = {
  id: string;
  authorAccountId?: string;
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
  allowComments?: boolean;
  hideLikeCount?: boolean;
};

export default function FavoritesFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideEngagementCounts, setHideEngagementCounts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((settings) => {
        if (cancelled) return;
        setHideEngagementCounts(!!settings.socialCounts?.hideLikeAndShareCounts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
              const authorFields = feedAuthorFromApiItem(p as Record<string, unknown>);
              return {
                id: p.id,
                authorAccountId: p.accountId ?? (p.author as { id?: string } | undefined)?.id,
                author: {
                  username: authorFields.username,
                  displayName: authorFields.displayName,
                  avatarUri: authorFields.avatarUri,
                },
                mediaUrls: mediaArray.length ? mediaArray : [''],
                caption: p.caption ?? null,
                locationName: p.locationName ?? p.location ?? null,
                likeCount: p.likeCount ?? p.likesCount ?? 0,
                commentCount: p.commentCount ?? p.commentsCount ?? 0,
                shareCount: p.shareCount ?? p.sharesCount ?? 0,
                isLiked: !!(p.isLiked ?? p.viewerHasLiked),
                isSaved: !!(p.isSaved ?? p.viewerHasSaved),
                allowComments: p.allowComments !== false,
                hideLikeCount: !!p.hideLikeCount,
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
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
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
              <FeedPost
                key={p.id}
                id={p.id}
                authorAccountId={p.authorAccountId}
                onPostDeleted={(postId) => setItems((prev) => prev.filter((x) => x.id !== postId))}
                author={{ ...p.author, displayName: p.author?.displayName ?? undefined }}
                location={p.locationName ?? undefined}
                mediaUris={p.mediaUrls}
                caption={p.caption ?? undefined}
                likeCount={p.likeCount}
                commentCount={p.commentCount}
                shareCount={p.shareCount}
              hideEngagementCounts={hideEngagementCounts}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                screenshotProtection={p.screenshotProtection}
                adCampaignId={p.adCampaignId}
                sponsorAccountId={p.sponsorAccountId}
                allowComments={p.allowComments !== false}
                hideLikeCountFromAuthor={!!p.hideLikeCount}
              />
            ))}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
