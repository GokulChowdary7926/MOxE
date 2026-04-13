import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type FollowRequest = {
  id: string;
  requesterId: string;
  username: string;
  displayName: string;
  profilePhoto?: string | null;
  createdAt: string;
};

export default function FollowRequests() {
  const [items, setItems] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view follow requests.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/follow/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load follow requests.');
        }
        setItems(data ?? []);
      } catch (e: any) {
        setError(e.message || 'Failed to load follow requests.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function approve(requestId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/follow/requests/${encodeURIComponent(requestId)}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // ignore
    }
  }

  async function decline(requestId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/follow/requests/${encodeURIComponent(requestId)}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // ignore
    }
  }

  async function blockFromRequest(req: FollowRequest) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/privacy/block`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: req.requesterId, blockFutureAccounts: true }),
      });
      setItems((prev) => prev.filter((r) => r.id !== req.id));
    } catch {
      // ignore
    }
  }

  async function loadPreview(req: FollowRequest) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setPreviewId(req.id);
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/accounts/username/${encodeURIComponent(req.username)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile.');
      }
      setPreview(data.account ?? data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Follow requests"
        left={
          <Link to="/settings/privacy" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-3">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading follow requests…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
        {!loading && !error && items.length === 0 && (
          <ThemedText secondary className="text-moxe-caption">
            You don&apos;t have any follow requests right now.
          </ThemedText>
        )}
        {!loading &&
          !error &&
          items.map((r) => (
            <div
              key={r.id}
              className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <ThemedText className="text-moxe-body">
                    @{r.username}
                    {r.displayName ? ` · ${r.displayName}` : ''}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    Requested {new Date(r.createdAt).toLocaleDateString()}
                  </ThemedText>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => loadPreview(r)}
                    className="text-[11px] text-moxe-primary"
                  >
                    {previewId === r.id && previewLoading ? 'Loading…' : 'View profile'}
                  </button>
                  <div className="flex gap-1">
                    <ThemedButton
                      label="Confirm"
                      onClick={() => approve(r.id)}
                      className="px-3 py-1 text-[11px]"
                    />
                    <ThemedButton
                      label="Delete"
                      variant="secondary"
                      onClick={() => decline(r.id)}
                      className="px-3 py-1 text-[11px]"
                    />
                    <ThemedButton
                      label="Block"
                      variant="secondary"
                      onClick={() => blockFromRequest(r)}
                      className="px-3 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>
              {preview && previewId === r.id && (
                <div className="mt-1 px-2 py-2 rounded-moxe-md bg-moxe-background/60 border border-moxe-border/80 text-moxe-caption">
                  <ThemedText className="text-moxe-body font-semibold mb-0.5">
                    {preview.displayName || preview.username}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption mb-0.5">
                    @{preview.username}
                    {preview.accountType ? ` · ${preview.accountType}` : ''}
                  </ThemedText>
                  {preview.bio && (
                    <ThemedText secondary className="text-moxe-caption mb-0.5">
                      {preview.bio}
                    </ThemedText>
                  )}
                  {preview.location && (
                    <ThemedText secondary className="text-moxe-caption">
                      {preview.location}
                    </ThemedText>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </ThemedView>
  );
}

