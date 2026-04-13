import React, { useCallback, useEffect, useState } from 'react';
import { ThemedView } from '../../components/ui/Themed';
import { StoryCircle } from '../../components/ui/StoryCircle';
import { FeedPost } from '../../components/ui/FeedPost';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { fetchApi, getToken } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Link } from 'react-router-dom';
import { useAdFeed } from '../../hooks/useAdFeed';
import { SocialTopBar } from '../../components/layout/SocialTopBar';
import { feedAuthorFromApiItem } from '../../utils/feedAuthorFromApiItem';
import { fetchClientSettings } from '../../services/clientSettings';

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
  adDestinationUrl?: string | null;
  adUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  allowComments?: boolean;
  hideLikeCount?: boolean;
};

export default function Home() {
  const currentAccount = useCurrentAccount() as any;
  const accountType = String(currentAccount?.accountType || 'PERSONAL').toUpperCase();
  const isJob = accountType === 'JOB';
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryAvatar[]>([]);
  const [feedType, setFeedType] = useState<'forYou' | 'favorites'>('forYou');
  const [hideEngagementCounts, setHideEngagementCounts] = useState(false);
  const { itemsWithAds } = useAdFeed(items, feedType === 'forYou');

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

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setItems([]);
        return;
      }
      const endpoint = feedType === 'favorites' ? 'posts/feed/favorites' : 'posts/feed';
      const res = await fetchApi(endpoint);
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
            const authorFields = feedAuthorFromApiItem(p as Record<string, unknown>);
            return {
              id: p.id,
              authorAccountId: p.accountId ?? p.author?.id,
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
              adDestinationUrl: p.adDestinationUrl ?? null,
              adUtm: p.adUtm ?? undefined,
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
  }, [feedType]);

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

  const accountIdForStories = (currentAccount as { id?: string } | null)?.id;

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
  }, [accountIdForStories]);

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

  // Single-column mobile layout (width capped by App MobileShell); scroll inside main.
  return (
    <ThemedView className="flex flex-1 flex-col min-h-0 w-full bg-black overflow-hidden">
        <SocialTopBar />

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-20 touch-pan-y">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-full">
              {/* Stories tray: first circle = own story if present, else "Your story" add; then others */}
              <div className="px-3 pt-2 pb-2 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-moxe-border/80">
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

              {/* Feed switcher: MOxE home tabs */}
              <div className="px-2 pb-2">
                <div className="inline-flex rounded-full border border-moxe-border bg-moxe-surface p-1">
                  <button
                    type="button"
                    onClick={() => setFeedType('forYou')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      feedType === 'forYou'
                        ? 'bg-moxe-border text-moxe-text font-semibold'
                        : 'text-moxe-textSecondary'
                    }`}
                  >
                    For you
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedType('favorites')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      feedType === 'favorites'
                        ? 'bg-moxe-border text-moxe-text font-semibold'
                        : 'text-moxe-textSecondary'
                    }`}
                  >
                    Favorites
                  </button>
                </div>
              </div>

              {/* Feed list – centered MOxE column */}
              <div className="pb-4" data-testid="home-feed-list">
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
                  <div className="px-4 py-6" data-testid="feed-empty">
                    {feedType === 'favorites' ? (
                      <>
                        <p className="text-sm text-[#a8a8a8]">No posts from favorites yet.</p>
                        <p className="text-xs text-[#737373] mt-1">
                          Mark profiles as favorites to see their posts first.
                        </p>
                        <Link to="/favorites" className="inline-block mt-3 text-xs text-[#0095f6] font-semibold">
                          Open favorites feed
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#a8a8a8]">No posts yet in your feed.</p>
                        <p className="text-xs text-[#737373] mt-1">
                          Follow more accounts or create your first post to see activity here.
                        </p>
                        <Link to="/create" className="inline-block mt-3 text-xs text-[#0095f6] font-semibold">
                          Create post
                        </Link>
                      </>
                    )}
                  </div>
                )}
                {!loading &&
                  itemsWithAds.map((p) => (
                    <FeedPost
                      key={p.id}
                      id={p.id}
                      authorAccountId={p.authorAccountId}
                      onPostDeleted={(postId) =>
                        setItems((prev) => prev.filter((x) => x.id !== postId))
                      }
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
                      adDestinationUrl={p.adDestinationUrl}
                      adUtm={p.adUtm}
                      allowComments={p.allowComments !== false}
                      hideLikeCountFromAuthor={!!p.hideLikeCount}
                    />
                  ))}
              </div>

            </div>
          </div>
        </div>
    </ThemedView>
  );
}
