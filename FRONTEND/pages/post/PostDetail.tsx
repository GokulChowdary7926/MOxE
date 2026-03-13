import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText, ThemedInput, ThemedButton } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorState } from '../../components/ui/ErrorState';
import { getApiBase, getToken } from '../../services/api';
import { getMockCommentsForPost } from '../../mocks/comments';
import { mockPosts } from '../../mocks/posts';
import { mockUsers } from '../../mocks/users';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const token = getToken();
    const API_BASE = getApiBase();
    if (token) {
      fetch(`${API_BASE}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data) {
            setPost(data);
            return;
          }
          throw new Error('Post not found');
        })
        .catch((e: any) => {
          if (!cancelled) setError(e.message || 'Failed to load post.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      const mockPost = mockPosts.find((p) => p.id === id);
      if (mockPost) {
        const author = mockUsers.find((u) => u.id === mockPost.authorId) ?? mockUsers[0];
        setPost({
          id: mockPost.id,
          author: { username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl },
          media: mockPost.media,
          mediaUrl: mockPost.media[0]?.url,
          caption: mockPost.caption,
          location: mockPost.location,
          likeCount: mockPost.likeCount,
          commentCount: mockPost.commentCount,
          viewerHasLiked: false,
          viewerHasSaved: false,
        });
        setComments(
          getMockCommentsForPost(id).map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            account: { username: c.username, profilePhoto: c.profilePhoto },
          })),
        );
      } else {
        setError('Post not found');
      }
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !post || comments.length > 0) return;
    const token = getToken();
    if (token) {
      fetch(`${getApiBase()}/posts/${id}/comments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const items = data?.items ?? data?.comments ?? [];
          if (items.length > 0) setComments(Array.isArray(items) ? items : []);
          else setComments(getMockCommentsForPost(id).map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            account: { username: c.username, profilePhoto: c.profilePhoto },
          })));
        })
        .catch(() => {
          setComments(
            getMockCommentsForPost(id).map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.createdAt,
              account: { username: c.username, profilePhoto: c.profilePhoto },
            })),
          );
        });
    }
  }, [id, post, comments.length]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
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
            account: (post?.author ?? mockUsers[0]),
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

  if (loading) {
    return (
      <PageLayout title="Post" backTo="/">
        <div className="py-8 text-center">
          <ThemedText secondary className="text-moxe-caption">Loading…</ThemedText>
        </div>
      </PageLayout>
    );
  }

  if (error && !post) {
    return (
      <PageLayout title="Post" backTo="/">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </PageLayout>
    );
  }

  if (!post) return null;

  const author = post.author ?? {};
  const mediaUris = Array.isArray(post.media)
    ? post.media.map((m: any) => m.url || m.mediaUrl).filter(Boolean)
    : [post.mediaUrl ?? post.media_uri].filter(Boolean);

  return (
    <PageLayout title="Post" backTo="/">
      <div className="pb-20">
        <FeedPost
          id={post.id}
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
          isLiked={!!post.viewerHasLiked}
          isSaved={!!post.viewerHasSaved}
        />
        <div className="px-4 border-t border-moxe-border py-3">
          <p className="text-moxe-caption text-moxe-textSecondary mb-2">Comments</p>
          <div className="space-y-3 max-h-60 overflow-auto mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar uri={c.account?.profilePhoto} size={28} />
                <div>
                  <ThemedText className="text-moxe-body">
                    <span className="font-semibold">{c.account?.username ?? 'user'}</span>{' '}
                    {c.content}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </ThemedText>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <ThemedInput
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1"
            />
            <ThemedButton
              type="submit"
              label={posting ? '…' : 'Post'}
              disabled={posting || !newComment.trim()}
              className="flex-shrink-0"
            />
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
