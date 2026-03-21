import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { getSocket } from '../../services/socket';
import { getApiBase } from '../../services/api';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { Heart, X, Star, Users, Bookmark, AtSign, MoreVertical } from 'lucide-react';

const API_BASE = getApiBase();

type StoryItem = {
  id: string;
  mediaUrl: string;
  text?: string | null;
  createdAt?: string;
  isLiked?: boolean;
  stickers?: any[] | null;
  screenshotProtection?: boolean;
};

export default function StoryViewer() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<{ optionCounts: number[]; userVote?: number } | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionStatus, setQuestionStatus] = useState<string | null>(null);
  const [emojiValue, setEmojiValue] = useState(5);
  const [emojiStatus, setEmojiStatus] = useState<string | null>(null);
  const [countdownStatus, setCountdownStatus] = useState<string | null>(null);
  const [questionToShare, setQuestionToShare] = useState<string | null>(null);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [likes, setLikes] = useState<{ id: string; username: string; displayName?: string | null; profilePhoto?: string | null }[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showHighlightSheet, setShowHighlightSheet] = useState(false);
  const [showMentionSheet, setShowMentionSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [storyOwnerAvatar] = useState<string | null>(null);
  const [audioLabel] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Login required to view stories.');
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        const qs = username ? `?username=${encodeURIComponent(username)}` : '';
        const res = await fetch(`${API_BASE}/stories${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load stories.');
        }
        if (cancelled) return;
        const items: StoryItem[] = (data.items ?? data).flatMap((row: any) =>
          (row.stories ?? [row]).map((s: any) => ({
            id: s.id,
            mediaUrl: s.media?.[0]?.url ?? s.mediaUrl ?? '',
            text: s.text ?? s.caption ?? null,
            createdAt: s.createdAt,
            isLiked: s.viewerHasLiked ?? false,
            stickers: s.stickers ?? [],
            screenshotProtection: !!s.screenshotProtection,
          })),
        );
        setStories(items);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load stories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [username, retryKey]);

  // Subscribe to lightweight poll / emoji updates via Socket.IO (if available)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handlePollUpdated(msg: any) {
      if (!msg || typeof msg !== 'object' || !msg.storyId || !msg.optionCounts) return;
      const current = stories[index];
      if (current && current.id === msg.storyId) {
        setPollResults((prev) => ({
          optionCounts: msg.optionCounts,
          userVote: prev?.userVote,
        }));
      }
    }

    function handleEmojiUpdated(msg: any) {
      if (!msg || typeof msg !== 'object' || !msg.storyId || typeof msg.average !== 'number') return;
      const current = stories[index];
      if (current && current.id === msg.storyId) {
        setEmojiStatus(`Avg: ${msg.average.toFixed(1)}/10`);
      }
    }

    socket.on('storyPollUpdated', handlePollUpdated);
    socket.on('storyEmojiUpdated', handleEmojiUpdated);

    return () => {
      socket.off('storyPollUpdated', handlePollUpdated);
      socket.off('storyEmojiUpdated', handleEmojiUpdated);
    };
  }, [stories, index]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!stories[index]) return;
    const storyId = stories[index].id;
    fetch(`${API_BASE}/stories/${storyId}/view`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anonymous: false }),
    }).catch(() => {});
  }, [index, stories]);

  // Auto‑advance current story after a short duration (Instagram‑style)
  useEffect(() => {
    if (!stories[index]) return undefined;
    const timer = setTimeout(() => {
      if (index + 1 < stories.length) setIndex((prev) => prev + 1);
      else navigate(-1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, stories, navigate]);

  const toggleLike = async () => {
    const current = stories[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    const storyId = current.id;
    const nextLiked = !liked[storyId] && !current.isLiked;
    setLiked((prev) => ({ ...prev, [storyId]: nextLiked }));
    if (nextLiked) {
      setShowLikeBurst(true);
      setTimeout(() => setShowLikeBurst(false), 700);
    }
    if (!token) return;
    try {
      const method = nextLiked ? 'POST' : 'DELETE';
      await fetch(`${API_BASE}/stories/${storyId}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore failures, leave optimistic state
    }
  };

  async function votePoll(optionIndex: number) {
    const current = stories[index];
    if (!current) return;
    const stickers = (current.stickers as any[]) || [];
    const pollIndex = stickers.findIndex(
      (s) => s && typeof s === 'object' && (s as any).type === 'poll' && Array.isArray((s as any).options),
    );
    if (pollIndex === -1) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setPollLoading(true);
    setPollError(null);
    try {
      await fetch(`${API_BASE}/stories/${current.id}/poll-vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stickerIndex: pollIndex, optionIndex }),
      });
      const res = await fetch(`${API_BASE}/stories/${current.id}/poll-results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load poll results.');
      }
      const match = (data.results ?? []).find((r: any) => r.stickerIndex === pollIndex);
      if (match) {
        setPollResults({ optionCounts: match.optionCounts ?? [], userVote: match.userVote });
      }
    } catch (e: any) {
      setPollError(e.message || 'Failed to vote on poll.');
    } finally {
      setPollLoading(false);
    }
  }

  async function submitQuestion() {
    const current = stories[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const text = questionText.trim();
    if (!text) return;
    const stickers = (current.stickers as any[]) || [];
    const qIndex = stickers.findIndex(
      (s) => s && typeof s === 'object' && (s as any).type === 'questions',
    );
    if (qIndex === -1) return;
    setQuestionStatus(null);
    try {
      const res = await fetch(`${API_BASE}/stories/${current.id}/question`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stickerIndex: qIndex, question: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send question.');
      }
      setQuestionStatus('Question sent.');
      setQuestionText('');
      setQuestionToShare(text);
    } catch (e: any) {
      setQuestionStatus(e.message || 'Failed to send question.');
    }
  }

  async function sendEmojiRating() {
    const current = stories[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const stickers = (current.stickers as any[]) || [];
    const eIndex = stickers.findIndex(
      (s) => s && typeof s === 'object' && (s as any).type === 'emoji_slider',
    );
    if (eIndex === -1) return;
    setEmojiStatus(null);
    try {
      const res = await fetch(`${API_BASE}/stories/${current.id}/emoji-rating`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stickerIndex: eIndex, value: emojiValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send rating.');
      }
      setEmojiStatus('Rating sent.');
    } catch (e: any) {
      setEmojiStatus(e.message || 'Failed to send rating.');
    }
  }

  async function requestCountdownReminder() {
    const current = stories[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const stickers = (current.stickers as any[]) || [];
    const cIndex = stickers.findIndex(
      (s) => s && typeof s === 'object' && (s as any).type === 'countdown',
    );
    if (cIndex === -1) return;
    const sticker = stickers[cIndex] as any;
    const notifyAt = sticker.notifyAt;
    const title = sticker.title || 'Countdown';
    if (!notifyAt) return;
    setCountdownStatus(null);
    try {
      const res = await fetch(`${API_BASE}/stories/${current.id}/remind`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifyAt, eventName: title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set reminder.');
      }
      setCountdownStatus('Reminder scheduled.');
    } catch (e: any) {
      setCountdownStatus(e.message || 'Failed to set reminder.');
    }
  }

  async function openLikes() {
    const currentStory = stories[index];
    if (!currentStory) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setLikesLoading(true);
    setLikesError(null);
    setShowLikesSheet(true);
    try {
      const res = await fetch(`${API_BASE}/stories/${currentStory.id}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load likes.');
      }
      const items = (data.items ?? data.likes ?? []) as any[];
      setLikes(
        items.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName ?? null,
          profilePhoto: u.profilePhoto ?? null,
        })),
      );
    } catch (e: any) {
      setLikesError(e.message || 'Failed to load likes.');
    } finally {
      setLikesLoading(false);
    }
  }

  function next() {
    if (index + 1 < stories.length) setIndex(index + 1);
    else navigate(-1);
  }

  function prev() {
    if (index > 0) setIndex(index - 1);
    else navigate(-1);
  }

  const current = stories[index];
  const stickers = (current?.stickers as any[]) || [];
  const pollSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'poll',
  ) as any | undefined;
  const questionsSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'questions',
  ) as any | undefined;
  const emojiSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'emoji_slider',
  ) as any | undefined;
  const countdownSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'countdown',
  ) as any | undefined;
  const linkSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'link',
  ) as any | undefined;
  const donationSticker = stickers.find(
    (s) => s && typeof s === 'object' && (s as any).type === 'donation',
  ) as any | undefined;

  // Compute story age for header (e.g. "8h")
  const storyTimeLabel = current?.createdAt
    ? (() => {
        const d = new Date(current.createdAt);
        const diff = (Date.now() - d.getTime()) / 60000;
        if (diff < 60) return `${Math.round(diff)}m`;
        if (diff < 1440) return `${Math.round(diff / 60)}h`;
        return `${Math.round(diff / 1440)}d`;
      })()
    : '';

  return (
    <ThemedView className="fixed inset-0 z-40 flex flex-col bg-black">
      <div className="w-full max-w-[428px] h-full flex flex-col mx-auto">
        {/* Header: avatar + Your story + time + audio (left); Close Friends + X (right) – same for all accounts */}
        <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar uri={storyOwnerAvatar} size={36} />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {username ? `@${username}` : 'Your story'}
              </p>
              {storyTimeLabel && (
                <p className="text-[#a8a8a8] text-xs">{storyTimeLabel}</p>
              )}
              {audioLabel && (
                <p className="text-[#a8a8a8] text-xs flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-white/20 rounded-sm" />
                  {audioLabel} &gt;
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCloseFriends && (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-[#00c853]">
                <Star className="w-4 h-4 fill-current" />
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-moxe-md">
          {loading && (
            <ThemedText secondary className="text-moxe-caption">
              Loading stories…
            </ThemedText>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-center">
              <ThemedText className="text-moxe-caption text-moxe-danger">{error}</ThemedText>
              <ThemedButton
                label="Try again"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setRetryKey((k) => k + 1);
                }}
              />
            </div>
          )}
          {!loading && !error && !current && (
            <ThemedText secondary className="text-moxe-caption">
              No stories to show.
            </ThemedText>
          )}
          {current && (
            <div
              className="relative w-full aspect-[9/16] max-h-[80vh] bg-moxe-surface rounded-moxe-lg overflow-hidden"
              onDoubleClick={toggleLike}
              onContextMenu={(e) => {
                if (current.screenshotProtection) e.preventDefault();
              }}
            >
              {/* Progress bar segments */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                {stories.map((s, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={s.id || idx}
                    className="h-0.5 rounded-full bg-white/30 overflow-hidden flex-1"
                  >
                    <div
                      className={`h-full ${
                        idx < index ? 'bg-white' : idx === index ? 'bg-white' : 'bg-transparent'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <img
                src={ensureAbsoluteMediaUrl(current.mediaUrl)}
                alt={current.text || 'Story'}
                className="w-full h-full object-cover select-none"
              />
              {current.text && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 rounded-moxe-md px-3 py-2">
                  <ThemedText className="text-moxe-body">{current.text}</ThemedText>
                </div>
              )}
              <div className="absolute top-3 left-3 text-[10px] text-moxe-textSecondary bg-black/40 rounded-full px-2 py-0.5">
                Alt text available
              </div>
              <button
                type="button"
                onClick={toggleLike}
                className="absolute top-3 right-3 bg-black/40 rounded-full px-2.5 py-1 text-lg leading-none"
                aria-label="Like story"
              >
                <Heart
                  className="w-5 h-5"
                  fill={liked[current.id] || current.isLiked ? '#e0245e' : 'none'}
                  stroke={liked[current.id] || current.isLiked ? '#e0245e' : 'currentColor'}
                />
              </button>
              <button
                type="button"
                onClick={openLikes}
                className="absolute top-3 right-16 bg-black/40 rounded-full px-2 py-0.5 text-[10px] text-moxe-textSecondary"
              >
                View likes
              </button>
              {showLikeBurst && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-5xl animate-ping-fast">❤️</span>
                </div>
              )}
              {pollSticker && Array.isArray(pollSticker.options) && (
                <div className="absolute bottom-24 left-4 right-4 bg-black/50 rounded-moxe-md px-3 py-2 text-xs space-y-2">
                  <ThemedText className="text-moxe-body mb-1">
                    {pollSticker.question || 'Poll'}
                  </ThemedText>
                  <div className="space-y-1">
                    {pollSticker.options.map((opt: string, idx: number) => {
                      const selected = pollResults?.userVote === idx;
                      const total =
                        pollResults?.optionCounts?.reduce((a, b) => a + b, 0) ?? 0;
                      const count = pollResults?.optionCounts?.[idx] ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => votePoll(idx)}
                          disabled={pollLoading}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full ${
                            selected ? 'bg-moxe-primary text-white' : 'bg-black/40 text-moxe-body'
                          } text-left`}
                        >
                          <span>{opt}</span>
                          {total > 0 && (
                            <span className="text-[10px] text-moxe-textSecondary">
                              {pct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {pollError && (
                    <ThemedText className="text-[10px] text-moxe-danger mt-1">
                      {pollError}
                    </ThemedText>
                  )}
                </div>
              )}

              {questionsSticker && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/55 rounded-moxe-md px-3 py-2 text-xs space-y-1">
                  <ThemedText className="text-moxe-body mb-1">
                    {questionsSticker.prompt || 'Ask me a question'}
                  </ThemedText>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type your question…"
                    className="w-full px-2 py-1 rounded-full bg-black/40 border border-white/20 text-[11px] text-white placeholder:text-moxe-textSecondary"
                  />
                  <button
                    type="button"
                    onClick={submitQuestion}
                    className="mt-1 text-[11px] text-moxe-primary"
                  >
                    Send
                  </button>
                  {questionToShare && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/create/story', {
                          state: { prefillQuestionAnswer: questionToShare },
                        } as any)
                      }
                      className="mt-1 text-[11px] text-moxe-primary underline"
                    >
                      Share answer as story
                    </button>
                  )}
                  {questionStatus && (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      {questionStatus}
                    </ThemedText>
                  )}
                </div>
              )}

              {emojiSticker && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/55 rounded-moxe-md px-3 py-2 text-xs flex flex-col items-center gap-1 min-w-[200px]">
                  <span className="text-lg">{emojiSticker.emoji || '💜'}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={emojiValue}
                    onChange={(e) => setEmojiValue(Number(e.target.value) || 5)}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={sendEmojiRating}
                    className="text-[11px] text-moxe-primary"
                  >
                    Send rating
                  </button>
                  {emojiStatus && (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      {emojiStatus}
                    </ThemedText>
                  )}
                </div>
              )}

              {countdownSticker && (
                <div className="absolute top-16 left-4 bg-black/55 rounded-moxe-md px-3 py-2 text-xs space-y-1">
                  <ThemedText className="text-moxe-body">
                    {countdownSticker.title || 'Countdown'}
                  </ThemedText>
                  {countdownSticker.notifyAt && (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      Ends at {new Date(countdownSticker.notifyAt).toLocaleString()}
                    </ThemedText>
                  )}
                  <button
                    type="button"
                    onClick={requestCountdownReminder}
                    className="text-[11px] text-moxe-primary mt-1"
                  >
                    Remind me
                  </button>
                  {countdownStatus && (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      {countdownStatus}
                    </ThemedText>
                  )}
                </div>
              )}

              {linkSticker && (
                <a
                  href={linkSticker.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 left-4 bg-black/60 rounded-moxe-md px-3 py-1.5 text-xs text-moxe-accent underline underline-offset-2"
                >
                  {linkSticker.label || linkSticker.url}
                </a>
              )}
              {donationSticker && (
                <a
                  href={donationSticker.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 right-4 bg-moxe-primary rounded-moxe-md px-3 py-1.5 text-xs text-white font-semibold shadow-lg"
                >
                  {donationSticker.label ||
                    (typeof donationSticker.amountSuggestion === 'number'
                      ? `Support (${donationSticker.amountSuggestion.toFixed(2)})`
                      : 'Support this creator')}
                </a>
              )}
              <div className="absolute inset-y-0 left-0 w-1/3" onClick={prev} />
              <div className="absolute inset-y-0 right-0 w-1/3" onClick={next} />
            </div>
          )}
        </div>

        {/* Bottom bar: Activity, Highlight, Mention, More – same for all accounts */}
        {current && (
          <div className="flex items-center justify-around px-4 py-3 border-t border-white/10 bg-black/50 safe-area-pb">
            <button
              type="button"
              onClick={() => setShowViewersSheet(true)}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <Users className="w-6 h-6" />
              <span className="text-[10px]">Activity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHighlightSheet(true)}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <Bookmark className="w-6 h-6" />
              <span className="text-[10px]">Highlight</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMentionSheet(true)}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <AtSign className="w-6 h-6" />
              <span className="text-[10px]">Mention</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMoreSheet(true)}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <MoreVertical className="w-6 h-6" />
              <span className="text-[10px]">More</span>
            </button>
          </div>
        )}
      </div>
      {showLikesSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
          <div className="w-full max-w-[428px] bg-moxe-surface rounded-t-3xl border-t border-moxe-border max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-moxe-md py-2 border-b border-moxe-border">
              <ThemedText className="text-moxe-body font-semibold">Story likes</ThemedText>
              <button
                type="button"
                onClick={() => setShowLikesSheet(false)}
                className="text-moxe-textSecondary text-lg leading-none px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto px-moxe-md py-2 space-y-2">
              {likesLoading && (
                <ThemedText secondary className="text-moxe-caption">
                  Loading…
                </ThemedText>
              )}
              {likesError && !likesLoading && (
                <ThemedText className="text-moxe-caption text-moxe-danger">
                  {likesError}
                </ThemedText>
              )}
              {!likesLoading && !likesError && likes.length === 0 && (
                <ThemedText secondary className="text-moxe-caption">
                  No likes yet.
                </ThemedText>
              )}
              {!likesLoading &&
                !likesError &&
                likes.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-moxe-background flex items-center justify-center text-[11px] text-moxe-textSecondary overflow-hidden">
                        {u.profilePhoto ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={u.profilePhoto} className="w-full h-full object-cover" />
                        ) : (
                          (u.username || '?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <ThemedText className="text-moxe-body text-[13px]">
                          @{u.username}
                        </ThemedText>
                        {u.displayName && (
                          <ThemedText secondary className="text-[11px] text-moxe-caption">
                            {u.displayName}
                          </ThemedText>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* More menu (Story settings in story): Delete, Archive, Highlight, Save, Edit AI label, Story settings, Cancel */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowMoreSheet(false)}>
          <div className="w-full max-w-[428px] bg-[#1c1c1e] rounded-t-2xl border-t border-[#262626] pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            <div className="pt-2 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
            </div>
            <button type="button" className="w-full py-3.5 text-red-500 font-semibold text-sm">Delete story</button>
            <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Archive</button>
            <button type="button" className="w-full py-3.5 text-white font-semibold text-sm" onClick={() => { setShowMoreSheet(false); setShowHighlightSheet(true); }}>Highlight</button>
            <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Save...</button>
            <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Edit AI label</button>
            <button type="button" className="w-full py-3.5 text-white font-semibold text-sm" onClick={() => { setShowMoreSheet(false); navigate('/settings/story'); }}>Story settings</button>
            <div className="border-t border-[#262626] mt-2 pt-2">
              <button type="button" className="w-full py-3.5 text-white font-semibold text-sm" onClick={() => setShowMoreSheet(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add to highlights sheet */}
      {showHighlightSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowHighlightSheet(false)}>
          <div className="w-full max-w-[428px] bg-[#1c1c1e] rounded-t-2xl border-t border-[#262626] pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            <div className="pt-2 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-white font-semibold text-base">Add to highlights</span>
              <button type="button" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-light">+</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
              {['Wheels', 'PICS'].map((label, i) => (
                <button key={i} type="button" className="flex-shrink-0 w-20 h-24 rounded-lg bg-black flex flex-col items-center justify-center gap-1">
                  <span className="text-white text-sm font-medium">{label}</span>
                  <span className="text-white/60 text-xs">*</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Story viewers list placeholder – full page can be /stories/:username/viewers */}
      {showViewersSheet && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setShowViewersSheet(false)}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]" onClick={(e) => e.stopPropagation()}>
            <span className="text-[#a8a8a8]">Settings</span>
            <button type="button" className="p-2 text-white" onClick={() => setShowViewersSheet(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <p className="text-white font-semibold mb-2">Who viewed this story</p>
            <ThemedText secondary className="text-sm">Viewers will appear here.</ThemedText>
          </div>
        </div>
      )}

      {/* Story mention sheet placeholder */}
      {showMentionSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowMentionSheet(false)}>
          <div className="w-full max-w-[428px] max-h-[80vh] bg-[#202020] rounded-t-2xl border-t border-[#262626] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="pt-2 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
            </div>
            <input type="text" placeholder="Search" className="mx-4 mt-2 mb-3 px-4 py-2.5 rounded-lg bg-[#363636] text-white placeholder:text-[#737373] text-sm" />
            <div className="flex-1 overflow-auto px-4 pb-4">
              <ThemedText secondary className="text-sm">Search for people to mention.</ThemedText>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <label className="text-white text-sm flex-1">Allow people you mention to add this to their story</label>
              <button type="button" role="switch" className="w-11 h-6 rounded-full bg-[#363636]" />
            </div>
            <button type="button" className="mx-4 mb-4 py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">Mention</button>
          </div>
        </div>
      )}
    </ThemedView>
  );
}

