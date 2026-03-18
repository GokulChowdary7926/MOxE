import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Play } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { FollowButton } from '../../components/atoms/FollowButton';
import { VerifiedBadge } from '../../components/atoms/VerifiedBadge';
import { getApiBase, getToken } from '../../services/api';
import { mockReels } from '../../mocks/reels';
import { mockUsers } from '../../mocks/users';
import { MobileShell } from '../../components/layout/MobileShell';

type ReelItem = {
  id: string;
  accountId: string;
  username: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  video: string;
  thumbnail: string;
  caption?: string | null;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  audioTitle?: string;
  audioArtist?: string;
};

type ReelsResponse = {
  items: ReelItem[];
  nextCursor: string | null;
};

function buildReelItemsFromMocks(): ReelItem[] {
  return mockReels.map((r) => {
    const author = mockUsers.find((u) => u.id === r.authorId) ?? mockUsers[0];
    return {
      id: r.id,
      accountId: author.id,
      username: author.username,
      displayName: author.displayName,
      profilePhoto: author.avatarUrl,
      video: r.videoUrl,
      thumbnail: author.avatarUrl,
      caption: r.caption,
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      shareCount: r.shareCount,
      audioTitle: r.audioTitle,
      audioArtist: r.audioArtist,
    };
  });
}

type ReelsTab = 'forYou' | 'followed';

export default function Reels() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<ReelsTab>('forYou');
  const nextCursorRef = useRef<string | null>(null);
  nextCursorRef.current = nextCursor;

  const loadReels = useCallback(async (cursor?: string | null) => {
    try {
      if (cursor && !nextCursorRef.current) return;
      cursor ? setLoadingMore(true) : setLoading(true);
      setError(null);
      const token = getToken();
      if (token) {
        const url = new URL(`${getApiBase()}/reels`);
        if (cursor) url.searchParams.set('cursor', cursor);
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as Partial<ReelsResponse>;
        if (!res.ok) {
          throw new Error((data as any).error || 'Failed to load reels.');
        }
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length > 0) {
          setReels((prev) => (cursor ? [...prev, ...items] : items));
          setNextCursor(data.nextCursor ?? null);
          if (!cursor) setCurrentIndex(0);
          return;
        }
      }
      // No token or empty response: use mocks so Reels is always populated.
      const mockItems = buildReelItemsFromMocks();
      setReels(mockItems);
      setNextCursor(null);
      setCurrentIndex(0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load reels.');
      const mockItems = buildReelItemsFromMocks();
      setReels(mockItems);
      setCurrentIndex(0);
    } finally {
      cursor ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels(null);
  }, [loadReels]);

  // Handle vertical scroll / wheel and arrow keys to move between reels.
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      if (!reels.length) return;
      if (Math.abs(e.deltaY) < 30) return;
      e.preventDefault();
      if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        if (next >= reels.length - 2 && nextCursor && !loadingMore) {
          void loadReels(nextCursor);
        }
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (!reels.length) return;
      if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) {
        e.preventDefault();
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener('wheel', wheelHandler, { passive: false });
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [currentIndex, reels.length, nextCursor, loadingMore, loadReels]);

  const active = reels[currentIndex];

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex flex-col border-b border-white/10 bg-black/90 safe-area-pt">
          <div className="flex items-center justify-center h-12 px-3">
            <span className="text-moxe-body font-semibold text-white">Reels</span>
          </div>
          {/* For You / Followed tabs – pill switch */}
          <div className="flex rounded-full bg-white/10 p-0.5 mx-4 mb-2">
            <button
              type="button"
              onClick={() => setTab('forYou')}
              className={`flex-1 py-1.5 rounded-full text-moxe-caption font-semibold ${
                tab === 'forYou' ? 'bg-white text-black' : 'text-white'
              }`}
            >
              For You
            </button>
            <button
              type="button"
              onClick={() => setTab('followed')}
              className={`flex-1 py-1.5 rounded-full text-moxe-caption font-semibold ${
                tab === 'followed' ? 'bg-white text-black' : 'text-white'
              }`}
            >
              Following
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {loading && !active && (
            <ThemedText secondary className="text-moxe-caption text-white/70">
              Loading reels…
            </ThemedText>
          )}
          {error && !loading && !active && (
            <ThemedText className="text-moxe-caption text-moxe-danger">{error}</ThemedText>
          )}
          {!loading && !error && active && (
            <div className="relative w-full h-full flex items-center justify-center min-h-[60vh]">
              {/* Progress bar at top – Instagram style */}
              <div className="absolute left-0 right-0 top-0 h-0.5 bg-white/20 z-20 flex">
                {reels.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full bg-white/40"
                    style={{ opacity: i === currentIndex ? 1 : i < currentIndex ? 1 : 0.2 }}
                  />
                ))}
              </div>

              {/* Video full-bleed */}
              <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
                <video
                  key={active.id}
                  src={active.video}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={(e) => {
                    (e.target as HTMLVideoElement).style.display = 'none';
                  }}
                />
                {/* Center play indicator for paused states (static for now) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>

              {/* Right-hand action bar */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 text-white z-10">
                <button type="button" className="flex flex-col items-center gap-0.5" aria-label="Like">
                  <Heart className="w-7 h-7" />
                  {typeof active.likeCount === 'number' && active.likeCount > 0 && (
                    <span className="text-moxe-caption text-xs">{active.likeCount.toLocaleString()}</span>
                  )}
                </button>
                <button type="button" className="flex flex-col items-center gap-0.5" aria-label="Comment">
                  <MessageCircle className="w-7 h-7" />
                  {typeof active.commentCount === 'number' && active.commentCount > 0 && (
                    <span className="text-moxe-caption text-xs">{active.commentCount.toLocaleString()}</span>
                  )}
                </button>
                <button type="button" className="flex flex-col items-center gap-0.5" aria-label="Share">
                  <Send className="w-7 h-7" />
                  {(active as ReelItem).shareCount != null && (active as ReelItem).shareCount! > 0 && (
                    <span className="text-moxe-caption text-xs">
                      {(active as ReelItem).shareCount!.toLocaleString()}
                    </span>
                  )}
                </button>
                <button type="button" aria-label="Save">
                  <Bookmark className="w-7 h-7" />
                </button>
                <button type="button" aria-label="More">
                  <MoreVertical className="w-7 h-7" />
                </button>
              </div>

              {/* Bottom overlay: profile, audio, caption */}
              <div className="absolute left-3 right-20 bottom-6 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar uri={active.profilePhoto} size={32} />
                  <span className="text-white font-semibold text-sm">{active.username}</span>
                  {(mockUsers.find((u) => u.username === active.username) as any)?.isVerified && (
                    <VerifiedBadge size={14} />
                  )}
                  <FollowButton isFollowing={false} onClick={() => {}} />
                </div>
                {(active as ReelItem).audioTitle && (
                  <p className="text-white text-moxe-caption truncate mb-0.5">
                    {(active as ReelItem).audioTitle}
                    {(active as ReelItem).audioArtist && ` · ${(active as ReelItem).audioArtist}`}
                  </p>
                )}
                {active.caption && (
                  <ThemedText className="text-white text-moxe-body line-clamp-2">
                    {active.caption}
                  </ThemedText>
                )}
              </div>
            </div>
          )}
        </div>

        {loadingMore && (
          <div className="px-4 py-1 text-center text-[11px] text-white/60">Loading more…</div>
        )}
      </MobileShell>
    </ThemedView>
  );
}

