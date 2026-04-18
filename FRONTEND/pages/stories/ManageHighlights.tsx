import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

import { getApiBase } from '../../services/api';
const API_BASE = getApiBase();

type ArchivedStory = {
  id: string;
  media: string;
  storyId: string | null;
};

type Highlight = {
  id: string;
  name: string;
  coverImage?: string | null;
};

export default function ManageHighlights() {
  const navigate = useNavigate();
  const [archive, setArchive] = useState<ArchivedStory[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<string[]>([]);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [creating, setCreating] = useState(false);
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [savingRename, setSavingRename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to manage highlights.');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/archive`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const items: ArchivedStory[] = (data.items ?? []).map((i: any) => ({
          id: i.id,
          media: i.media,
          storyId: i.storyId ?? null,
        }));
        setArchive(items);
      })
      .catch(() => {
        setError('Failed to load story archive.');
      });

    fetch(`${API_BASE}/highlights`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const list: Highlight[] = (data.highlights ?? []).map((h: any) => ({
          id: h.id,
          name: h.name,
          coverImage: h.coverImage ?? null,
        }));
        setHighlights(list);
      })
      .catch(() => {
        setError('Failed to load highlights.');
      });
  }, []);

  function toggleArchived(id: string) {
    setSelectedArchivedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function createHighlight(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newHighlightName.trim() || 'Highlight';
    if (selectedArchivedIds.length === 0) {
      setError('Select at least one story from your archive.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setCreating(true);
    try {
      const first = archive.find((a) => a.id === selectedArchivedIds[0]);
      const res = await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          coverImage: first?.media ?? undefined,
          archivedStoryIds: selectedArchivedIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create highlight.');
      }
      setHighlights((prev) => [...prev, { id: data.id, name: data.name, coverImage: data.coverImage }]);
      setNewHighlightName('');
      setSelectedArchivedIds([]);
    } catch (e: any) {
      setError(e.message || 'Failed to create highlight.');
    } finally {
      setCreating(false);
    }
  }

  async function renameHighlight(h: Highlight) {
    const token = localStorage.getItem('token');
    if (!token) return;
    const nextName = (renameMap[h.id] ?? h.name).trim();
    if (!nextName || nextName === h.name) return;
    setSavingRename(h.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/highlights/${h.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nextName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename highlight.');
      }
      setHighlights((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, name: data.name ?? nextName } : x)),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to rename highlight.');
    } finally {
      setSavingRename(null);
    }
  }

  async function deleteHighlight(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/highlights/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Manage highlights"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-moxe-text text-2xl leading-none"
            aria-label="Back"
          >
            ←
          </button>
        }
      />

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-6">
        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Create a new highlight from your story archive.
          </ThemedText>
          <form onSubmit={createHighlight} className="space-y-2 mb-3">
            <ThemedInput
              value={newHighlightName}
              onChange={(e) => setNewHighlightName(e.target.value)}
              placeholder="Highlight name"
            />
            <ThemedButton
              type="submit"
              label={creating ? 'Creating…' : 'Create highlight'}
              disabled={creating || selectedArchivedIds.length === 0}
              className="w-full justify-center"
            />
          </form>
          <div className="grid grid-cols-3 gap-2">
            {archive.map((a) => {
              const selected = selectedArchivedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleArchived(a.id)}
                  className={`relative aspect-square rounded-moxe-md overflow-hidden border ${
                    selected ? 'border-moxe-primary' : 'border-moxe-border'
                  }`}
                >
                  <img
                    src={ensureAbsoluteMediaUrl(a.media)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-moxe-primary text-xl">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
            {archive.length === 0 && (
              <ThemedText secondary className="text-moxe-caption col-span-3">
                When your stories expire, they will appear here if story archive is enabled.
              </ThemedText>
            )}
          </div>
        </section>

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Existing highlights
          </ThemedText>
          {highlights.length === 0 && (
            <ThemedText secondary className="text-moxe-caption">
              You don&apos;t have any highlights yet.
            </ThemedText>
          )}
          <div className="space-y-3">
            {highlights.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-moxe-md border border-moxe-border bg-moxe-surface px-3 py-2"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-moxe-border flex-shrink-0">
                  {h.coverImage ? (
                    <img src={ensureAbsoluteMediaUrl(h.coverImage)} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moxe-caption">
                      ★
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ThemedInput
                    value={renameMap[h.id] ?? h.name}
                    onChange={(e) =>
                      setRenameMap((prev) => ({ ...prev, [h.id]: e.target.value }))
                    }
                  />
                  <div className="flex gap-2 mt-1">
                    <ThemedButton
                      label={savingRename === h.id ? 'Saving…' : 'Rename'}
                      variant="secondary"
                      onClick={() => renameHighlight(h)}
                      disabled={savingRename === h.id}
                      className="px-2 py-1 text-[11px]"
                    />
                    <ThemedButton
                      label="Delete"
                      variant="secondary"
                      onClick={() => deleteHighlight(h.id)}
                      className="px-2 py-1 text-[11px]"
                    />
                    <Link
                      to={`/highlights/${encodeURIComponent(h.id)}/edit`}
                      className="text-moxe-primary text-[11px]"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/highlights/${encodeURIComponent(h.id)}`}
                      className="text-moxe-primary text-[11px]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
      </div>
    </ThemedView>
  );
}

