import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { getSocket } from '../../services/socket';
import { getApiBase, getAuthHeaders } from '../../services/api';
import { ensureAbsoluteMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';
import { MediaGridThumb } from '../../components/media/MediaGridThumb';
import { mediaEntryToUrl } from '../../utils/mediaEntries';
import { SocialCommentsSheet, SocialCommentsEmpty } from '../../components/comments/SocialCommentsSheet';
import { SocialCommentRow } from '../../components/comments/SocialCommentRow';
import { Heart, X, Star, Users, Bookmark, AtSign, MoreVertical, MessageCircle } from 'lucide-react';
import { useIsOwnProfile } from '../../hooks/useIsOwnProfile';
import toast from 'react-hot-toast';

const API_BASE = getApiBase();

type StoryItem = {
  id: string;
  mediaUrl: string;
  text?: string | null;
  createdAt?: string;
  isLiked?: boolean;
  stickers?: any[] | null;
  screenshotProtection?: boolean;
  replyCount?: number;
  /** When false, viewers cannot reply, vote on polls, or use interactive stickers tied to replies. */
  allowReplies?: boolean;
};

type StoryReplyRow = {
  id: string;
  content: string;
  createdAt: string;
  account?: { username: string; displayName?: string | null; profilePhoto?: string | null };
};

function extractStoryMediaUrl(story: any): string {
  const media = story?.media;
  const fromMediaArrayOrObject = mediaEntryToUrl(Array.isArray(media) ? media[0] : media);
  if (fromMediaArrayOrObject) return fromMediaArrayOrObject;
  for (const key of ['mediaUrl', 'url', 'imageUrl', 'thumbnail'] as const) {
    const candidate = story?.[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

export default function StoryViewer() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isOwnStoryTray = useIsOwnProfile();
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
  const [viewers, setViewers] = useState<
    { id: string; username: string; displayName?: string | null; profilePhoto?: string | null; viewedAt: string }[]
  >([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersError, setViewersError] = useState<string | null>(null);
  const [showHighlightSheet, setShowHighlightSheet] = useState(false);
  const [showMentionSheet, setShowMentionSheet] = useState(false);
  const [mentions, setMentions] = useState<
    { id: string; username: string; displayName?: string | null; profilePhoto?: string | null }[]
  >([]);
  const [mentionsLoading, setMentionsLoading] = useState(false);
  const [mentionsError, setMentionsError] = useState<string | null>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);
  const [storyVideoHasAudio, setStoryVideoHasAudio] = useState<boolean | null>(null);
  const storyCommentFooterRef = useRef<HTMLDivElement>(null);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [storyOwnerAvatar] = useState<string | null>(null);
  const [audioLabel] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [storyComments, setStoryComments] = useState<StoryReplyRow[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [ownerStoryQuestions, setOwnerStoryQuestions] = useState<
    { id: string; question: string; accountId: string; answerStoryId: string | null }[]
  >([]);
  const [ownerQuestionsLoading, setOwnerQuestionsLoading] = useState(false);
  const [highlights, setHighlights] = useState<Array<{ id: string; name: string; coverImage?: string | null }>>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [highlightActionBusyId, setHighlightActionBusyId] = useState<string | null>(null);
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const activeStoryId = stories[index]?.id;

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
            mediaUrl: extractStoryMediaUrl(s),
            text: s.text ?? s.caption ?? null,
            createdAt: s.createdAt,
            isLiked: s.viewerHasLiked ?? false,
            stickers: s.stickers ?? [],
            screenshotProtection: !!s.screenshotProtection,
            replyCount: typeof s.replyCount === 'number' ? s.replyCount : undefined,
            allowReplies: s.allowReplies !== false,
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

  useEffect(() => {
    const sid = stories[index]?.id;
    if (!showCommentsSheet || !sid) {
      setStoryComments([]);
      return;
    }
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) {
      setStoryComments([]);
      return;
    }
    fetch(`${API_BASE}/stories/${encodeURIComponent(sid)}/replies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: StoryReplyRow[] } | null) => {
        if (!cancelled && data?.items) setStoryComments(data.items);
        else if (!cancelled) setStoryComments([]);
      })
      .catch(() => {
        if (!cancelled) setStoryComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showCommentsSheet, index, activeStoryId]);

  useEffect(() => {
    setReplyText('');
    setReplyError(null);
    setVideoMuted(true);
    setStoryVideoHasAudio(null);
  }, [index, activeStoryId]);

  useEffect(() => {
    const sid = activeStoryId;
    if (!isOwnStoryTray || !sid) {
      setOwnerStoryQuestions([]);
      return;
    }
    const stickers = (stories.find((x) => x.id === sid)?.stickers as any[]) || [];
    const hasQuestions = stickers.some((s) => s && typeof s === 'object' && (s as any).type === 'questions');
    if (!hasQuestions) {
      setOwnerStoryQuestions([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    setOwnerQuestionsLoading(true);
    fetch(`${API_BASE}/stories/${encodeURIComponent(sid)}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { error?: string }).error || 'Failed to load questions');
        return data as { questions?: typeof ownerStoryQuestions };
      })
      .then((data) => {
        if (!cancelled) setOwnerStoryQuestions(data.questions ?? []);
      })
      .catch(() => {
        if (!cancelled) setOwnerStoryQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setOwnerQuestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwnStoryTray, index, activeStoryId, stories]);

  useEffect(() => {
    if (!showViewersSheet || !isOwnStoryTray) {
      setViewers([]);
      setViewersError(null);
      return;
    }
    const sid = stories[index]?.id;
    if (!sid) return;
    let cancelled = false;
    setViewersLoading(true);
    setViewersError(null);
    fetch(`${API_BASE}/stories/${encodeURIComponent(sid)}/viewers`, { headers: getAuthHeaders() })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { error?: string }).error || 'Failed to load viewers.');
        return data as { items?: typeof viewers };
      })
      .then((data) => {
        if (cancelled) return;
        const items = (data.items ?? []) as typeof viewers;
        setViewers(items);
      })
      .catch((e: Error) => {
        if (!cancelled) setViewersError(e.message || 'Failed to load viewers.');
      })
      .finally(() => {
        if (!cancelled) setViewersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showViewersSheet, isOwnStoryTray, index, stories]);

  useEffect(() => {
    if (!showHighlightSheet || !isOwnStoryTray) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    setHighlightsLoading(true);
    setHighlightError(null);
    fetch(`${API_BASE}/highlights`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { error?: string }).error || 'Failed to load highlights.');
        return data as { highlights?: Array<{ id: string; name: string; coverImage?: string | null }> };
      })
      .then((data) => {
        if (!cancelled) setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setHighlightError(e instanceof Error ? e.message : 'Failed to load highlights.');
      })
      .finally(() => {
        if (!cancelled) setHighlightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showHighlightSheet, isOwnStoryTray]);

  async function addCurrentStoryToHighlight(highlightId: string) {
    const currentStory = stories[index];
    if (!currentStory) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setHighlightActionBusyId(highlightId);
    setHighlightError(null);
    try {
      const res = await fetch(`${API_BASE}/highlights/${encodeURIComponent(highlightId)}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId: currentStory.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to add to highlight.');
      toast.success('Added to highlight.');
      setShowHighlightSheet(false);
    } catch (e: unknown) {
      setHighlightError(e instanceof Error ? e.message : 'Failed to add to highlight.');
    } finally {
      setHighlightActionBusyId(null);
    }
  }

  async function createHighlightAndAddCurrentStory() {
    const currentStory = stories[index];
    if (!currentStory) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setHighlightActionBusyId('create');
    setHighlightError(null);
    try {
      const createRes = await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New highlight', archivedStoryIds: [] }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error((createData as { error?: string }).error || 'Failed to create highlight.');
      const id = (createData as { id?: string }).id;
      if (!id) throw new Error('Highlight created, but no id returned.');
      await addCurrentStoryToHighlight(id);
      setHighlights((prev) => [{ id, name: 'New highlight', coverImage: currentStory.mediaUrl }, ...prev]);
    } catch (e: unknown) {
      setHighlightError(e instanceof Error ? e.message : 'Failed to create highlight.');
    } finally {
      setHighlightActionBusyId(null);
    }
  }

  useEffect(() => {
    if (!showMentionSheet || !isOwnStoryTray) {
      setMentions([]);
      setMentionsError(null);
      return;
    }
    const sid = stories[index]?.id;
    if (!sid) return;
    let cancelled = false;
    setMentionsLoading(true);
    setMentionsError(null);
    fetch(`${API_BASE}/stories/${encodeURIComponent(sid)}/mentions`, { headers: getAuthHeaders() })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { error?: string }).error || 'Failed to load mentions.');
        return data as { items?: typeof mentions };
      })
      .then((data) => {
        if (cancelled) return;
        const items = (data.items ?? []) as typeof mentions;
        setMentions(items);
      })
      .catch((e: Error) => {
        if (!cancelled) setMentionsError(e.message || 'Failed to load mentions.');
      })
      .finally(() => {
        if (!cancelled) setMentionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showMentionSheet, isOwnStoryTray, index, stories]);

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

  // Auto-advance image stories after a short duration.
  // Video stories should play their full media duration and advance on `ended`.
  useEffect(() => {
    const active = stories[index];
    if (!active) return undefined;
    if (isVideoMediaUrl(active.mediaUrl)) return undefined;
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
      const voteRes = await fetch(`${API_BASE}/stories/${current.id}/poll-vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stickerIndex: pollIndex, optionIndex }),
      });
      const voteData = await voteRes.json().catch(() => ({}));
      if (!voteRes.ok) {
        throw new Error((voteData as { error?: string }).error || 'Failed to vote on poll.');
      }
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

  async function submitStoryReply() {
    const cur = stories[index];
    if (!cur) return;
    const msg = replyText.trim();
    if (!msg) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(cur.id)}/replies`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Could not send reply.');
      }
      setReplyText('');
      const listRes = await fetch(`${API_BASE}/stories/${encodeURIComponent(cur.id)}/replies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = await listRes.json().catch(() => ({}));
      if (listRes.ok && Array.isArray((listData as { items?: StoryReplyRow[] }).items)) {
        setStoryComments((listData as { items: StoryReplyRow[] }).items);
      }
      setStories((prev) =>
        prev.map((s) => (s.id === cur.id ? { ...s, replyCount: (s.replyCount ?? 0) + 1 } : s)),
      );
    } catch (e: unknown) {
      setReplyError(e instanceof Error ? e.message : 'Could not send reply.');
    } finally {
      setReplySending(false);
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
              {isVideoMediaUrl(current.mediaUrl) ? (
                <video
                  ref={storyVideoRef}
                  src={ensureAbsoluteMediaUrl(current.mediaUrl)}
                  className="w-full h-full object-cover select-none"
                  autoPlay
                  muted={videoMuted}
                  playsInline
                  controls={false}
                  onEnded={next}
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget as HTMLVideoElement & {
                      mozHasAudio?: boolean;
                      audioTracks?: { length: number };
                      webkitAudioDecodedByteCount?: number;
                    };
                    const hasAudio = !!(
                      el.mozHasAudio
                      || (typeof el.audioTracks?.length === 'number' && el.audioTracks.length > 0)
                      || (typeof el.webkitAudioDecodedByteCount === 'number' && el.webkitAudioDecodedByteCount > 0)
                    );
                    setStoryVideoHasAudio(hasAudio);
                  }}
                  onClick={() => {
                    if (!storyVideoHasAudio) return;
                    setVideoMuted(false);
                    void storyVideoRef.current?.play().catch(() => {});
                  }}
                />
              ) : (
                <img
                  src={ensureAbsoluteMediaUrl(current.mediaUrl)}
                  alt={current.text || 'Story'}
                  className="w-full h-full object-cover select-none"
                />
              )}
              {current.text && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 rounded-moxe-md px-3 py-2">
                  <ThemedText className="text-moxe-body">{current.text}</ThemedText>
                </div>
              )}
              <div className="absolute top-3 left-3 text-[10px] text-moxe-textSecondary bg-black/40 rounded-full px-2 py-0.5">
                Alt text available
              </div>
              {isVideoMediaUrl(current.mediaUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!storyVideoHasAudio) return;
                    setVideoMuted((prev) => !prev);
                    void storyVideoRef.current?.play().catch(() => {});
                  }}
                  disabled={!storyVideoHasAudio}
                  className="absolute bottom-3 right-3 bg-black/50 rounded-full px-2 py-1 text-[11px] text-white disabled:opacity-60"
                  aria-label={
                    storyVideoHasAudio
                      ? (videoMuted ? 'Unmute story video' : 'Mute story video')
                      : 'Story audio unavailable'
                  }
                >
                  {!storyVideoHasAudio ? 'Audio unavailable' : (videoMuted ? 'Unmute' : 'Mute')}
                </button>
              )}
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
              <button
                type="button"
                onClick={() => setShowCommentsSheet(true)}
                className="absolute top-3 right-36 bg-black/40 rounded-full p-2 text-white"
                aria-label="Story comments"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={1.75} />
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
                  {!isOwnStoryTray && current.allowReplies === false ? (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      Poll votes are off when replies are off for this story.
                    </ThemedText>
                  ) : (
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
                  )}
                  {pollError && (
                    <ThemedText className="text-[10px] text-moxe-danger mt-1">
                      {pollError}
                    </ThemedText>
                  )}
                </div>
              )}

              {questionsSticker && isOwnStoryTray && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/55 rounded-moxe-md px-3 py-2 text-xs space-y-2 max-h-[40vh] overflow-y-auto">
                  <ThemedText className="text-moxe-body mb-1">
                    {questionsSticker.prompt || 'Questions'}
                  </ThemedText>
                  {ownerQuestionsLoading && (
                    <ThemedText className="text-[10px] text-moxe-caption">Loading questions…</ThemedText>
                  )}
                  {!ownerQuestionsLoading &&
                    ownerStoryQuestions.filter((q) => !q.answerStoryId).length === 0 && (
                      <ThemedText className="text-[10px] text-moxe-caption">
                        No new questions yet.
                      </ThemedText>
                    )}
                  {!ownerQuestionsLoading &&
                    ownerStoryQuestions
                      .filter((q) => !q.answerStoryId)
                      .slice(0, 8)
                      .map((q) => (
                        <div
                          key={q.id}
                          className="rounded-moxe-md bg-black/35 px-2 py-1.5 flex flex-col gap-1 border border-white/10"
                        >
                          <ThemedText className="text-[11px] text-moxe-body line-clamp-3">{q.question}</ThemedText>
                          <button
                            type="button"
                            onClick={() =>
                              navigate('/stories/create', {
                                state: {
                                  prefillQuestionAnswer: q.question,
                                  linkQuestionContext: { sourceStoryId: current.id, questionId: q.id },
                                },
                              })
                            }
                            className="text-[11px] text-moxe-primary text-left"
                          >
                            Answer in new story
                          </button>
                        </div>
                      ))}
                </div>
              )}

              {questionsSticker && !isOwnStoryTray && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/55 rounded-moxe-md px-3 py-2 text-xs space-y-1">
                  <ThemedText className="text-moxe-body mb-1">
                    {questionsSticker.prompt || 'Ask me a question'}
                  </ThemedText>
                  {current.allowReplies === false ? (
                    <ThemedText className="text-[10px] text-moxe-caption">
                      Questions are off for this story.
                    </ThemedText>
                  ) : (
                    <>
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
                            navigate('/stories/create', {
                              state: { prefillQuestionAnswer: questionToShare },
                            })
                          }
                          className="mt-1 text-[11px] text-moxe-primary underline"
                        >
                          Share to your story
                        </button>
                      )}
                      {questionStatus && (
                        <ThemedText className="text-[10px] text-moxe-caption">
                          {questionStatus}
                        </ThemedText>
                      )}
                    </>
                  )}
                </div>
              )}

              {emojiSticker && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/55 rounded-moxe-md px-3 py-2 text-xs flex flex-col items-center gap-1 min-w-[200px]">
                  <span className="text-lg">{emojiSticker.emoji || '💜'}</span>
                  {!isOwnStoryTray && current.allowReplies === false ? (
                    <ThemedText className="text-[10px] text-moxe-caption text-center">
                      This sticker is unavailable (replies off).
                    </ThemedText>
                  ) : (
                    <>
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
                    </>
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

        {/* Bottom bar: owner gets Activity / Highlight / Mention / More; others get More only (report/block). */}
        {current && (
          <div className="flex items-center justify-around px-4 py-3 border-t border-white/10 bg-black/50 safe-area-pb">
            {isOwnStoryTray && (
              <>
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
              </>
            )}
            <button
              type="button"
              onClick={() => setShowMoreSheet(true)}
              className={`flex flex-col items-center gap-0.5 text-white ${!isOwnStoryTray ? 'flex-1 max-w-[120px]' : ''}`}
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
                          <img src={ensureAbsoluteMediaUrl(u.profilePhoto)} className="w-full h-full object-cover" />
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

      {showCommentsSheet && current && (() => {
        const storyCommentsList = storyComments;
        const totalReplies = Math.max(storyCommentsList.length, current.replyCount ?? 0);
        const canPostReply = isOwnStoryTray || current.allowReplies !== false;
        return (
          <SocialCommentsSheet
            open={showCommentsSheet}
            onClose={() => setShowCommentsSheet(false)}
            totalCount={totalReplies}
            footer={
              <div
                ref={storyCommentFooterRef}
                className="border-t border-[#262626] bg-[#121212] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] space-y-2"
              >
                {canPostReply ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitStoryReply();
                        }
                      }}
                      placeholder="Message…"
                      className="flex-1 min-w-0 rounded-full bg-[#262626] border border-[#363636] px-3 py-2 text-[13px] text-white placeholder:text-[#737373]"
                      disabled={replySending}
                    />
                    <button
                      type="button"
                      onClick={() => submitStoryReply()}
                      disabled={replySending || !replyText.trim()}
                      className="shrink-0 text-[13px] font-semibold text-moxe-primary disabled:opacity-40"
                    >
                      {replySending ? '…' : 'Send'}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[13px] text-[#8e8e8e]">
                    Replies are turned off for this story.
                  </p>
                )}
                {replyError && (
                  <p className="text-center text-[11px] text-red-400">{replyError}</p>
                )}
              </div>
            }
          >
            {storyCommentsList.length === 0 ? (
              <SocialCommentsEmpty />
            ) : (
              storyCommentsList.map((c) => (
                <SocialCommentRow
                  key={c.id}
                  commentId={c.id}
                  content={c.content}
                  createdAt={c.createdAt}
                  account={{
                    username: c.account?.username ?? 'user',
                    displayName: c.account?.displayName ?? null,
                    profilePhoto: c.account?.profilePhoto ?? null,
                  }}
                  usePseudoCounts
                  onReply={() =>
                    storyCommentFooterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                />
              ))
            )}
          </SocialCommentsSheet>
        );
      })()}

      {/* More: owner — delete/archive/settings; viewer — report/block only (OWNERSHIP_AND_VIEWER_PATTERNS). */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowMoreSheet(false)}>
          <div className="w-full max-w-[428px] bg-[#1c1c1e] rounded-t-2xl border-t border-[#262626] pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            <div className="pt-2 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
            </div>
            {isOwnStoryTray ? (
              <>
                <button type="button" className="w-full py-3.5 text-red-500 font-semibold text-sm">Delete story</button>
                <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Archive</button>
                <button
                  type="button"
                  className="w-full py-3.5 text-white font-semibold text-sm"
                  onClick={() => {
                    setShowMoreSheet(false);
                    setShowHighlightSheet(true);
                  }}
                >
                  Highlight
                </button>
                <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Save...</button>
                <button type="button" className="w-full py-3.5 text-white font-semibold text-sm">Edit AI label</button>
                <button
                  type="button"
                  className="w-full py-3.5 text-white font-semibold text-sm"
                  onClick={() => {
                    setShowMoreSheet(false);
                    navigate('/settings/story');
                  }}
                >
                  Story settings
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="w-full py-3.5 text-red-500 font-semibold text-sm"
                  onClick={() => {
                    setShowMoreSheet(false);
                    toast.success('Thanks — we will review this story.');
                  }}
                >
                  Report
                </button>
                <button
                  type="button"
                  className="w-full py-3.5 text-white font-semibold text-sm"
                  onClick={() => {
                    setShowMoreSheet(false);
                    toast('Block is available from this user’s profile.');
                  }}
                >
                  Block @{username ?? 'user'}
                </button>
              </>
            )}
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
              <button
                type="button"
                onClick={() => void createHighlightAndAddCurrentStory()}
                disabled={highlightActionBusyId === 'create'}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-light disabled:opacity-50"
              >
                {highlightActionBusyId === 'create' ? '…' : '+'}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
              {highlightsLoading && (
                <span className="text-[#a8a8a8] text-sm">Loading highlights…</span>
              )}
              {!highlightsLoading && highlights.length === 0 && (
                <span className="text-[#a8a8a8] text-sm">No highlights yet. Tap + to create one.</span>
              )}
              {!highlightsLoading &&
                highlights.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => void addCurrentStoryToHighlight(h.id)}
                    disabled={highlightActionBusyId === h.id}
                    className="flex-shrink-0 w-20 h-24 rounded-lg bg-black flex flex-col items-center justify-center gap-1 disabled:opacity-60"
                  >
                    {h.coverImage ? (
                      <MediaGridThumb url={h.coverImage} className="w-full h-14 rounded-t-lg object-cover" />
                    ) : (
                      <span className="text-white/60 text-xs pt-2">No cover</span>
                    )}
                    <span className="text-white text-sm font-medium truncate px-1 w-full text-center">{h.name}</span>
                  </button>
                ))}
            </div>
            {highlightError && (
              <p className="px-4 pb-2 text-red-400 text-xs">{highlightError}</p>
            )}
          </div>
        </div>
      )}

      {/* Story viewers (owner): accounts with a non-anonymous StoryView row */}
      {showViewersSheet && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setShowViewersSheet(false)}>
          <div className="flex flex-col flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] shrink-0">
              <span className="text-white font-semibold">Who viewed this story</span>
              <button type="button" className="p-2 text-white" onClick={() => setShowViewersSheet(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-4 py-4 space-y-2">
              {viewersLoading && (
                <ThemedText secondary className="text-sm">Loading…</ThemedText>
              )}
              {viewersError && !viewersLoading && (
                <ThemedText className="text-sm text-moxe-danger">{viewersError}</ThemedText>
              )}
              {!viewersLoading && !viewersError && viewers.length === 0 && (
                <ThemedText secondary className="text-sm">
                  No logged-in viewers yet. Anonymous views are not listed here.
                </ThemedText>
              )}
              {!viewersLoading &&
                !viewersError &&
                viewers.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full flex items-center gap-3 py-2 text-left rounded-lg hover:bg-white/5 px-1"
                    onClick={() => {
                      setShowViewersSheet(false);
                      navigate(`/profile/${encodeURIComponent(v.username)}`);
                    }}
                  >
                    <Avatar uri={v.profilePhoto} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">@{v.username}</p>
                      {v.displayName ? (
                        <p className="text-[#a8a8a8] text-xs truncate">{v.displayName}</p>
                      ) : null}
                    </div>
                    <span className="text-[#737373] text-xs shrink-0">
                      {new Date(v.viewedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Mentions on this story (owner): DB + mention stickers */}
      {showMentionSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowMentionSheet(false)}>
          <div
            className="w-full max-w-[428px] max-h-[80vh] bg-[#202020] rounded-t-2xl border-t border-[#262626] flex flex-col min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 pb-1 shrink-0">
              <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] shrink-0">
              <span className="text-white font-semibold text-base">Mentions</span>
              <button type="button" className="p-2 text-white" onClick={() => setShowMentionSheet(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-4 py-3 space-y-2 min-h-0">
              {mentionsLoading && (
                <ThemedText secondary className="text-sm">Loading…</ThemedText>
              )}
              {mentionsError && !mentionsLoading && (
                <ThemedText className="text-sm text-moxe-danger">{mentionsError}</ThemedText>
              )}
              {!mentionsLoading && !mentionsError && mentions.length === 0 && (
                <ThemedText secondary className="text-sm">
                  No one is mentioned on this story. Mention stickers can be added when creating a story (payload: type
                  &quot;mention&quot; with accountId or accountIds).
                </ThemedText>
              )}
              {!mentionsLoading &&
                !mentionsError &&
                mentions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full flex items-center gap-3 py-2 text-left rounded-lg hover:bg-white/5 px-1"
                    onClick={() => {
                      setShowMentionSheet(false);
                      navigate(`/profile/${encodeURIComponent(m.username)}`);
                    }}
                  >
                    <Avatar uri={m.profilePhoto} size={40} />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">@{m.username}</p>
                      {m.displayName ? (
                        <p className="text-[#a8a8a8] text-xs truncate">{m.displayName}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </ThemedView>
  );
}

