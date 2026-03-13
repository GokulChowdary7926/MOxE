import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type HiddenComment = {
  id: string;
  content: string;
  account: { id: string; username: string; displayName?: string | null };
  postId: string;
};

export default function HiddenComments() {
  const [items, setItems] = useState<HiddenComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to manage comments.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/posts/comments/hidden?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load hidden comments.');
        }
        const list = data.items ?? data.comments ?? [];
        const mapped: HiddenComment[] = list.map((c: any) => ({
          id: c.id,
          content: c.content,
          postId: c.postId,
          account: {
            id: c.account?.id,
            username: c.account?.username ?? 'user',
            displayName: c.account?.displayName ?? null,
          },
        }));
        setItems(mapped);
      } catch (e: any) {
        setError(e.message || 'Failed to load hidden comments.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function approve(commentId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/posts/comments/${commentId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  }

  async function remove(commentId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Hidden comments"
        left={
          <Link to="/settings/safety-center" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading hidden comments…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
        {!loading && !error && items.length === 0 && (
          <ThemedText secondary className="text-moxe-caption">
            There are no hidden comments to review right now.
          </ThemedText>
        )}
        {!loading &&
          !error &&
          items.map((c) => (
            <div
              key={c.id}
              className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 flex flex-col gap-1"
            >
              <ThemedText className="text-moxe-body">
                <span className="font-semibold">@{c.account.username}</span>
                {c.account.displayName ? ` · ${c.account.displayName}` : ''}: {c.content}
              </ThemedText>
              <div className="flex gap-2 mt-1">
                <ThemedButton
                  label="Approve"
                  variant="secondary"
                  onClick={() => approve(c.id)}
                  className="px-3 py-1 text-[11px]"
                />
                <ThemedButton
                  label="Delete"
                  variant="secondary"
                  onClick={() => remove(c.id)}
                  className="px-3 py-1 text-[11px]"
                />
              </div>
            </div>
          ))}
      </div>
    </ThemedView>
  );
}

