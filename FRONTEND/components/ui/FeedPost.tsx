import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { fetchApi, fetchApiJson, getApiBase, getToken } from '../../services/api';
import { getSocket } from '../../services/socket';
import { ensureAbsoluteMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';
import { SocialCommentsSheet, SocialCommentsEmpty } from '../comments/SocialCommentsSheet';
import { SocialCommentRow } from '../comments/SocialCommentRow';
import toast from 'react-hot-toast';

/** Web FeedPost – dark theme only (CSS variables + moxe tokens). */
export function FeedPost({
  id,
  author,
  authorAccountId,
  onPostDeleted,
  location,
  mediaUris,
  caption,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  isLiked: initialLiked = false,
  isSaved: initialSaved = false,
  adCampaignId,
  sponsorAccountId,
  adDestinationUrl,
  adUtm,
  screenshotProtection,
  hideEngagementCounts = false,
  /** When false, new comments and replies are blocked (server-enforced). */
  allowComments = true,
  /** Author chose to hide like count from viewers (combined with your “hide all counts” setting). */
  hideLikeCountFromAuthor = false,
  variant = 'dark',
}: {
  id: string;
  author: { username: string; displayName?: string; avatarUri?: string | null };
  /** Post author account id — required for correct owner vs viewer menu (edit/delete vs report). */
  authorAccountId?: string | null;
  onPostDeleted?: (postId: string) => void;
  location?: string;
  mediaUris: string[];
  caption?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  screenshotProtection?: boolean;
  hideEngagementCounts?: boolean;
  allowComments?: boolean;
  hideLikeCountFromAuthor?: boolean;
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
  /** @deprecated Ignored; app uses dark theme only. */
  variant?: 'light' | 'dark';
}) {
  const [isLiked, setLiked] = useState(initialLiked);
  const [isSaved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(likeCount);
  const [commentCountLocal, setCommentCountLocal] = useState(commentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [hiddenComments, setHiddenComments] = useState<any[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [hiddenError, setHiddenError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shareQuery, setShareQuery] = useState('');
  const [shareResults, setShareResults] = useState<{ id: string; username: string; displayName?: string | null }[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [showProtectionBanner, setShowProtectionBanner] = useState<boolean>(!!screenshotProtection);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const navigate = useNavigate();
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const cap = useAccountCapabilities();
  const canBoost = cap.label === 'BUSINESS' || cap.label === 'CREATOR';
  void variant;
  const bgArticle = 'bg-black border-b border-moxe-border';
  const textPrimary = 'text-moxe-text';
  const textSecondary = 'text-moxe-textSecondary';
  const surfaceCls = 'bg-moxe-surface';
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [boostSuccess, setBoostSuccess] = useState<string | null>(null);
  const [boostDailyBudget, setBoostDailyBudget] = useState('');
  const [boostDuration, setBoostDuration] = useState('7');
  const [adImpressionSent, setAdImpressionSent] = useState(false);
  const [adClickSent, setAdClickSent] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [translatedCaption, setTranslatedCaption] = useState<string | null>(null);
  const [captionTranslateLoading, setCaptionTranslateLoading] = useState(false);
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [translatingCommentId, setTranslatingCommentId] = useState<string | null>(null);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [bulkDeletingComments, setBulkDeletingComments] = useState(false);
  const [allowCommentsLocal, setAllowCommentsLocal] = useState(allowComments);
  const [hideLikeFromAuthorLocal, setHideLikeFromAuthorLocal] = useState(!!hideLikeCountFromAuthor);
  const [snoozeSubmitting, setSnoozeSubmitting] = useState(false);
  const currentAccount = useCurrentAccount() as { id?: string; username?: string } | null;
  const myAccountId = currentAccount?.id;
  const isOwnPost =
    !!(myAccountId && authorAccountId && myAccountId === authorAccountId) ||
    !!(myAccountId && author?.username && currentAccount?.username === author.username);
  const isSponsored = !!adCampaignId;
  const suppressPublicLikeCount = hideEngagementCounts || hideLikeFromAuthorLocal;

  useEffect(() => {
    setAllowCommentsLocal(allowComments);
  }, [allowComments]);

  useEffect(() => {
    setHideLikeFromAuthorLocal(!!hideLikeCountFromAuthor);
  }, [hideLikeCountFromAuthor]);

  useEffect(() => {
    setCommentCountLocal(commentCount);
  }, [commentCount]);

  useEffect(() => {
    if (!showComments) setCommentMenuId(null);
  }, [showComments]);

  useEffect(() => {
    if (!commentMenuId) return;
    const close = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('[data-comment-menu]')) return;
      setCommentMenuId(null);
    };
    document.addEventListener('pointerdown', close, false);
    return () => document.removeEventListener('pointerdown', close, false);
  }, [commentMenuId]);

  useEffect(() => {
    setLikes(likeCount);
  }, [likeCount]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onPostUpdated = (payload: {
      postId: string;
      likeCount?: number;
      commentCount?: number;
      comment?: any;
      allowComments?: boolean;
      hideLikeCount?: boolean;
    }) => {
      if (payload.postId !== id) return;
      if (payload.likeCount !== undefined) setLikes(payload.likeCount);
      if (payload.commentCount !== undefined) setCommentCountLocal(payload.commentCount);
      if (payload.allowComments !== undefined) setAllowCommentsLocal(!!payload.allowComments);
      if (payload.hideLikeCount !== undefined) setHideLikeFromAuthorLocal(!!payload.hideLikeCount);
      if (payload.comment && showComments) {
        setComments((prev) => {
          if (prev.some((c) => c.id === payload.comment?.id)) return prev;
          return [{ ...payload.comment, createdAt: payload.comment.createdAt ?? new Date().toISOString() }, ...prev];
        });
      }
    };
    socket.on('post:updated', onPostUpdated);
    return () => {
      socket.off('post:updated', onPostUpdated);
    };
  }, [id, showComments]);

  // Record a lightweight VIEW interaction once when the post mounts.
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/posts/${id}/interactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'VIEW' }),
    }).catch(() => {});
  }, [id]);

  // Record ad impression once when an ad CampaignId is present.
  useEffect(() => {
    if (!adCampaignId || adImpressionSent) return;
    const token = getToken();
    if (!token || !sponsorAccountId) return;
    setAdImpressionSent(true);
    fetch(`${getApiBase()}/analytics/record-event`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetAccountId: sponsorAccountId,
        eventType: 'ad_impression',
        metadata: { campaignId: adCampaignId, postId: id },
      }),
    }).catch(() => {});
  }, [adCampaignId, sponsorAccountId, adImpressionSent, id]);

  const patchMyPostSettings = async (body: { allowComments?: boolean; hideLikeCount?: boolean }) => {
    try {
      const res = await fetchApi(`posts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { allowComments?: boolean; hideLikeCount?: boolean; error?: string };
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not update post.');
      if (typeof data.allowComments === 'boolean') setAllowCommentsLocal(data.allowComments);
      if (typeof data.hideLikeCount === 'boolean') setHideLikeFromAuthorLocal(!!data.hideLikeCount);
      toast.success('Post updated');
      setShowPostMenu(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not update post.');
    }
  };

  const snoozeAuthor = async (days: number) => {
    if (!authorAccountId) return;
    setSnoozeSubmitting(true);
    try {
      const res = await fetchApi('privacy/snooze', {
        method: 'POST',
        body: JSON.stringify({ accountId: authorAccountId, durationDays: days }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not snooze.');
      toast.success(`@${author.username} snoozed — fewer posts from them in your feed for ${days} days.`);
      setShowPostMenu(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not snooze.');
    } finally {
      setSnoozeSubmitting(false);
    }
  };

  const recordAdClick = () => {
    if (!adCampaignId || adClickSent) return;
    const token = getToken();
    if (!token || !sponsorAccountId) return;
    setAdClickSent(true);
    fetch(`${getApiBase()}/analytics/record-event`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetAccountId: sponsorAccountId,
        eventType: 'ad_click',
        metadata: { campaignId: adCampaignId, postId: id, destinationUrl: adDestinationUrl ?? null },
      }),
    }).catch(() => {});
    fetch(`${getApiBase()}/ads/track-click`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId: adCampaignId }),
    }).catch(() => {});
  };

  const totalMedia = mediaUris.length || 1;

  const goPrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalMedia <= 1) return;
    setCurrentMediaIndex((idx) => (idx === 0 ? totalMedia - 1 : idx - 1));
  };

  const goNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalMedia <= 1) return;
    setCurrentMediaIndex((idx) => (idx === totalMedia - 1 ? 0 : idx + 1));
  };

  const handleDoubleTapLike = () => {
    if (!isLiked) {
      toggleLike();
    }
  };

  const toggleLike = async () => {
    const token = getToken();
    const nextLiked = !isLiked;
    // Optimistic UI update
    setLiked(nextLiked);
    setLikes((n) => (nextLiked ? n + 1 : Math.max(0, n - 1)));
    if (!token) return;
    try {
      const method = nextLiked ? 'POST' : 'DELETE';
      const res = await fetch(`${getApiBase()}/posts/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update like');
    } catch {
      // If request fails, silently revert
      setLiked(isLiked);
      setLikes(likeCount);
      toast.error('Could not update like. Please try again.');
    }
  };

  const openSaveModal = () => {
    setShowSaveModal(true);
    setCollectionsLoading(true);
    const token = getToken();
    if (!token) {
      setCollectionsLoading(false);
      setShowSaveModal(false);
      toast.error('Log in to save posts.');
      return;
    }
    fetch(`${getApiBase()}/collections`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string; name: string }[]) => setCollections(Array.isArray(list) ? list : []))
      .catch(() => setCollections([]))
      .finally(() => setCollectionsLoading(false));
  };

  const saveToCollection = async (collectionId: string | null) => {
    setShowSaveModal(false);
    const token = getToken();
    if (!token) return;
    setSaved(true);
    try {
      await fetch(`${getApiBase()}/posts/${id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionId ? { collectionId } : {}),
      });
    } catch {
      setSaved(false);
    }
  };

  const toggleSave = async () => {
    if (isSaved) {
      const token = getToken();
      if (!token) return;
      setSaved(false);
      try {
        const res = await fetch(`${getApiBase()}/posts/${id}/save`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to unsave');
      } catch {
        setSaved(true);
        toast.error('Could not update saved status. Please try again.');
      }
      return;
    }
    openSaveModal();
  };

  const openComments = async () => {
    setShowComments(true);
    setCommentsLoading(true);
    setCommentError(null);
    try {
      const data = (await fetchApiJson(`posts/${id}/comments?limit=30`)) as {
        items?: unknown[];
        comments?: unknown[];
      };
      setComments((data.items ?? data.comments ?? []) as any[]);
    } catch (e: unknown) {
      setCommentError(e instanceof Error ? e.message : 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowCommentsLocal) return;
    const text = newComment.trim();
    if (!text) return;
    const token = getToken();
    if (!token) {
      setCommentError('You must be logged in to comment.');
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, parentId: replyTo?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post comment.');
      }
      setComments((prev) => [data, ...prev]);
      setNewComment('');
      setReplyTo(null);
    } catch (e: any) {
      setCommentError(e.message || 'Failed to post comment.');
    }
  };

  const loadHiddenComments = async () => {
    setHiddenLoading(true);
    setHiddenError(null);
    setHiddenComments([]);
    try {
      const token = getToken();
      if (!token) {
        setHiddenError('Login required to review hidden comments.');
        setHiddenLoading(false);
        return;
      }
      const res = await fetch(`${getApiBase()}/posts/${id}/hidden-comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load hidden comments.');
      }
      setHiddenComments(data.items ?? data.comments ?? data ?? []);
    } catch (e: any) {
      setHiddenError(e.message || 'Failed to load hidden comments.');
    } finally {
      setHiddenLoading(false);
    }
  };

  const approveHiddenComment = async (commentId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/posts/comments/${commentId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setHiddenComments((prev) => prev.filter((c) => c.id !== commentId));
      // Optional: add it into visible comments list
    } catch {
      // ignore
    }
  };

  const deleteHiddenComment = async (commentId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setHiddenComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  };

  const saveEditedComment = async (commentId: string) => {
    const token = getToken();
    if (!token || !editCommentContent.trim()) return;
    try {
      const res = await fetch(`${getApiBase()}/posts/comments/${commentId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Edit failed.');
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: editCommentContent.trim() } : c)));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (e: any) {
      setCommentError(e.message || 'Failed to edit.');
    }
  };

  const searchRecipients = async () => {
    const q = shareQuery.trim();
    if (!q) {
      setShareResults([]);
      return;
    }
    setShareLoading(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const token = getToken();
      if (!token) {
        setShareError('Login required to share.');
        setShareLoading(false);
        return;
      }
      const res = await fetch(
        `${getApiBase()}/explore/search?q=${encodeURIComponent(q)}&type=users`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search users.');
      }
      const users = (data.users ?? []) as {
        id: string;
        username: string;
        displayName?: string | null;
      }[];
      setShareResults(users);
      setSelectedRecipientIds([]);
    } catch (e: any) {
      setShareError(e.message || 'Failed to search users.');
    } finally {
      setShareLoading(false);
    }
  };

  const shareToDM = async (recipientId: string) => {
    try {
      const token = getToken();
      if (!token) {
        setShareError('Login required to share.');
        return;
      }
      setShareError(null);
      setShareSuccess(null);
      const res = await fetch(`${getApiBase()}/messages/share-post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, postId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share post.');
      }
      setShareSuccess('Shared to DM.');
    } catch (e: any) {
      setShareError(e.message || 'Failed to share post.');
    }
  };

  const shareToManyDMs = async () => {
    try {
      const token = getToken();
      if (!token) {
        setShareError('Login required to share.');
        return;
      }
      if (!selectedRecipientIds.length) {
        setShareError('Select at least one person to share with.');
        return;
      }
      setShareError(null);
      setShareSuccess(null);
      let successCount = 0;
      for (const recipientId of selectedRecipientIds) {
        const res = await fetch(`${getApiBase()}/messages/share-post`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientId, postId: id }),
        });
        if (res.ok) successCount += 1;
      }
      setShareSuccess(
        successCount
          ? `Shared to ${successCount} ${successCount === 1 ? 'conversation' : 'conversations'}.`
          : 'Could not share to any conversations.',
      );
    } catch (e: any) {
      setShareError(e.message || 'Failed to share post.');
    }
  };

  const shareToStory = async () => {
    try {
      const token = getToken();
      if (!token) {
        setShareError('Login required to share.');
        return;
      }
      setShareError(null);
      setShareSuccess(null);
      const res = await fetch(`${getApiBase()}/stories/share-post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share to story.');
      }
      setShareSuccess('Added to your story.');
    } catch (e: any) {
      setShareError(e.message || 'Failed to share to story.');
    }
  };

  const boostPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setBoostError('Login required to promote.');
      return;
    }
    setBoostError(null);
    setBoostSuccess(null);
    setBoostLoading(true);
    try {
      const body: any = { postId: id, currency: 'USD' };
      if (boostDailyBudget.trim()) body.dailyBudget = Number(boostDailyBudget);
      if (boostDuration.trim()) body.durationDays = Number(boostDuration);
      const res = await fetch(`${getApiBase()}/ads/boost`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to boost post.');
      }
      setBoostSuccess('Boost created. It will start delivering shortly.');
    } catch (e: any) {
      setBoostError(e?.message || 'Failed to boost post.');
    } finally {
      setBoostLoading(false);
    }
  };

  const openSponsoredDestination = () => {
    if (isSponsored) recordAdClick();
    if (adDestinationUrl) {
      try {
        const url = new URL(adDestinationUrl);
        if (adUtm?.source) url.searchParams.set('utm_source', adUtm.source);
        if (adUtm?.medium) url.searchParams.set('utm_medium', adUtm.medium);
        if (adUtm?.campaign) url.searchParams.set('utm_campaign', adUtm.campaign);
        if (adUtm?.term) url.searchParams.set('utm_term', adUtm.term);
        if (adUtm?.content) url.searchParams.set('utm_content', adUtm.content);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
        return;
      } catch {
        // Fallback to internal post route
      }
    }
    navigate(`/post/${encodeURIComponent(id)}`);
  };

  const copyPostLink = async () => {
    try {
      const url = `${window.location.origin}/post/${encodeURIComponent(id)}`;
      await navigator.clipboard.writeText(url);
      toast.success('Post link copied.');
    } catch {
      toast.error('Unable to copy post link.');
    } finally {
      setShowPostMenu(false);
    }
  };

  const deletePost = async () => {
    const token = getToken();
    if (!token || !isOwnPost) {
      setShowPostMenu(false);
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Delete this post?')) {
      setShowPostMenu(false);
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/posts/${encodeURIComponent(id)}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Delete failed');
      toast.success('Post deleted.');
      setShowPostMenu(false);
      if (onPostDeleted) onPostDeleted(id);
      else navigate('/');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not delete post.');
      setShowPostMenu(false);
    }
  };

  const reportPost = async () => {
    const token = getToken();
    if (!token) {
      toast.error('Login required to report.');
      setShowPostMenu(false);
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'post',
          contentId: id,
          reason: 'inappropriate',
          note: 'Reported from feed menu',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Report submitted.');
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setShowPostMenu(false);
    }
  };

  return (
    <article className={`${bgArticle} mb-0`} data-testid="feed-post">
      <div className="flex items-center justify-between py-2 px-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar uri={author.avatarUri} size={32} />
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${textPrimary} truncate`}>{author.username}</p>
            {author.displayName && author.displayName.trim() !== author.username ? (
              <p className={`text-xs ${textSecondary} truncate`}>{author.displayName}</p>
            ) : null}
            {isSponsored ? (
              <p className={`text-[11px] font-medium ${textSecondary}`}>Sponsored</p>
            ) : null}
            {location && (
              <p className={`text-xs ${textSecondary} flex items-center gap-1 truncate`}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {location}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPostMenu(true)}
          className={`${textPrimary} text-lg leading-none p-1`}
          aria-label="More"
        >
          ⋯
        </button>
      </div>

      <div
        className={`w-full aspect-square ${surfaceCls} relative overflow-hidden`}
        onContextMenu={(e) => {
          if (screenshotProtection) e.preventDefault();
        }}
        onDoubleClick={handleDoubleTapLike}
      >
        {isVideoMediaUrl(mediaUris[currentMediaIndex]) ? (
          <video
            src={ensureAbsoluteMediaUrl(mediaUris[currentMediaIndex]) || ''}
            className="w-full h-full object-cover select-none"
            autoPlay
            loop
            muted
            playsInline
            controls
            preload="metadata"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.removeAttribute('src');
            }}
            onClick={() => {
              if (isSponsored) recordAdClick();
            }}
          />
        ) : (
          <img
            src={ensureAbsoluteMediaUrl(mediaUris[currentMediaIndex]) || ''}
            alt=""
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.src = 'https://via.placeholder.com/1080x1080/111111/666666?text=Media+Unavailable';
            }}
            onClick={() => {
              if (isSponsored) recordAdClick();
            }}
          />
        )}
        {isSponsored && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
              Ad
            </span>
          </div>
        )}
        {totalMedia > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1 active:bg-black/60"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-1 active:bg-black/60"
              aria-label="Next media"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {mediaUris.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full ${
                    idx === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {screenshotProtection && showProtectionBanner && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-moxe-md px-3 py-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-white">
              Screenshot & download protection is on for this post.
            </span>
            <button
              type="button"
              onClick={() => setShowProtectionBanner(false)}
              className="text-[11px] text-moxe-textSecondary"
            >
              OK
            </button>
          </div>
        )}
      </div>

      <div className={`flex items-center justify-between py-2 px-4`}>
        <div className="flex items-center gap-4">
          <button type="button" onClick={toggleLike} className={`flex items-center gap-1.5 leading-none ${textPrimary}`}>
            <Heart
              className="w-6 h-6 flex-shrink-0"
              fill={isLiked ? '#e1306c' : 'none'}
              stroke={isLiked ? '#e1306c' : 'currentColor'}
            />
            {!suppressPublicLikeCount && likes > 0 && (
              <span className="text-sm font-medium">
                {likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
              </span>
            )}
          </button>
          <button type="button" onClick={openComments} className={`flex items-center gap-1.5 leading-none ${textPrimary}`}>
            <MessageCircle className="w-6 h-6 flex-shrink-0" />
            {commentCountLocal > 0 && (
              <span className="text-sm font-medium">
                {commentCountLocal >= 1000 ? `${(commentCountLocal / 1000).toFixed(1)}K` : commentCountLocal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isSponsored) recordAdClick();
              setShowShare(true);
              setShareQuery('');
              setShareResults([]);
              setShareError(null);
              setShareSuccess(null);
            }}
            className={`leading-none ${textPrimary}`}
          >
            <Send className="w-6 h-6" />
          </button>
          {!hideEngagementCounts && shareCount > 0 && (
            <span className={`text-sm font-medium ${textSecondary}`}>
              {shareCount >= 1000 ? `${(shareCount / 1000).toFixed(1)}K` : shareCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canBoost && isOwnPost && (
            <button
              type="button"
              onClick={() => {
                if (isSponsored) recordAdClick();
                setBoostError(null);
                setBoostSuccess(null);
              }}
              className="text-[11px] font-semibold text-moxe-primary underline underline-offset-2"
            >
              Promote
            </button>
          )}
          <button type="button" onClick={toggleSave} className={`leading-none ${textPrimary}`}>
            <Bookmark
              className="w-6 h-6"
              fill={isSaved ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-moxe-surface rounded-t-3xl border-t border-moxe-border max-h-[50vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-moxe-border">
              <span className="font-semibold text-moxe-body">Save to</span>
              <button type="button" onClick={() => setShowSaveModal(false)} className="text-moxe-textSecondary text-lg px-2">✕</button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <button
                type="button"
                onClick={() => saveToCollection(null)}
                className="w-full px-4 py-3 text-left font-medium text-moxe-body hover:bg-moxe-background/50"
              >
                Save (no collection)
              </button>
              {collectionsLoading && <p className="px-4 py-2 text-sm text-moxe-textSecondary">Loading collections…</p>}
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => saveToCollection(c.id)}
                  className="w-full px-4 py-3 text-left text-moxe-body hover:bg-moxe-background/50"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!suppressPublicLikeCount && likes > 0 && (
        <p className={`text-sm font-semibold ${textPrimary} px-4 mb-1`}>
          {likes} {likes === 1 ? 'like' : 'likes'}
        </p>
      )}

      {caption && (
        <div className="px-4 mb-1">
          <p className={`text-sm ${textPrimary}`}>
            <span className="font-semibold">{author.username}</span>{' '}
            {translatedCaption !== null ? translatedCaption : caption}
          </p>
          {isSponsored && (
            <button
              type="button"
              onClick={openSponsoredDestination}
              className="mt-1 text-xs font-semibold text-moxe-primary"
            >
              Learn more
            </button>
          )}
          <div className="flex gap-2 mt-0.5">
            {translatedCaption !== null ? (
              <button
                type="button"
                onClick={() => setTranslatedCaption(null)}
                className={`text-xs ${textSecondary} hover:underline`}
              >
                Show original
              </button>
            ) : (
              <button
                type="button"
                disabled={captionTranslateLoading}
                onClick={async () => {
                  const token = getToken();
                  if (!token) return;
                  setCaptionTranslateLoading(true);
                  try {
                    const res = await fetch(`${getApiBase()}/translate/text`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: caption, sourceLang: 'en', targetLang: 'es' }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.translatedText) setTranslatedCaption(data.translatedText);
                  } finally {
                    setCaptionTranslateLoading(false);
                  }
                }}
                className={`text-xs ${textSecondary} hover:underline disabled:opacity-50`}
              >
                {captionTranslateLoading ? 'Translating…' : 'Translate'}
              </button>
            )}
          </div>
        </div>
      )}

      {commentCountLocal > 0 && (
        <button
          type="button"
          onClick={openComments}
          className={`px-4 mb-2 text-xs ${textSecondary}`}
        >
          View all {commentCountLocal} comments
        </button>
      )}

      {showComments && (
        <SocialCommentsSheet
          open={showComments}
          onClose={() => {
            setShowComments(false);
            setCommentMenuId(null);
          }}
          totalCount={Math.max(commentCountLocal, comments.length)}
          headerActions={
            isOwnPost && Math.max(commentCountLocal, comments.length) > 0 ? (
              <button
                type="button"
                disabled={bulkDeletingComments}
                onClick={async () => {
                  if (
                    !window.confirm('Delete all comments on this post? This cannot be undone.')
                  ) {
                    return;
                  }
                  setBulkDeletingComments(true);
                  try {
                    const res = await fetchApi(`posts/${encodeURIComponent(id)}/comments`, {
                      method: 'DELETE',
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(
                        typeof (data as { error?: string }).error === 'string'
                          ? (data as { error: string }).error
                          : 'Could not delete comments.',
                      );
                    }
                    setComments([]);
                    setCommentCountLocal(0);
                    setCommentMenuId(null);
                    setTranslatedComments({});
                    toast.success('All comments deleted');
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : 'Could not delete comments');
                  } finally {
                    setBulkDeletingComments(false);
                  }
                }}
                className="text-xs font-semibold text-red-400 px-2 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
              >
                {bulkDeletingComments ? 'Deleting…' : 'Delete all'}
              </button>
            ) : undefined
          }
          loading={commentsLoading}
          error={commentError}
          footer={
            allowCommentsLocal ? (
              <form
                onSubmit={submitComment}
                className="border-t border-[#262626] bg-[#121212] px-4 py-3 flex flex-col gap-2 pb-[max(12px,env(safe-area-inset-bottom))]"
              >
                {replyTo && (
                  <div className="flex items-center justify-between text-[11px] text-[#8e8e8e]">
                    <span>Replying to @{replyTo.username}</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-moxe-primary font-medium">
                      Cancel
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 min-h-[44px] px-4 rounded-full bg-[#262626] border border-[#363636] text-[15px] text-white placeholder:text-[#8e8e8e] outline-none focus:ring-1 focus:ring-moxe-primary"
                  />
                  <button
                    type="submit"
                    className="text-moxe-primary font-semibold text-[15px] px-2 py-1 disabled:opacity-40"
                    disabled={!newComment.trim()}
                  >
                    Post
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-[#262626] bg-[#121212] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                <p className="text-[13px] text-[#8e8e8e] text-center">Comments are turned off for this post.</p>
              </div>
            )
          }
        >
          <>
            {!commentsLoading &&
              !commentError &&
              comments.map((c) => {
                const isReply = !!c.parentId;
                const isMine = !!(myAccountId && c.account?.id === myAccountId);
                const isEditing = editingCommentId === c.id;
                const displayContent = translatedComments[c.id] ?? c.content;
                return (
                  <div
                    key={c.id}
                    data-comment-menu="true"
                    className={`relative ${isReply ? 'pl-3 ml-1 border-l-2 border-[#363636]' : ''}`}
                  >
                    {isEditing ? (
                      <div className="py-4 border-b border-[#262626] space-y-2">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#363636] text-white text-sm min-h-[80px]"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => saveEditedComment(c.id)}
                            className="text-sm text-moxe-primary font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentContent('');
                            }}
                            className="text-sm text-[#8e8e8e]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <SocialCommentRow
                          commentId={c.id}
                          content={displayContent}
                          createdAt={c.createdAt ?? new Date().toISOString()}
                          account={{
                            username: c.account?.username ?? 'user',
                            displayName: c.account?.displayName ?? null,
                            profilePhoto: c.account?.profilePhoto ?? c.account?.avatarUrl,
                          }}
                          usePseudoCounts
                          onMenu={() => setCommentMenuId(commentMenuId === c.id ? null : c.id)}
                          onReply={
                            allowCommentsLocal
                              ? () => {
                                  navigate(`/comments/${encodeURIComponent(c.id)}/replies`, {
                                    state: { focusComposer: true, fromPostId: id },
                                  });
                                  setShowComments(false);
                                  setCommentMenuId(null);
                                }
                              : undefined
                          }
                        />
                        {commentMenuId === c.id && (
                          <div className="absolute right-0 top-10 z-50 bg-[#262626] border border-[#363636] rounded-xl shadow-xl py-1 min-w-[168px] text-left">
                            {!translatedComments[c.id] ? (
                              <button
                                type="button"
                                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                                disabled={translatingCommentId === c.id}
                                onClick={async () => {
                                  const token = getToken();
                                  if (!token || !c.content) return;
                                  setTranslatingCommentId(c.id);
                                  try {
                                    const res = await fetch(`${getApiBase()}/translate/text`, {
                                      method: 'POST',
                                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ text: c.content, sourceLang: 'en', targetLang: 'es' }),
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (res.ok && data.translatedText) {
                                      setTranslatedComments((prev) => ({ ...prev, [c.id]: data.translatedText }));
                                    }
                                  } finally {
                                    setTranslatingCommentId(null);
                                  }
                                  setCommentMenuId(null);
                                }}
                              >
                                {translatingCommentId === c.id ? 'Translating…' : 'Translate'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                                onClick={() => {
                                  setTranslatedComments((prev) => {
                                    const next = { ...prev };
                                    delete next[c.id];
                                    return next;
                                  });
                                  setCommentMenuId(null);
                                }}
                              >
                                Show original
                              </button>
                            )}
                            {isMine && (
                              <button
                                type="button"
                                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditCommentContent(c.content);
                                  setCommentMenuId(null);
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {!isMine && c.account?.id && myAccountId && c.account.id !== myAccountId && (
                              <button
                                type="button"
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10"
                                onClick={async () => {
                                  const targetId = c.account?.id as string;
                                  if (!targetId) return;
                                  if (
                                    !window.confirm(
                                      `Block @${c.account?.username ?? 'user'}? Their comments will disappear from this post for you.`,
                                    )
                                  ) {
                                    return;
                                  }
                                  setCommentMenuId(null);
                                  const token = getToken();
                                  if (!token) {
                                    toast.error('Sign in to block accounts.');
                                    return;
                                  }
                                  try {
                                    const res = await fetch(`${getApiBase()}/privacy/block`, {
                                      method: 'POST',
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ accountId: targetId }),
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                      throw new Error(
                                        typeof (data as { error?: string }).error === 'string'
                                          ? (data as { error: string }).error
                                          : 'Could not block.',
                                      );
                                    }
                                    const before = comments.length;
                                    const next = comments.filter((row) => row.account?.id !== targetId);
                                    const removed = before - next.length;
                                    setComments(next);
                                    setCommentCountLocal((n) => Math.max(0, n - removed));
                                    toast.success('Account blocked');
                                  } catch (e: unknown) {
                                    toast.error(e instanceof Error ? e.message : 'Could not block.');
                                  }
                                }}
                              >
                                Block @{c.account?.username ?? 'user'}
                              </button>
                            )}
                            {allowCommentsLocal ? (
                              <button
                                type="button"
                                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                                onClick={() => {
                                  setReplyTo({ id: c.id, username: c.account?.username ?? 'user' });
                                  setNewComment(`@${c.account?.username ?? 'user'} `);
                                  setCommentMenuId(null);
                                }}
                              >
                                Reply
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                              onClick={() => {
                                navigate(`/comments/${encodeURIComponent(c.id)}/replies`);
                                setShowComments(false);
                                setCommentMenuId(null);
                              }}
                            >
                              View thread
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            {!commentsLoading && !commentError && comments.length === 0 && <SocialCommentsEmpty />}
            {isOwnPost && hiddenComments.length > 0 && (
              <div className="border-t border-[#262626] py-3 mt-2">
                <button
                  type="button"
                  onClick={loadHiddenComments}
                  className="text-moxe-primary text-xs font-semibold"
                >
                  Review hidden comments ({hiddenComments.length})
                </button>
              </div>
            )}
            {isOwnPost && hiddenComments.length > 0 && (
              <div className="pb-4 max-h-36 overflow-auto space-y-2 text-sm text-[#e8e8e8]">
                {hiddenLoading && <p className="text-[#8e8e8e]">Loading hidden comments…</p>}
                {hiddenError && !hiddenLoading && <p className="text-red-400">{hiddenError}</p>}
                {!hiddenLoading &&
                  !hiddenError &&
                  hiddenComments.map((hc) => (
                    <div key={hc.id} className="flex items-start justify-between gap-2 py-1 border-b border-[#262626] last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white">@{hc.account?.username ?? 'user'}</span>{' '}
                        <span className="text-[#e8e8e8]">{hc.content}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] shrink-0">
                        <button type="button" onClick={() => approveHiddenComment(hc.id)} className="text-moxe-primary">
                          Approve
                        </button>
                        <button type="button" onClick={() => deleteHiddenComment(hc.id)} className="text-[#8e8e8e]">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        </SocialCommentsSheet>
      )}

      {canBoost && isOwnPost && (boostError || boostSuccess || boostLoading) && (
        <div className="px-moxe-md pb-2">
          <form
            onSubmit={boostPost}
            className="mt-1 rounded-lg border border-moxe-border bg-moxe-surface px-3 py-2 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-moxe-textSecondary mb-0.5">Daily budget (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={boostDailyBudget}
                  onChange={(e) => setBoostDailyBudget(e.target.value)}
                  className="w-full rounded-md border border-moxe-border bg-moxe-background px-2 py-1 text-[11px] text-moxe-text"
                  placeholder="Optional"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-moxe-textSecondary mb-0.5">Days</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={boostDuration}
                  onChange={(e) => setBoostDuration(e.target.value)}
                  className="w-full rounded-md border border-moxe-border bg-moxe-background px-2 py-1 text-[11px] text-moxe-text"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="submit"
                disabled={boostLoading}
                className="px-3 py-1.5 rounded-full bg-moxe-primary text-white text-[11px] font-semibold disabled:opacity-60"
              >
                {boostLoading ? 'Promoting…' : 'Start promotion'}
              </button>
              {boostError && (
                <span className="text-[11px] text-moxe-danger truncate max-w-[160px]">
                  {boostError}
                </span>
              )}
              {boostSuccess && !boostError && (
                <span className="text-[11px] text-moxe-primary truncate max-w-[160px]">
                  {boostSuccess}
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-moxe-surface rounded-t-3xl border-t border-moxe-border max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-moxe-md py-2 border-b border-moxe-border">
              <span className="text-moxe-body font-semibold">Share</span>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="text-moxe-textSecondary text-lg leading-none px-2"
              >
                ✕
              </button>
            </div>
            <div className="px-moxe-md py-3 space-y-3 text-moxe-body">
              <button
                type="button"
                onClick={shareToStory}
                className="w-full py-2 rounded-moxe-md bg-moxe-primary text-white text-sm font-semibold"
              >
                Quick add to your story
              </button>
              <button
                type="button"
                onClick={() => {
                  const AnyWin = window as any;
                  if (AnyWin && AnyWin.location) {
                    AnyWin.location.href = `/stories/create`;
                    // Simple hint via localStorage for now
                    try {
                      localStorage.setItem(
                        'moxe_share_story_hint',
                        JSON.stringify({
                          fromPostId: id,
                        }),
                      );
                    } catch {
                      // ignore
                    }
                  }
                }}
                className="w-full py-2 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-text text-sm font-semibold"
              >
                Customize share to story
              </button>
              <div className="pt-2 border-t border-moxe-border/60 space-y-2">
                <p className="text-moxe-caption text-moxe-textSecondary">
                  Share in a direct message
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={shareQuery}
                    onChange={(e) => setShareQuery(e.target.value)}
                    placeholder="Search people…"
                    className="flex-1 bg-moxe-background border border-moxe-border rounded-full px-3 py-1.5 text-moxe-body text-moxe-text placeholder:text-moxe-textSecondary"
                  />
                  <button
                    type="button"
                    onClick={searchRecipients}
                    className="text-moxe-primary text-sm font-semibold"
                  >
                    Go
                  </button>
                </div>
                {shareLoading && (
                  <p className="text-moxe-caption text-moxe-textSecondary">
                    Searching…
                  </p>
                )}
                {shareError && (
                  <p className="text-moxe-caption text-moxe-danger">
                    {shareError}
                  </p>
                )}
                {shareSuccess && (
                  <p className="text-moxe-caption text-moxe-primary">
                    {shareSuccess}
                  </p>
                )}
                <div className="max-h-40 overflow-auto space-y-1">
                  {shareResults.map((u) => (
                    <label
                      key={u.id}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-moxe-md bg-moxe-background text-left cursor-pointer"
                    >
                      <span className="text-moxe-body">
                        @{u.username}
                        {u.displayName ? (
                          <span className="text-moxe-textSecondary text-[11px] ml-1">
                            · {u.displayName}
                          </span>
                        ) : null}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedRecipientIds.includes(u.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedRecipientIds((prev) =>
                            checked ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                          );
                        }}
                        className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                      />
                    </label>
                  ))}
                </div>
                {shareResults.length > 0 && (
                  <button
                    type="button"
                    onClick={shareToManyDMs}
                    className="mt-2 w-full py-2 rounded-moxe-md bg-moxe-primary text-white text-xs font-semibold disabled:opacity-50"
                    disabled={!selectedRecipientIds.length}
                  >
                    Share to{' '}
                    {selectedRecipientIds.length || ''}{' '}
                    {selectedRecipientIds.length === 1 ? 'conversation' : 'conversations'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPostMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowPostMenu(false)}>
          <div
            className="w-full max-w-[480px] bg-moxe-surface rounded-t-3xl border-t border-moxe-border max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-moxe-border text-center text-sm font-semibold text-moxe-body">
              Post options
            </div>
            <div className="py-2">
              <button
                type="button"
                onClick={() => {
                  navigate(`/post/${encodeURIComponent(id)}`);
                  setShowPostMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60"
              >
                View post
              </button>
              <button
                type="button"
                onClick={copyPostLink}
                className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPostMenu(false);
                  if (isSaved) void toggleSave();
                  else openSaveModal();
                }}
                className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60"
              >
                {isSaved ? 'Remove from saved' : 'Save post'}
              </button>
              {!isOwnPost && authorAccountId && !isSponsored && (
                <>
                  <button
                    type="button"
                    disabled={snoozeSubmitting}
                    onClick={() => void snoozeAuthor(30)}
                    className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60 disabled:opacity-50"
                  >
                    Snooze @{author.username} (30 days)
                  </button>
                  <button
                    type="button"
                    disabled={snoozeSubmitting}
                    onClick={() => void snoozeAuthor(7)}
                    className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60 disabled:opacity-50"
                  >
                    Snooze 7 days
                  </button>
                </>
              )}
              {isOwnPost && (
                <>
                  <button
                    type="button"
                    onClick={() => void patchMyPostSettings({ allowComments: !allowCommentsLocal })}
                    className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60"
                  >
                    {allowCommentsLocal ? 'Turn off commenting' : 'Turn on commenting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchMyPostSettings({ hideLikeCount: !hideLikeFromAuthorLocal })}
                    className="w-full px-4 py-3 text-left text-sm text-moxe-text hover:bg-moxe-background/60"
                  >
                    {hideLikeFromAuthorLocal ? 'Show like count to others' : 'Hide like count from others'}
                  </button>
                </>
              )}
              {isOwnPost ? (
                <button
                  type="button"
                  onClick={() => void deletePost()}
                  className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-moxe-background/60"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reportPost}
                  className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-moxe-background/60"
                >
                  Report
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPostMenu(false)}
                className="w-full px-4 py-3 text-left text-sm text-moxe-textSecondary hover:bg-moxe-background/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
