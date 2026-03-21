import React, { useCallback, useEffect, useState } from 'react';
import { ThemedView } from '../../components/ui/Themed';
import { StoryCircle } from '../../components/ui/StoryCircle';
import { FeedPost } from '../../components/ui/FeedPost';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { fetchApi, getToken } from '../../services/api';
import { getSocket } from '../../services/socket';
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

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setItems([]);
        return;
      }
      const res = await fetchApi('posts/feed');
      const data = await res.json().catch(() => ({}));
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
      setError(e.message || 'Failed to load feed.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewPost = () => {
      loadFeed();
    };
    socket.on('feed:new-post', onNewPost);
    return () => {
      socket.off('feed:new-post', onNewPost);
    };
  }, [loadFeed]);

  const loadStories = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await fetchApi('stories');
      const data = await res.json().catch(() => ({}));
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
      setStories([]);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onStoriesNew = () => {
      loadStories();
    };
    socket.on('stories:new', onStoriesNew);
    return () => {
      socket.off('stories:new', onStoriesNew);
    };
  }, [loadStories]);

  // Rebuilt unified feed UI – Instagram-style light shell with centered column.
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        {/* Top app bar (feed) – dark theme header */}
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link
            to="/create"
            className="w-10 h-10 flex items-center justify-center text-white active:opacity-70"
            aria-label="Create"
          >
            <Plus className="w-6 h-6" strokeWidth={2} />
          </Link>
          <Link to="/" className="text-xl font-semibold text-white tracking-tight">
            MOxE
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/commerce"
              className="w-9 h-9 flex items-center justify-center text-white active:opacity-70"
              aria-label="Shop"
            >
              <ShopIcon className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link
              to="/notifications"
              className="w-9 h-9 flex items-center justify-center text-white active:opacity-70"
              aria-label="Notifications"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              to="/messages"
              className="w-9 h-9 flex items-center justify-center text-white active:opacity-70"
              aria-label="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[470px] md:max-w-[600px] lg:max-w-[900px]">
              {/* Stories tray: first circle = own story if present, else "Your story" add; then others */}
              <div className="px-2 pt-3 pb-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
                {(() => {
                  const myUsername = (currentAccount as any)?.username;
                  const myStory = myUsername ? stories.find((s) => s.username === myUsername) : null;
                  const othersStories = myUsername ? stories.filter((s) => s.username !== myUsername) : stories;
                  return (
                    <>
                      {myStory ? (
                        <StoryCircle
                          key={myStory.id}
                          uri={myStory.avatarUrl}
                          label="Your story"
                          hasStory
                          seen={!myStory.hasUnseen}
                          isLive={myStory.isLive}
                          closeFriends={myStory.closeFriends}
                          to={`/stories/${encodeURIComponent(myStory.username)}`}
                        />
                      ) : (
                        <StoryCircle to="/stories/create" label="Your story" hasStory={false} isAdd />
                      )}
                      {othersStories.map((s) => (
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
                    </>
                  );
                })()}
              </div>

              {/* Feed list – centered Instagram column */}
              <div className="pb-4">
                {loading && (
                  <p className="px-4 py-4 text-sm text-moxe-textSecondary">Loading feed…</p>
                )}
                {!loading && error && (
                  <div className="px-4 py-4">
                    <p className="text-sm text-[#ff8a8a]">{error}</p>
                    <button
                      type="button"
                      onClick={loadFeed}
                      className="mt-2 text-xs text-[#0095f6] font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {!loading && !error && items.length === 0 && (
                  <div className="px-4 py-6">
                    <p className="text-sm text-[#a8a8a8]">No posts yet in your feed.</p>
                    <p className="text-xs text-[#737373] mt-1">
                      Follow more accounts or create your first post to see activity here.
                    </p>
                    <Link to="/create" className="inline-block mt-3 text-xs text-[#0095f6] font-semibold">
                      Create post
                    </Link>
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
