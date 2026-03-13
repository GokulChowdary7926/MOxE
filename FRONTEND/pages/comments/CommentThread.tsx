import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  account: { id: string; username: string; displayName?: string | null };
};

export default function CommentThread() {
  const { commentId } = useParams();
  const [root, setRoot] = useState<Reply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'AUTHOR'>('ALL');
  const [sort, setSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!commentId) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view this thread.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/posts/comments/${encodeURIComponent(commentId)}/replies`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load comment thread.');
        }
        setRoot(data.comment ?? null);
        setReplies(data.replies ?? []);
      } catch (e: any) {
        setError(e.message || 'Failed to load comment thread.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [commentId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!commentId) return;
    const text = replyText.trim();
    if (!text) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to reply.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(root?.id || '')}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, parentId: commentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reply.');
      }
      setReplies((prev) => [data, ...prev]);
      setReplyText('');
    } catch (e: any) {
      setError(e.message || 'Failed to reply.');
    } finally {
      setSaving(false);
    }
  }

  const filteredReplies = useMemo(() => {
    let list = [...replies];
    if (filter === 'AUTHOR' && root) {
      list = list.filter((r) => r.account.id === root.account.id);
    }
    list.sort((a, b) =>
      sort === 'NEWEST'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return list;
  }, [replies, filter, sort, root]);

  async function approve(commentIdToApprove: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActingId(commentIdToApprove);
    try {
      const res = await fetch(`${API_BASE}/posts/comments/${encodeURIComponent(commentIdToApprove)}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setReplies((prev) => prev.filter((r) => r.id !== commentIdToApprove));
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  }

  async function remove(commentIdToRemove: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActingId(commentIdToRemove);
    try {
      const res = await fetch(`${API_BASE}/posts/comments/${encodeURIComponent(commentIdToRemove)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setReplies((prev) => prev.filter((r) => r.id !== commentIdToRemove));
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  }

  async function blockAuthor(accountId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActingId(accountId);
    try {
      await fetch(`${API_BASE}/privacy/block`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Comment thread"
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-3">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading thread…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">{error}</ThemedText>
        )}
        {!loading && !error && root && (
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
            <ThemedText className="text-moxe-body font-semibold mb-1">
              @{root.account.username}
              {root.account.displayName ? ` · ${root.account.displayName}` : ''}
            </ThemedText>
            <ThemedText className="text-moxe-body">{root.content}</ThemedText>
          </div>
        )}
        {!loading && !error && root && (
          <form onSubmit={sendReply} className="flex gap-2 mt-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to this comment…"
              className="flex-1 px-3 py-2 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body text-moxe-text placeholder:text-moxe-textSecondary"
            />
            <ThemedButton
              type="submit"
              label={saving ? 'Replying…' : 'Reply'}
              disabled={saving || !replyText.trim()}
              className="px-3 py-2 text-xs"
            />
          </form>
        )}
        {!loading && !error && replies.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-1 text-[11px] text-moxe-caption">
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'ALL' | 'AUTHOR')}
                  className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-2 py-1"
                >
                  <option value="ALL">All replies</option>
                  <option value="AUTHOR">From post author</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'NEWEST' | 'OLDEST')}
                  className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-2 py-1"
                >
                  <option value="NEWEST">Newest</option>
                  <option value="OLDEST">Oldest</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="text-moxe-primary"
              >
                Jump to post
              </button>
            </div>
            {filteredReplies.map((r) => (
              <div
                key={r.id}
                className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 ml-6 space-y-1"
              >
                <ThemedText className="text-moxe-body font-semibold mb-0.5 text-[13px]">
                  @{r.account.username}
                  {r.account.displayName ? ` · ${r.account.displayName}` : ''}
                </ThemedText>
                <ThemedText className="text-moxe-body text-[13px]">{r.content}</ThemedText>
                <div className="flex gap-2 mt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    className="px-2 py-0.5 rounded-moxe-md bg-moxe-background text-moxe-textSecondary border border-moxe-border"
                    disabled={actingId === r.id}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="px-2 py-0.5 rounded-moxe-md bg-moxe-background text-moxe-textSecondary border border-moxe-border"
                    disabled={actingId === r.id}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => blockAuthor(r.account.id)}
                    className="px-2 py-0.5 rounded-moxe-md bg-moxe-background text-moxe-danger border border-moxe-border"
                    disabled={actingId === r.account.id}
                  >
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}

