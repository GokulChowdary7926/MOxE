import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedInput, ThemedText } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';
import { SocialCommentRow } from '../../components/comments/SocialCommentRow';
import { ErrorState } from '../../components/ui/ErrorState';
import { getApiBase, getToken } from '../../services/api';
import { fetchClientSettings } from '../../services/clientSettings';
import { getSocket } from '../../services/socket';
import { getMediaUrls } from '../../utils/mediaEntries';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [hideEngagementCounts, setHideEngagementCounts] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const refreshCountVisibility = useCallback(() => {
    void fetchClientSettings()
      .then((settings) => {
        setHideEngagementCounts(!!settings.socialCounts?.hideLikeAndShareCounts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCountVisibility();
  }, [refreshCountVisibility]);

  useEffect(() => {
    const onFocus = () => refreshCountVisibility();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshCountVisibility]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const token = getToken();
    const API_BASE = getApiBase();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/posts/${id}`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setPost(data);
          return;
        }
        throw new Error('Post not found');
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load post.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !post || comments.length > 0) return;
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${getApiBase()}/posts/${id}/comments?limit=50`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = data?.items ?? data?.comments ?? [];
        setComments(Array.isArray(items) ? items : []);
      })
      .catch(() => setComments([]));
  }, [id, post, comments.length]);

  useEffect(() => {
    if (!id) return;
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
      if (payload.likeCount !== undefined && post) {
        setPost((p: any) => (p ? { ...p, likeCount: payload.likeCount } : null));
      }
      if (payload.commentCount !== undefined && post) {
        setPost((p: any) => (p ? { ...p, commentCount: payload.commentCount } : null));
      }
      if (payload.allowComments !== undefined && post) {
        setPost((p: any) => (p ? { ...p, allowComments: payload.allowComments } : null));
      }
      if (payload.hideLikeCount !== undefined && post) {
        setPost((p: any) => (p ? { ...p, hideLikeCount: payload.hideLikeCount } : null));
      }
      if (payload.comment) {
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
  }, [id, post]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post?.allowComments === false) return;
    const text = newComment.trim();
    if (!text || !id) return;
    setPosting(true);
    const token = getToken();
    if (token) {
      try {
        const res = await fetch(`${getApiBase()}/posts/${id}/comments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data) {
          setComments((prev) => [data, ...prev]);
          setNewComment('');
        }
      } catch {
        // fallback: add locally
        setComments((prev) => [
          {
            id: `c-${Date.now()}`,
            content: text,
            createdAt: new Date().toISOString(),
            account: post?.author ?? { username: 'You', profilePhoto: null },
          },
          ...prev,
        ]);
        setNewComment('');
      }
    } else {
      setComments((prev) => [
        {
          id: `c-${Date.now()}`,
          content: text,
          createdAt: new Date().toISOString(),
          account: { username: 'you', profilePhoto: null },
        },
        ...prev,
      ]);
      setNewComment('');
    }
    setPosting(false);
  };

  const blockCommentAuthor = async (comment: any) => {
    const targetId = comment?.account?.id;
    const username = comment?.account?.username ?? 'user';
    if (!targetId) return;
    if (!window.confirm(`Block @${username}?`)) return;
    const token = getToken();
    if (!token) {
      toast.error('Sign in to block accounts.');
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/privacy/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: targetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Could not block.');
      const before = comments.length;
      const next = comments.filter((row) => row.account?.id !== targetId);
      setComments(next);
      setPost((p: any) =>
        p
          ? {
              ...p,
              commentCount: Math.max(0, Number(p.commentCount ?? before) - (before - next.length)),
            }
          : p,
      );
      toast.success(`Blocked @${username}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not block.');
    } finally {
      setCommentMenuId(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Post" backTo="/" className="bg-black">
        <div className="py-8 text-center">
          <ThemedText secondary className="text-moxe-caption">Loading…</ThemedText>
        </div>
      </PageLayout>
    );
  }

  if (error && !post) {
    return (
      <PageLayout title="Post" backTo="/" className="bg-black">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </PageLayout>
    );
  }

  if (!post) return null;

  const allowComments = post.allowComments !== false;
  const acc = post.account ?? {};
  const author = post.author ?? {
    id: acc.id,
    username: acc.username,
    displayName: acc.displayName,
    avatarUrl: acc.profilePhoto,
    profilePhoto: acc.profilePhoto,
  };
  const mediaUris = Array.isArray(post.media)
    ? getMediaUrls(post.media)
    : [post.mediaUrl ?? post.media_uri].filter(Boolean);

  return (
    <PageLayout title="Post" backTo="/" className="bg-black" fullBleed noBottomPad>
      <div className="pb-20 overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        <FeedPost
          id={post.id}
          authorAccountId={post.accountId ?? acc.id ?? (author as { id?: string }).id}
          onPostDeleted={() => navigate(-1)}
          author={{
            username: author.username ?? 'user',
            displayName: author.displayName,
            avatarUri: author.avatarUrl ?? author.profilePhoto,
          }}
          location={post.location}
          mediaUris={mediaUris.length ? mediaUris : ['']}
          caption={post.caption}
          likeCount={post.likeCount ?? 0}
          commentCount={post.commentCount ?? comments.length}
          shareCount={post.shareCount ?? post.sharesCount ?? 0}
          hideEngagementCounts={hideEngagementCounts}
          isLiked={!!(post.isLiked ?? post.viewerHasLiked)}
          isSaved={!!(post.isSaved ?? post.viewerHasSaved)}
          allowComments={allowComments}
          hideLikeCountFromAuthor={!!post.hideLikeCount}
        />
        <div className="bg-black border-t border-[#262626] px-4 pt-4 pb-6">
          <h2 className="text-[17px] font-bold text-white mb-1">
            Comments ({post.commentCount ?? comments.length} Comment{(post.commentCount ?? comments.length) === 1 ? '' : 's'})
          </h2>
          <div className="mb-4">
            {comments.map((c) => (
              <div key={c.id} className="relative">
                <SocialCommentRow
                  commentId={c.id}
                  content={c.content}
                  createdAt={c.createdAt}
                  account={{
                    id: c.account?.id,
                    username: c.account?.username ?? 'user',
                    displayName: c.account?.displayName ?? null,
                    profilePhoto: c.account?.profilePhoto ?? c.account?.avatarUrl,
                  }}
                  usePseudoCounts
                  onMenu={() => setCommentMenuId((prev) => (prev === c.id ? null : c.id))}
                  onReply={
                    allowComments
                      ? () =>
                          navigate(`/comments/${encodeURIComponent(c.id)}/replies`, {
                            state: { focusComposer: true, fromPostId: id },
                          })
                      : undefined
                  }
                />
                {commentMenuId === c.id && (
                  <div className="absolute right-0 top-10 z-20 bg-[#262626] border border-[#363636] rounded-xl shadow-xl py-1 min-w-[168px]">
                    {allowComments ? (
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                        onClick={() => {
                          navigate(`/comments/${encodeURIComponent(c.id)}/replies`, {
                            state: { focusComposer: true, fromPostId: id },
                          });
                          setCommentMenuId(null);
                        }}
                      >
                        Reply
                      </button>
                    ) : null}
                    {c.account?.id ? (
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10"
                        onClick={() => void blockCommentAuthor(c)}
                      >
                        Block @{c.account?.username ?? 'user'}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
          {allowComments ? (
            <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
              <ThemedInput
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 !rounded-full !bg-[#262626] !border-[#363636] !text-white placeholder:!text-[#8e8e8e]"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="text-moxe-primary font-semibold text-[15px] px-3 py-2 disabled:opacity-40 flex-shrink-0"
              >
                {posting ? '…' : 'Post'}
              </button>
            </form>
          ) : (
            <p className="text-[13px] text-[#8e8e8e] py-2">Comments are turned off for this post.</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
