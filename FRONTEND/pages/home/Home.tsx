import React, { useEffect, useState } from 'react';
import { ThemedView } from '../../components/ui/Themed';
import { StoryCircle } from '../../components/ui/StoryCircle';
import { FeedPost } from '../../components/ui/FeedPost';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { fetchApi, getApiBase, getToken } from '../../services/api';
import { MobileShell } from '../../components/layout/MobileShell';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Plus } from 'lucide-react';
import { ShopIcon } from '../../components/icons/ShopIcon';

type StoryAvatar = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  hasUnseen: boolean;
  isLive?: boolean;
  closeFriends?: boolean;
};

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

export default function Home() {
  const currentAccount = useCurrentAccount() as any;
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryAvatar[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          if (!cancelled) setItems([]);
          return;
        }
        const res = await fetchApi('posts/feed');
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Unable to load feed.');
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
          setError(e.message || 'Failed to load feed.');
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

  useEffect(() => {
    let cancelled = false;
    async function loadStories() {
      if (!getToken()) return;
      try {
        const res = await fetchApi('stories');
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStories([]);
          return;
        }
        const raw = data.items ?? data;
        const mapped: StoryAvatar[] = Array.isArray(raw)
          ? raw.map((s: any) => ({
              id: s.id ?? s.accountId ?? s.username,
              username: s.username ?? s.account?.username ?? 'user',
              avatarUrl: s.profilePhoto ?? s.avatarUrl ?? null,
              hasUnseen: !!s.hasUnseen,
              isLive: !!s.isLive,
              closeFriends: !!s.closeFriends,
            }))
          : [];
        setStories(mapped);
      } catch {
        if (!cancelled) setStories([]);
      }
    }
    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rebuilt unified feed UI – Instagram-style light shell with centered column.
  return (
    <ThemedView className="min-h-screen flex flex-col bg-white">
      <MobileShell>
        {/* Top app bar – Instagram-style; all icons link to correct pages */}
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#DBDBDB] bg-white safe-area-pt">
          <Link
            to="/create"
            className="w-10 h-10 flex items-center justify-center text-white active:opacity-70"
            aria-label="Create"
          >
            <Plus className="w-6 h-6" strokeWidth={2} />
          </Link>
          <Link to="/" className="text-xl font-semibold text-black tracking-tight">
            MOxE
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/commerce"
              className="w-9 h-9 flex items-center justify-center text-black active:opacity-70"
              aria-label="Shop"
            >
              <ShopIcon className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link
              to="/notifications"
              className="w-9 h-9 flex items-center justify-center text-black active:opacity-70"
              aria-label="Notifications"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              to="/messages"
              className="w-9 h-9 flex items-center justify-center text-black active:opacity-70"
              aria-label="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[470px] md:max-w-[600px] lg:max-w-[900px]">
              {/* Stories tray */}
              <div className="px-2 pt-3 pb-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
                <StoryCircle to="/stories/create" label="Your story" hasStory={false} isAdd />
                {stories.map((s) => (
                  <StoryCircle
                    key={s.id}
                    uri={s.avatarUrl}
                    label={s.username}
                    hasStory
                    seen={!s.hasUnseen}
                    isLive={s.isLive}
                    closeFriends={s.closeFriends}
                    to={`/stories/${encodeURIComponent(s.username)}`}
                  />
                ))}
              </div>

              {/* Feed list – centered Instagram column */}
              <div className="pb-4">
                {loading && (
                  <p className="px-4 py-4 text-sm text-moxe-textSecondary">Loading feed…</p>
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
                        variant="light"
                      />
                    </article>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
