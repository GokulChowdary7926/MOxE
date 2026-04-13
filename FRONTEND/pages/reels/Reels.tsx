import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Play } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { VerifiedBadge } from '../../components/atoms/VerifiedBadge';
import { getApiBase, getApiFullUrl, getToken } from '../../services/api';
import { fetchClientSettings, type ClientSettingsData } from '../../services/clientSettings';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { MobileShell } from '../../components/layout/MobileShell';
import { SocialCommentsSheet, SocialCommentsEmpty } from '../../components/comments/SocialCommentsSheet';
import { SocialCommentRow } from '../../components/comments/SocialCommentRow';
import toast from 'react-hot-toast';

const FALLBACK_USER = {
  id: 'account-unavailable',
  username: 'account',
  displayName: 'Account unavailable',
  avatarUrl: '/logo.png',
};

type ReelItem = {
  id: string;
  accountId: string;
  username: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  verified?: boolean;
  video: string;
  thumbnail: string;
  caption?: string | null;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  audioTitle?: string;
  audioArtist?: string;
};

type ApiReelRow = {
  id: string;
  accountId: string;
  video: string;
  thumbnail: string;
  caption?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  audio?: { title?: string; artist?: string } | null;
  account?: {
    id?: string;
    username?: string;
    displayName?: string | null;
    profilePhoto?: string | null;
    verifiedBadge?: boolean | null;
  };
};

function mapApiReelToItem(r: ApiReelRow): ReelItem {
  const acc = r.account;
  const audio = r.audio && typeof r.audio === 'object' ? r.audio : null;
  return {
    id: r.id,
    accountId: r.accountId,
    username: acc?.username ?? FALLBACK_USER.username,
    displayName: acc?.displayName ?? acc?.username,
    profilePhoto: acc?.profilePhoto ?? FALLBACK_USER.avatarUrl,
    video: r.video,
    thumbnail: r.thumbnail || acc?.profilePhoto || FALLBACK_USER.avatarUrl,
    caption: r.caption,
    likeCount: r.likes,
    commentCount: r.comments,
    shareCount: r.shares,
    audioTitle: audio?.title ?? undefined,
    audioArtist: audio?.artist ?? undefined,
    verified: !!acc?.verifiedBadge,
  };
}

type ReelsTab = 'forYou' | 'followed';

