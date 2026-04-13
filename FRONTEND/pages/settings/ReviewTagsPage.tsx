import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { fetchApi } from '../../services/api';
import { ensureAbsoluteMediaUrl, getFirstMediaUrl } from '../../utils/mediaUtils';
import { readApiError } from '../../utils/readApiError';

type PendingItem = {
  tagId: string;
  postId: string;
  createdAt: string;
  post: {
    id: string;
    caption: string | null;
    media: unknown;
    author: { id: string; username: string; displayName: string; profilePhoto: string | null };
  } | null;
};

export default function ReviewTagsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi('posts/tag-requests/pending?limit=50');
      const data = (await res.json().catch(() => ({}))) as { items?: PendingItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not load tag requests.');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(tagId: string) {
    setBusyId(tagId);
    setError(null);
    try {
      const res = await fetchApi(`posts/tags/${encodeURIComponent(tagId)}/approve`, { method: 'POST', body: '{}' });
      if (!res.ok) throw new Error(await readApiError(res));
      setItems((prev) => prev.filter((i) => i.tagId !== tagId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not approve.');
    } finally {
      setBusyId(null);
    }
  }

  async function decline(tagId: string) {
    setBusyId(tagId);
    setError(null);
    try {
      const res = await fetchApi(`posts/tags/${encodeURIComponent(tagId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readApiError(res));
      setItems((prev) => prev.filter((i) => i.tagId !== tagId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not remove tag.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SettingsPageShell title="Review tags" backTo="/settings/tags-mentions">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">
          Approve tags to show these posts on your profile&apos;s Tagged grid. Declining removes you from the post&apos;s tags.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {loading ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 text-center">
            <p className="text-white text-sm font-medium">No tags to review</p>
            <p className="text-[#737373] text-xs mt-1">When someone tags you and manual approval is on, requests appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((row) => {
              const p = row.post;
              const thumb = p ? ensureAbsoluteMediaUrl(getFirstMediaUrl({ ...p, media: p.media as unknown[] | null })) : '';
              const author = p?.author;
              return (
                <li key={row.tagId} className="rounded-xl border border-[#363636] bg-[#121212] overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex gap-3 p-3 text-left active:bg-white/5"
                    onClick={() => p && navigate(`/post/${encodeURIComponent(p.id)}`)}
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#262626] overflow-hidden flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      {author && (
                        <p className="text-white text-sm font-semibold truncate">
                          <Link
                            to={`/profile/${encodeURIComponent(author.username)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0095f6]"
                          >
                            @{author.username}
                          </Link>
                        </p>
                      )}
                      <p className="text-[#a8a8a8] text-xs line-clamp-2 mt-0.5">{p?.caption || 'Photo'}</p>
                    </div>
                  </button>
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      type="button"
                      disabled={busyId === row.tagId}
                      onClick={() => void approve(row.tagId)}
                      className="flex-1 py-2 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.tagId}
                      onClick={() => void decline(row.tagId)}
                      className="flex-1 py-2 rounded-lg border border-[#363636] text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
