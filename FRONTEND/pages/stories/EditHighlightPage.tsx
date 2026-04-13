import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import toast from 'react-hot-toast';

type HighlightItem = {
  id: string;
  story: { id: string; media: unknown } | null;
  archivedStory: { id: string; media: unknown } | null;
};

type HighlightPayload = {
  id: string;
  name: string;
  coverImage?: string | null;
  items: HighlightItem[];
};

function mediaThumb(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) return null;
  const m = media[0] as { url?: string; uri?: string; thumbnailUrl?: string };
  return m.thumbnailUrl || m.url || m.uri || null;
}

function durationLabel(media: unknown): string {
  if (!Array.isArray(media) || media.length === 0) return '—';
  const dur = (media[0] as { duration?: number }).duration;
  if (typeof dur !== 'number' || !Number.isFinite(dur)) return '—';
  const sec = Math.round(dur);
  const mm = Math.floor(sec / 60);
  const s = sec % 60;
  return `${mm}:${s.toString().padStart(2, '0')}`;
}

export default function EditHighlightPage() {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [tab, setTab] = useState<'selected' | 'stories'>('selected');
  const [highlight, setHighlight] = useState<HighlightPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token || !highlightId) {
      setHighlight(null);
      setLoading(false);
      if (!highlightId) toast.error('Missing highlight');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/highlights/${encodeURIComponent(highlightId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setHighlight(null);
        toast.error(await readApiError(res).catch(() => 'Could not load highlight'));
        return;
      }
      const h = (await res.json()) as HighlightPayload;
      setHighlight(h);
      setName(h.name || '');
    } catch {
      setHighlight(null);
      toast.error('Could not load highlight');
    } finally {
      setLoading(false);
    }
  }, [highlightId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const token = getToken();
    if (!token || !highlightId) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/highlights/${encodeURIComponent(highlightId)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'Highlight' }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res).catch(() => 'Could not save'));
        return;
      }
      toast.success('Saved');
      navigate(-1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const items = highlight?.items ?? [];
  const coverSrc =
    highlight?.coverImage ||
    (items[0] && mediaThumb(items[0].archivedStory?.media ?? items[0].story?.media)) ||
    null;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" className="text-[#0095f6] font-medium text-sm" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Edit highlight</span>
          <button
            type="button"
            className="text-[#0095f6] font-medium text-sm disabled:opacity-40"
            disabled={saving || loading || !highlightId}
            onClick={() => void save()}
          >
            {saving ? '…' : 'Done'}
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-6">
          {loading && <p className="text-[#737373] text-sm">Loading…</p>}
          {!loading && !highlight && <p className="text-[#a8a8a8] text-sm">Highlight not found.</p>}
          {!loading && highlight && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-[#262626] overflow-hidden mb-2 bg-gradient-to-br from-green-600 to-blue-500">
                  {coverSrc ? (
                    <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <button type="button" className="text-[#0095f6] text-sm font-medium">
                  Edit Cover
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-[#a8a8a8] text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setTab('selected')}
                  className={`flex-1 py-2 text-sm font-semibold ${tab === 'selected' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}
                >
                  Selected
                </button>
                <button
                  type="button"
                  onClick={() => setTab('stories')}
                  className={`flex-1 py-2 text-sm font-semibold ${tab === 'stories' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373]'}`}
                >
                  Stories
                </button>
              </div>

              {tab === 'stories' && (
                <p className="text-[#737373] text-sm mb-4">
                  To add stories, archive them from your story tray, then add from the highlight builder on your profile.
                </p>
              )}

              {tab === 'selected' && (
                <div className="grid grid-cols-3 gap-2">
                  {items.length === 0 ? (
                    <p className="col-span-3 text-[#737373] text-sm">No stories in this highlight yet.</p>
                  ) : (
                    items.map((it) => {
                      const media = it.archivedStory?.media ?? it.story?.media;
                      const thumb = mediaThumb(media);
                      const dur = durationLabel(media);
                      return (
                        <div key={it.id} className="aspect-square rounded-lg bg-[#262626] overflow-hidden relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : null}
                          <span className="absolute bottom-1 left-1 text-white text-[10px] font-medium">{dur}</span>
                          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center text-white text-xs">
                            ✓
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
