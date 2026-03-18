import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';

const API_BASE = getApiBase();

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { account: currentAccount } = useCurrentAccount();
  const myId = currentAccount?.id ?? null;

  const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const canEdit = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
  const editMinutesLeft = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const left = Math.ceil((EDIT_WINDOW_MS - elapsed) / 60000);
    return left > 0 ? left : 0;
  };

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
        const res = await fetch(`${API_BASE}/posts/comments/${encodeURIComponent(commentId ?? '')}/replies`, {
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

  async function saveEdit(commentId: string) {
    const token = getToken();
    if (!token || !editContent.trim()) return;
    setActingId(commentId);
    try {
      const res = await fetch(`${getApiBase()}/posts/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Edit failed.');
      if (commentId === root?.id) {
        setRoot((r) => (r ? { ...r, content: editContent.trim() } : null));
      } else {
        setReplies((prev) => prev.map((r) => (r.id === commentId ? { ...r, content: editContent.trim() } : r)));
      }
      setEditingId(null);
      setEditContent('');
    } catch (e: any) {
      setError(e.message || 'Failed to edit comment.');
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
    <SettingsPageShell title="Comments" backTo="/">
      <div className="px-4 py-4 space-y-3">
        {loading && (
          <p className="text-[#a8a8a8] text-sm">Loading thread…</p>
        )}
        {error && !loading && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        {!loading && !error && root && (
          <div className="rounded-xl bg-[#262626] border border-[#363636] px-3 py-2">
            <p className="text-white font-semibold mb-1">
              @{root.account.username}
              {(root.account as { isSubscriber?: boolean }).isSubscriber && (
                <span className="ml-1 inline-flex items-center px-1 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40" title="Subscriber">★</span>
              )}
              {root.account.displayName ? ` · ${root.account.displayName}` : ''}
            </p>
            {editingId === root.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#363636] border border-[#404040] text-white text-sm min-h-[60px]"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveEdit(root.id)} disabled={actingId === root.id} className="px-2 py-1 rounded-lg bg-[#0095f6] text-white text-xs font-medium disabled:opacity-50">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditContent(''); }} className="px-2 py-1 rounded-lg bg-[#363636] text-[#a8a8a8] text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[#a8a8a8] text-sm">{root.content}</p>
                {myId === root.account.id && canEdit(root.createdAt) && (
                  <button type="button" onClick={() => { setEditingId(root.id); setEditContent(root.content); }} className="mt-1 text-[11px] text-[#0095f6]">
                    Edit {editMinutesLeft(root.createdAt) > 0 ? `(${editMinutesLeft(root.createdAt)} min left)` : '(within 15 min)'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {!loading && !error && root && (
          <form onSubmit={sendReply} className="flex gap-2 mt-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to this comment…"
              className="flex-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
            <button
              type="submit"
              disabled={saving || !replyText.trim()}
              className="px-3 py-2 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Replying…' : 'Reply'}
            </button>
          </form>
        )}
        {!loading && !error && replies.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-1 text-[11px] text-[#a8a8a8]">
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'ALL' | 'AUTHOR')}
                  className="bg-[#262626] border border-[#363636] rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="ALL">All replies</option>
                  <option value="AUTHOR">From post author</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'NEWEST' | 'OLDEST')}
                  className="bg-[#262626] border border-[#363636] rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="NEWEST">Newest</option>
                  <option value="OLDEST">Oldest</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="text-[#0095f6] text-xs font-medium"
              >
                Jump to post
              </button>
            </div>
            {filteredReplies.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-[#262626] border border-[#363636] px-3 py-2 ml-4 space-y-1"
              >
                <p className="text-white font-semibold mb-0.5 text-[13px]">
                  @{r.account.username}
                  {(r.account as { isSubscriber?: boolean }).isSubscriber && (
                    <span className="ml-1 inline-flex items-center px-1 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40" title="Subscriber">★</span>
                  )}
                  {r.account.displayName ? ` · ${r.account.displayName}` : ''}
                </p>
                {editingId === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#363636] border border-[#404040] text-white text-[13px] min-h-[50px]"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveEdit(r.id)} disabled={actingId === r.id} className="px-2 py-0.5 rounded-lg bg-[#0095f6] text-white text-[11px] font-medium disabled:opacity-50">Save</button>
                      <button type="button" onClick={() => { setEditingId(null); setEditContent(''); }} className="px-2 py-0.5 rounded-lg bg-[#363636] text-[#a8a8a8] text-[11px]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[#a8a8a8] text-[13px]">{r.content}</p>
                    <div className="flex gap-2 mt-1 text-[11px] flex-wrap items-center">
                      {myId === r.account.id && canEdit(r.createdAt) && (
                        <button type="button" onClick={() => { setEditingId(r.id); setEditContent(r.content); }} className="px-2 py-0.5 rounded-lg bg-[#363636] text-[#0095f6] border border-[#363636] disabled:opacity-50">
                          Edit {editMinutesLeft(r.createdAt) > 0 ? `(${editMinutesLeft(r.createdAt)}m)` : ''}
                        </button>
                      )}
                      <button type="button" onClick={() => approve(r.id)} className="px-2 py-0.5 rounded-lg bg-[#363636] text-[#a8a8a8] border border-[#363636] disabled:opacity-50" disabled={actingId === r.id}>Approve</button>
                      <button type="button" onClick={() => remove(r.id)} className="px-2 py-0.5 rounded-lg bg-[#363636] text-[#a8a8a8] border border-[#363636] disabled:opacity-50" disabled={actingId === r.id}>Delete</button>
                      <button type="button" onClick={() => blockAuthor(r.account.id)} className="px-2 py-0.5 rounded-lg bg-[#363636] text-red-400 border border-[#363636] disabled:opacity-50" disabled={actingId === r.account.id}>Block</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}

