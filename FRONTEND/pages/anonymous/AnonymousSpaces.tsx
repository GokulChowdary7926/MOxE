import React, { useEffect, useState } from 'react';
import { ThemedView, ThemedHeader, ThemedText, ThemedInput, ThemedButton } from '../../components/ui/Themed';
import { safeFirstId } from '../../utils/safeAccess';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Space = { id: string; name: string; description?: string | null };
type SpacePost = {
  id: string;
  content: string;
  score: number;
  createdAt: string;
  commentCount?: number;
};

export default function AnonymousSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [posts, setPosts] = useState<SpacePost[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, { id: string; content: string; createdAt: string }[]>>({});
  const [newComment, setNewComment] = useState('');
  const [loadingCommentsFor, setLoadingCommentsFor] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to use anonymous spaces.');
      setLoadingSpaces(false);
      return;
    }
    async function loadSpaces() {
      try {
        setLoadingSpaces(true);
        setError(null);
        const res = await fetch(`${API_BASE}/anonymous/spaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load spaces.');
        }
        const list: Space[] = data.spaces ?? [];
        setSpaces(list);
        const firstId = safeFirstId(list);
        if (firstId) setActiveSpaceId(firstId);
      } catch (e: any) {
        setError(e.message || 'Failed to load spaces.');
      } finally {
        setLoadingSpaces(false);
      }
    }
    loadSpaces();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !activeSpaceId) return;
    async function loadPosts() {
      try {
        setLoadingPosts(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/anonymous/spaces/${encodeURIComponent(activeSpaceId ?? '')}/posts?limit=20`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load posts.');
        }
      const list: SpacePost[] = (data.items ?? data.posts ?? []).map((p: any) => ({
        id: p.id,
        content: p.content,
        score: p.score ?? 0,
        createdAt: p.createdAt,
        commentCount: p._count?.comments ?? p.commentCount ?? 0,
      }));
        setPosts(list);
      } catch (e: any) {
        setError(e.message || 'Failed to load posts.');
      } finally {
        setLoadingPosts(false);
      }
    }
    loadPosts();
  }, [activeSpaceId]);

  async function createSpace(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    const name = newSpaceName.trim();
    if (!name) return;
    setCreatingSpace(true);
    try {
      const res = await fetch(`${API_BASE}/anonymous/spaces`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: newSpaceDescription.trim() || undefined,
          isPublic: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create space.');
      }
      setSpaces((prev) => [...prev, data]);
      setActiveSpaceId(data.id);
      setNewSpaceName('');
      setNewSpaceDescription('');
    } catch (e: any) {
      setError(e.message || 'Failed to create space.');
    } finally {
      setCreatingSpace(false);
    }
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !activeSpaceId) return;
    const content = newPostContent.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await fetch(
        `${API_BASE}/anonymous/spaces/${encodeURIComponent(activeSpaceId)}/posts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post.');
      }
      setPosts((prev) => [data, ...prev]);
      setNewPostContent('');
    } catch (e: any) {
      setError(e.message || 'Failed to post.');
    } finally {
      setPosting(false);
    }
  }

  async function vote(postId: string, direction: 1 | -1) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/anonymous/posts/${encodeURIComponent(postId)}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, score: p.score + direction } : p,
        ),
      );
    } catch {
      // ignore
    }
  }

  async function reportPost(postId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setReportingId(postId);
    try {
      await fetch(`${API_BASE}/anonymous/posts/${encodeURIComponent(postId)}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Inappropriate' }),
      });
    } catch {
      // ignore
    } finally {
      setReportingId(null);
    }
  }

  async function loadComments(postId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingCommentsFor(postId);
    try {
      const res = await fetch(
        `${API_BASE}/anonymous/posts/${encodeURIComponent(postId)}/comments`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load comments.');
      }
      const list = (data.comments ?? []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
      }));
      setComments((prev) => ({ ...prev, [postId]: list }));
      setActiveCommentsPostId(postId);
      setNewComment('');
    } catch (e: any) {
      setError(e.message || 'Failed to load comments.');
    } finally {
      setLoadingCommentsFor(null);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !activeCommentsPostId) return;
    const text = newComment.trim();
    if (!text) return;
    try {
      const res = await fetch(
        `${API_BASE}/anonymous/posts/${encodeURIComponent(activeCommentsPostId)}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: text }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add comment.');
      }
      setComments((prev) => ({
        ...prev,
        [activeCommentsPostId]: [data, ...(prev[activeCommentsPostId] ?? [])],
      }));
      setNewComment('');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activeCommentsPostId ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p,
        ),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to add comment.');
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader title="Anonymous spaces" />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Spaces you&apos;re part of (posts and votes are anonymous to others).
          </ThemedText>
          {loadingSpaces && (
            <ThemedText secondary className="text-moxe-caption">
              Loading spaces…
            </ThemedText>
          )}
          {!loadingSpaces && spaces.length === 0 && (
            <ThemedText secondary className="text-moxe-caption">
              You don&apos;t have any spaces yet. Create one to start.
            </ThemedText>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {spaces.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSpaceId(s.id)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  activeSpaceId === s.id
                    ? 'bg-moxe-primary border-moxe-primary text-white'
                    : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <form onSubmit={createSpace} className="mt-3 space-y-2">
            <ThemedInput
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="New space name"
            />
            <ThemedInput
              value={newSpaceDescription}
              onChange={(e) => setNewSpaceDescription(e.target.value)}
              placeholder="Short description (optional)"
            />
            <ThemedButton
              type="submit"
              label={creatingSpace ? 'Creating…' : 'Create space'}
              disabled={creatingSpace || !newSpaceName.trim()}
              className="w-full justify-center text-xs"
            />
          </form>
        </section>

        {activeSpaceId && (
          <section>
            <ThemedText secondary className="text-moxe-caption mb-2 block">
              Posts in this space
            </ThemedText>
            <form onSubmit={createPost} className="mb-3 space-y-2">
              <ThemedInput
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share something anonymously…"
              />
              <ThemedButton
                type="submit"
                label={posting ? 'Posting…' : 'Post anonymously'}
                disabled={posting || !newPostContent.trim()}
                className="w-full justify-center text-xs"
              />
            </form>
            {loadingPosts && (
              <ThemedText secondary className="text-moxe-caption">
                Loading posts…
              </ThemedText>
            )}
            {!loadingPosts && posts.length === 0 && (
              <ThemedText secondary className="text-moxe-caption">
                No posts yet. Be the first to share.
              </ThemedText>
            )}
            <div className="space-y-2">
              {posts.map((p) => {
                const postComments = comments[p.id] ?? [];
                const isOpen = activeCommentsPostId === p.id;
                return (
                  <div
                    key={p.id}
                    className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 text-moxe-body space-y-1"
                  >
                    <ThemedText className="text-moxe-body">
                      {p.content}
                    </ThemedText>
                    <div className="flex items-center justify-between text-[11px] text-moxe-textSecondary">
                      <span>Score: {p.score}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => vote(p.id, 1)}
                          className="text-moxe-primary"
                        >
                          ⬆︎ Upvote
                        </button>
                        <button
                          type="button"
                          onClick={() => vote(p.id, -1)}
                          className="text-moxe-textSecondary"
                        >
                          ⬇︎ Downvote
                        </button>
                        <button
                          type="button"
                          onClick={() => reportPost(p.id)}
                          className="text-moxe-danger"
                          disabled={reportingId === p.id}
                        >
                          {reportingId === p.id ? 'Reporting…' : 'Report'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadComments(p.id)}
                      className="mt-1 text-[11px] text-moxe-primary"
                    >
                      {loadingCommentsFor === p.id
                        ? 'Loading comments…'
                        : isOpen
                        ? 'Hide comments'
                        : `View comments (${p.commentCount ?? postComments.length})`}
                    </button>
                    {isOpen && (
                      <div className="mt-2 border-t border-moxe-border/60 pt-2 space-y-2">
                        <form onSubmit={submitComment} className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment…"
                            className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-background border border-moxe-border text-[12px]"
                          />
                          <ThemedButton
                            type="submit"
                            label="Send"
                            className="px-2 py-1 text-[11px]"
                            disabled={!newComment.trim()}
                          />
                        </form>
                        {postComments.length > 0 && (
                          <div className="space-y-1 max-h-32 overflow-auto">
                            {postComments.map((c) => (
                              <div
                                key={c.id}
                                className="px-2 py-1 rounded-moxe-md bg-moxe-background text-[12px]"
                              >
                                <ThemedText className="text-moxe-body">{c.content}</ThemedText>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </ThemedView>
  );
}