export default function Reels() {
  const navigate = useNavigate();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<ReelsTab>('forYou');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likedReelIds, setLikedReelIds] = useState<Set<string>>(new Set());
  const [savedReelIds, setSavedReelIds] = useState<Set<string>>(new Set());
  const reelCommentFooterRef = useRef<HTMLDivElement>(null);
  const nextCursorRef = useRef<string | null>(null);
  nextCursorRef.current = nextCursor;
  const [hideLikeShareCounts, setHideLikeShareCounts] = useState(false);
  const [deviceData, setDeviceData] = useState<NonNullable<ClientSettingsData['deviceAndData']>>({});
  const [reelComments, setReelComments] = useState<Array<{
    id: string;
    content: string;
    createdAt: string;
    username: string;
    displayName?: string | null;
    profilePhoto?: string | null;
  }>>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const refreshClientPrefs = useCallback(() => {
    void fetchClientSettings()
      .then((settings) => {
        setHideLikeShareCounts(!!settings.socialCounts?.hideLikeAndShareCounts);
        setDeviceData(settings.deviceAndData ?? {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshClientPrefs();
  }, [refreshClientPrefs]);

  useEffect(() => {
    const onFocus = () => refreshClientPrefs();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshClientPrefs]);

  useEffect(() => {
    if (deviceData.preloadReels === false) return;
    if (deviceData.dataSaver) return;
    if (deviceData.preloadReelsWifiOnly) {
      const n = navigator as Navigator & { connection?: { saveData?: boolean; type?: string } };
      const c = n.connection;
      if (c?.saveData) return;
      if (c?.type && c.type !== 'wifi' && c.type !== 'ethernet') return;
    }
    const next = reels[currentIndex + 1];
    if (!next?.video) return;
    const url = ensureAbsoluteMediaUrl(next.video);
    const id = `moxe-prefetch-reel-${next.id}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'prefetch';
    link.as = 'video';
    link.href = url;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [currentIndex, reels, deviceData]);

  const loadReels = useCallback(async (_cursor?: string | null) => {
    try {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      const token = getToken();
      if (!token) {
        setReels([]);
        setNextCursor(null);
        setError('Sign in to watch reels.');
        setCurrentIndex(0);
        return;
      }
      const url = new URL(getApiFullUrl('ranking/reels'));
      url.searchParams.set('limit', '30');
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { reels?: ApiReelRow[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reels.');
      }
      const raw = Array.isArray(data.reels) ? data.reels : [];
      const items = raw.map(mapApiReelToItem);
      setReels(items);
      setNextCursor(null);
      setCurrentIndex(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reels.');
      setReels([]);
      setNextCursor(null);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
  }, [currentIndex, reels.length]);

  const active = reels[currentIndex];
  const isLiked = active ? likedReelIds.has(active.id) : false;
  const isSaved = active ? savedReelIds.has(active.id) : false;

  useEffect(() => {
    if (!commentsOpen || !active?.id) {
      setReelComments([]);
      setCommentsError(null);
      return;
    }
    const token = getToken();
    if (!token) {
      setReelComments([]);
      setCommentsError('Sign in to view comments.');
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(null);
    fetch(`${getApiBase()}/reels/${encodeURIComponent(active.id)}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load comments.');
        return data as { items?: Array<{ id: string; content: string; createdAt: string; account?: { username?: string; displayName?: string | null; profilePhoto?: string | null } }> };
      })
      .then((data) => {
        if (cancelled) return;
        const items = (data.items ?? []).map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          username: c.account?.username ?? 'user',
          displayName: c.account?.displayName ?? null,
          profilePhoto: c.account?.profilePhoto ?? null,
        }));
        setReelComments(items);
      })
      .catch((e: unknown) => {
        if (!cancelled) setCommentsError(e instanceof Error ? e.message : 'Failed to load comments.');
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [commentsOpen, active?.id]);

  const submitComment = useCallback(async () => {
    if (!active?.id) return;
    const token = getToken();
    if (!token) return;
    const text = commentInput.trim();
    if (!text) return;
    setCommentSending(true);
    setCommentsError(null);
    try {
      const res = await fetch(`${getApiBase()}/reels/${encodeURIComponent(active.id)}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to post comment.');
      const created = data as {
        id: string;
        content: string;
        createdAt: string;
        account?: { username?: string; displayName?: string | null; profilePhoto?: string | null };
      };
      setReelComments((prev) => [
        {
          id: created.id,
          content: created.content,
          createdAt: created.createdAt,
          username: created.account?.username ?? 'you',
          displayName: created.account?.displayName ?? null,
          profilePhoto: created.account?.profilePhoto ?? null,
        },
        ...prev,
      ]);
      setCommentInput('');
      setReels((prev) =>
        prev.map((r) => (r.id === active.id ? { ...r, commentCount: Math.max((r.commentCount ?? 0) + 1, 1) } : r)),
      );
    } catch (e: unknown) {
      setCommentsError(e instanceof Error ? e.message : 'Failed to post comment.');
    } finally {
      setCommentSending(false);
    }
  }, [active?.id, commentInput]);

  useEffect(() => {
    const token = getToken();
    if (!token || !active?.accountId) return;
    // Feed source telemetry for creator plays-source insights.
    fetch(`${getApiBase()}/analytics/record-event`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetAccountId: active.accountId,
        eventType: 'reel_view',
        metadata: {
          source: tab === 'followed' ? 'following' : 'reels',
          reelId: active.id,
          audioTitle: active.audioTitle ?? null,
        },
      }),
    }).catch(() => {});
  }, [active?.id, active?.accountId, active?.audioTitle, tab]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex flex-col border-b border-[#262626] bg-black safe-area-pt">
          <div className="flex items-center justify-center h-12 px-3">
            <span className="text-[17px] font-semibold text-white">Reels</span>
          </div>
          <div className="flex px-4 pb-2 gap-1">
            <button
              type="button"
              onClick={() => setTab('forYou')}
              className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                tab === 'forYou' ? 'bg-[#262626] text-white' : 'text-moxe-textSecondary'
              }`}
            >
              For you
            </button>
            <button
              type="button"
              onClick={() => setTab('followed')}
              className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                tab === 'followed' ? 'bg-[#262626] text-white' : 'text-moxe-textSecondary'
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
              {/* Progress bar at top – MOxE reels */}
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
                  src={ensureAbsoluteMediaUrl(active.video)}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload={deviceData.dataSaver ? 'metadata' : 'auto'}
                  onTimeUpdate={(e) => {
                    const token = getToken();
                    if (!token) return;
                    const sec = Math.floor((e.currentTarget as HTMLVideoElement).currentTime);
                    if (sec <= 0 || sec % 2 !== 0) return; // sample every 2s
                    fetch(`${getApiBase()}/analytics/reels/${active.id}/retention`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ second: sec }),
                    }).catch(() => {});
                  }}
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
                <button
                  type="button"
                  className="flex flex-col items-center gap-0.5"
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                  onClick={() => {
                    if (!active) return;
                    setLikedReelIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(active.id)) next.delete(active.id);
                      else next.add(active.id);
                      return next;
                    });
                  }}
                >
                  <Heart className={`w-7 h-7 ${isLiked ? 'fill-[#f91880] text-[#f91880]' : ''}`} />
                  {!hideLikeShareCounts && typeof active.likeCount === 'number' && active.likeCount > 0 && (
                    <span className="text-moxe-caption text-xs">
                      {(active.likeCount + (isLiked ? 1 : 0)).toLocaleString()}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-0.5"
                  aria-label="Comment"
                  onClick={() => setCommentsOpen(true)}
                >
                  <MessageCircle className="w-7 h-7" />
                  {typeof active.commentCount === 'number' && active.commentCount > 0 && (
                    <span className="text-moxe-caption text-xs">{active.commentCount.toLocaleString()}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center gap-0.5"
                  aria-label="Share"
                  onClick={async () => {
                    if (!active) return;
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}/reels`);
                      toast.success('Reel link copied.');
                    } catch {
                      toast.error('Could not copy reel link.');
                    }
                  }}
                >
                  <Send className="w-7 h-7" />
                  {!hideLikeShareCounts &&
                    (active as ReelItem).shareCount != null &&
                    (active as ReelItem).shareCount! > 0 && (
                    <span className="text-moxe-caption text-xs">
                      {(active as ReelItem).shareCount!.toLocaleString()}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={isSaved ? 'Unsave' : 'Save'}
                  onClick={() => {
                    if (!active) return;
                    setSavedReelIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(active.id)) next.delete(active.id);
                      else next.add(active.id);
                      return next;
                    });
                    toast.success(isSaved ? 'Removed from saved.' : 'Saved.');
                  }}
                >
                  <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-white' : ''}`} />
                </button>
                <button
                  type="button"
                  aria-label="More"
                  onClick={() => {
                    if (!active) return;
                    navigate('/reels/actions', { state: { reelId: active.id, accountId: active.accountId } });
                  }}
                >
                  <MoreVertical className="w-7 h-7" />
                </button>
              </div>

              {/* Bottom overlay: profile, audio, caption */}
              <div className="absolute left-3 right-20 bottom-6 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar uri={active.profilePhoto} size={32} />
                  <span className="text-white font-semibold text-sm">{active.username}</span>
                  {active.verified ? <VerifiedBadge size={14} /> : null}
                  <Link
                    to={`/profile/${active.username}`}
                    className="px-2.5 py-1 rounded-full border border-white/30 text-white text-xs font-semibold"
                  >
                    View
                  </Link>
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

      {active && (
        <SocialCommentsSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          totalCount={Math.max(active.commentCount ?? 0, reelComments.length)}
          footer={
            <div
              ref={reelCommentFooterRef}
              className="border-t border-[#262626] bg-[#121212] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void submitComment();
                    }
                  }}
                  placeholder="Add a comment…"
                  className="flex-1 rounded-full bg-[#262626] border border-[#363636] px-3 py-2 text-[13px] text-white placeholder:text-[#737373]"
                  disabled={commentSending}
                />
                <button
                  type="button"
                  onClick={() => void submitComment()}
                  disabled={commentSending || !commentInput.trim()}
                  className="text-[13px] font-semibold text-moxe-primary disabled:opacity-40"
                >
                  {commentSending ? '…' : 'Post'}
                </button>
              </div>
              {commentsError && (
                <p className="text-[11px] text-red-400 mt-2 text-center">{commentsError}</p>
              )}
            </div>
          }
        >
          {commentsLoading ? (
            <p className="px-4 py-3 text-[13px] text-[#8e8e8e] text-center">Loading comments…</p>
          ) : reelComments.length === 0 ? (
            <SocialCommentsEmpty />
          ) : (
            reelComments.map((c) => (
              <SocialCommentRow
                key={c.id}
                commentId={c.id}
                content={c.content}
                createdAt={c.createdAt}
                account={{
                  username: c.username,
                  displayName: c.displayName ?? null,
                  profilePhoto: c.profilePhoto,
                }}
                usePseudoCounts
                onReply={() =>
                  reelCommentFooterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }
              />
            ))
          )}
        </SocialCommentsSheet>
      )}
    </ThemedView>
  );
}

