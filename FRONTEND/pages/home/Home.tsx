import React, { useEffect, useState } from 'react';
import { ThemedView } from '../../components/ui/Themed';
import { StoryCircle } from '../../components/ui/StoryCircle';
import { FeedPost } from '../../components/ui/FeedPost';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';
import { mockPosts } from '../../mocks/posts';
import { mockStories } from '../../mocks/stories';
import { mockUsers } from '../../mocks/users';

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
        const API_BASE = getApiBase();
        if (token) {
          const res = await fetch(`${API_BASE}/posts/feed`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || 'Unable to load feed.');
          }
          if (cancelled) return;
          const mapped: FeedItem[] = (data.items ?? data.feed ?? data).map((p: any) => {
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
          });
          setItems(mapped);
        } else {
          // No token or local backend – fall back to mock feed so Home is always populated.
          const mappedMocks: FeedItem[] = mockPosts.map((p) => {
            const author = mockUsers.find((u) => u.id === p.authorId) ?? mockUsers[0];
            return {
              id: p.id,
              author: {
                username: author.username,
                displayName: author.displayName,
                avatarUri: author.avatarUrl,
              },
              mediaUrls: p.media.map((m) => m.url),
              caption: p.caption,
              locationName: p.location ?? null,
              likeCount: p.likeCount,
              commentCount: p.commentCount,
              shareCount: (p as { shareCount?: number }).shareCount ?? 0,
              isLiked: false,
              isSaved: false,
            };
          });
          setItems(mappedMocks);
        }
      } catch (e: any) {
        if (!cancelled) {
          // On failure, still populate from mocks so the feed is never empty.
          const mappedMocks: FeedItem[] = mockPosts.map((p) => {
            const author = mockUsers.find((u) => u.id === p.authorId) ?? mockUsers[0];
            return {
              id: p.id,
              author: {
                username: author.username,
                displayName: author.displayName,
                avatarUri: author.avatarUrl,
              },
              mediaUrls: p.media.map((m) => m.url),
              caption: p.caption,
              locationName: p.location ?? null,
              likeCount: p.likeCount,
              commentCount: p.commentCount,
              shareCount: (p as { shareCount?: number }).shareCount ?? 0,
              isLiked: false,
              isSaved: false,
            };
          });
          setItems(mappedMocks);
          setError(e.message || 'Failed to load feed.');
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
      try {
        const token = getToken();
        const API_BASE = getApiBase();
        if (token) {
          const res = await fetch(`${API_BASE}/stories`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            // non‑fatal for home; fall back to mocks below
            throw new Error(data.error || 'Failed to load stories.');
          }
          if (cancelled) return;
          const mapped: StoryAvatar[] = (data.items ?? data).map((s: any) => ({
            id: s.id ?? s.accountId ?? s.username,
            username: s.username ?? s.account?.username ?? 'user',
            avatarUrl: s.profilePhoto ?? s.avatarUrl ?? null,
            hasUnseen: !!s.hasUnseen,
            isLive: !!s.isLive,
            closeFriends: !!s.closeFriends,
          }));
          setStories(mapped);
        } else {
          const mappedMocks: StoryAvatar[] = mockStories.map((s) => {
            const user = mockUsers.find((u) => u.id === s.userId) ?? mockUsers[0];
            return {
              id: s.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              hasUnseen: s.hasUnseen,
              isLive: s.isLive,
              closeFriends: s.closeFriends,
            };
          });
          setStories(mappedMocks);
        }
      } catch {
        // If real API fails, still show mock stories (no empty state).
        const mappedMocks: StoryAvatar[] = mockStories.map((s) => {
          const user = mockUsers.find((u) => u.id === s.userId) ?? mockUsers[0];
          return {
            id: s.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            hasUnseen: s.hasUnseen,
            isLive: s.isLive,
            closeFriends: s.closeFriends,
          };
        });
        setStories(mappedMocks);
      }
    }
    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rebuilt unified feed UI – same layout, style, and pattern for all accounts.
  // Light background, story tray at top, and vertically stacked posts that match the reference layout.
  return (
    <ThemedView className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <div className="flex-1 overflow-auto">
        {/* Stories tray */}
        <div className="px-4 pt-3 pb-2 border-b border-[#dbdbdb] bg-white flex items-center gap-3 overflow-x-auto no-scrollbar">
          <StoryCircle to="/stories/create" label="Your story" hasStory={false} isAdd light />
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
              light
            />
          ))}
        </div>

        {/* Feed list */}
        <div className="bg-[#f5f5f5] pb-16">
          {loading && (
            <p className="px-4 py-4 text-sm text-[#8e8e8e]">Loading feed…</p>
          )}
          {!loading && items.map((p) => (
            <article key={p.id} className="max-w-[428px] mx-auto pt-3 pb-4">
              <div className="rounded-[28px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white">
                <FeedPost
                  id={p.id}
                  author={p.author}
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </ThemedView>
  );
}
