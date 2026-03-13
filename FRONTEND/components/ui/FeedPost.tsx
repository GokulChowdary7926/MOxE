import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';

/** Web FeedPost – matches mobile (header, square media, actions, likes, caption). variant=light for home. */
export function FeedPost({
  id,
  author,
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
  screenshotProtection,
  variant = 'dark',
}: {
  id: string;
  author: { username: string; displayName?: string; avatarUri?: string | null };
  location?: string;
  mediaUris: string[];
  caption?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  screenshotProtection?: boolean;
  adCampaignId?: string;
  sponsorAccountId?: string;
  variant?: 'light' | 'dark';
}) {
  const [isLiked, setLiked] = useState(initialLiked);
  const [isSaved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(likeCount);
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
  const isLight = variant === 'light';
  const bgArticle = isLight ? 'bg-white' : 'bg-moxe-background';
  const textPrimary = isLight ? 'text-[#262626]' : 'text-moxe-text';
  const textSecondary = isLight ? 'text-[#8e8e8e]' : 'text-moxe-textSecondary';
  const surfaceCls = isLight ? 'bg-[#fafafa]' : 'bg-moxe-surface';
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [boostSuccess, setBoostSuccess] = useState<string | null>(null);
  const [boostDailyBudget, setBoostDailyBudget] = useState('');
  const [boostDuration, setBoostDuration] = useState('7');
  const [adImpressionSent, setAdImpressionSent] = useState(false);
  const [adClickSent, setAdClickSent] = useState(false);

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
        metadata: { campaignId: adCampaignId, postId: id },
      }),
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
      await fetch(`${getApiBase()}/posts/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // If request fails, silently revert
      setLiked(isLiked);
      setLikes(likeCount);
    }
  };

  const toggleSave = async () => {
    const token = getToken();
    const nextSaved = !isSaved;
    setSaved(nextSaved);
    if (!token) return;
    try {
      const method = nextSaved ? 'POST' : 'DELETE';
      await fetch(`${getApiBase()}/posts/${id}/save`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: nextSaved ? JSON.stringify({}) : undefined,
      });
    } catch {
      setSaved(isSaved);
    }
  };

  const openComments = async () => {
    setShowComments(true);
    setCommentsLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`${getApiBase()}/posts/${id}/comments?limit=30`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load comments.');
      }
      setComments(data.items ?? data.comments ?? data ?? []);
    } catch (e: any) {
      setCommentError(e.message || 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <article
      className={`${bgArticle} mb-4`}
      onClick={() => {
        if (adCampaignId) recordAdClick();
      }}
    >
      <div className={`flex items-center justify-between py-3 px-4`}>
        <div className="flex items-center gap-2.5">
          <Avatar uri={author.avatarUri} size={32} />
          <div>
            <p className={`text-sm font-semibold ${textPrimary}`}>{author.displayName || author.username}</p>
            {location && (
              <p className={`text-xs ${textSecondary} flex items-center gap-1`}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {location}
              </p>
            )}
          </div>
        </div>
        <button type="button" className={`${textPrimary} text-lg leading-none p-1`} aria-label="More">
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
        <img
          src={mediaUris[currentMediaIndex] || ''}
          alt=""
          className="w-full h-full object-cover select-none"
        />
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
            {likes > 0 && (
              <span className="text-sm font-medium">
                {likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
              </span>
            )}
          </button>
          <button type="button" onClick={openComments} className={`flex items-center gap-1.5 leading-none ${textPrimary}`}>
            <MessageCircle className="w-6 h-6 flex-shrink-0" />
            {commentCount > 0 && (
              <span className="text-sm font-medium">
                {commentCount >= 1000 ? `${(commentCount / 1000).toFixed(1)}K` : commentCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
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
          {shareCount > 0 && (
            <span className={`text-sm font-medium ${textSecondary}`}>
              {shareCount >= 1000 ? `${(shareCount / 1000).toFixed(1)}K` : shareCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canBoost && (
            <button
              type="button"
              onClick={() => {
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

      {likes > 0 && (
        <p className={`text-sm font-semibold ${textPrimary} px-4 mb-1`}>
          {likes} {likes === 1 ? 'like' : 'likes'}
        </p>
      )}

      {caption && (
        <div className="px-4 mb-1">
          <p className={`text-sm ${textPrimary}`}>
            <span className="font-semibold">{author.username}</span> {caption}
          </p>
        </div>
      )}

      {commentCount > 0 && (
        <button
          type="button"
          onClick={openComments}
          className={`px-4 mb-2 text-xs ${textSecondary}`}
        >
          View all {commentCount} comments
        </button>
      )}

      {showComments && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-moxe-surface rounded-t-3xl border-t border-moxe-border max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-moxe-md py-2 border-b border-moxe-border">
              <span className="text-moxe-body font-semibold">Comments</span>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="text-moxe-textSecondary text-lg leading-none px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto px-moxe-md py-2 space-y-2">
              {commentsLoading && (
                <p className="text-moxe-caption text-moxe-textSecondary">Loading comments…</p>
              )}
              {commentError && !commentsLoading && (
                <p className="text-moxe-caption text-moxe-danger">{commentError}</p>
              )}
              {!commentsLoading &&
                !commentError &&
                comments.map((c) => {
                  const isReply = !!c.parentId;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 ${isReply ? 'ml-8' : ''}`}
                    >
                      <Avatar uri={c.account?.profilePhoto} size={26} />
                      <div className="flex-1">
                        <p className="text-moxe-body text-moxe-text">
                          <span className="font-semibold">{c.account?.username ?? 'user'}</span>{' '}
                          {c.content}
                        </p>
                        <div className="flex gap-3 mt-0.5 text-moxe-caption text-moxe-textSecondary">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTo({ id: c.id, username: c.account?.username ?? 'user' });
                              setNewComment(`@${c.account?.username ?? 'user'} `);
                            }}
                            className="hover:text-moxe-text"
                          >
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/comments/${encodeURIComponent(c.id)}/replies`)
                            }
                            className="hover:text-moxe-text"
                          >
                            View thread
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {!commentsLoading && !commentError && comments.length === 0 && (
                <p className="text-moxe-caption text-moxe-textSecondary">No comments yet.</p>
              )}
            </div>
            {hiddenComments.length > 0 && (
              <div className="border-t border-moxe-border px-moxe-md py-2 text-moxe-caption">
                <button
                  type="button"
                  onClick={loadHiddenComments}
                  className="text-moxe-primary text-xs"
                >
                  Review hidden comments ({hiddenComments.length})
                </button>
              </div>
            )}
            {hiddenComments.length > 0 && (
              <div className="px-moxe-md pb-2 max-h-32 overflow-auto space-y-1 text-moxe-caption">
                {hiddenLoading && (
                  <p className="text-moxe-textSecondary">Loading hidden comments…</p>
                )}
                {hiddenError && !hiddenLoading && (
                  <p className="text-moxe-danger">{hiddenError}</p>
                )}
                {!hiddenLoading &&
                  !hiddenError &&
                  hiddenComments.map((hc) => (
                    <div
                      key={hc.id}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="flex-1">
                        <span className="font-semibold">@{hc.account?.username ?? 'user'}</span>{' '}
                        {hc.content}
                      </div>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => approveHiddenComment(hc.id)}
                          className="text-moxe-primary"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHiddenComment(hc.id)}
                          className="text-moxe-textSecondary"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <form onSubmit={submitComment} className="border-t border-moxe-border px-moxe-md py-2 flex flex-col gap-1">
              {replyTo && (
                <div className="flex items-center justify-between text-[11px] text-moxe-textSecondary mb-1">
                  <span>Replying to @{replyTo.username}</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="px-1"
                  >
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
                className="flex-1 bg-moxe-background border border-moxe-border rounded-full px-3 py-1.5 text-moxe-body text-moxe-text placeholder:text-moxe-textSecondary"
              />
              <button
                type="submit"
                className="text-moxe-primary text-sm font-semibold disabled:opacity-50"
                disabled={!newComment.trim()}
              >
                Post
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {canBoost && (boostError || boostSuccess || boostLoading) && (
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
                    AnyWin.location.href = `/create/story`;
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
    </article>
  );
}
