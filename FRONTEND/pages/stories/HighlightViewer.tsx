import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { mediaEntryToUrl } from '../../utils/mediaEntries';

import { getApiBase } from '../../services/api';
const API_BASE = getApiBase();

type HighlightStory = {
  id: string;
  mediaUrl: string;
  text?: string | null;
};

function extractHighlightMediaUrl(story: any): string {
  const media = story?.media;
  const fromMediaArrayOrObject = mediaEntryToUrl(Array.isArray(media) ? media[0] : media);
  if (fromMediaArrayOrObject) return fromMediaArrayOrObject;
  for (const key of ['mediaUrl', 'url', 'imageUrl', 'thumbnail'] as const) {
    const candidate = story?.[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

export default function HighlightViewer() {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<HighlightStory[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/highlights/view/${encodeURIComponent(highlightId ?? '')}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load highlight.');
        }
        if (cancelled) return;
        const stories: HighlightStory[] = (data.items ?? data.stories ?? []).map((s: any) => ({
          id: s.id,
          mediaUrl: extractHighlightMediaUrl(s),
          text: s.text ?? s.caption ?? null,
        }));
        setItems(stories);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load highlight.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [highlightId]);

  const current = items[index];

  function next() {
    if (index + 1 < items.length) setIndex(index + 1);
    else navigate(-1);
  }

  function prev() {
    if (index > 0) setIndex(index - 1);
    else navigate(-1);
  }

  return (
    <ThemedView className="fixed inset-0 z-40 flex items-center justify-center bg-black/90">
      <div className="w-full max-w-[428px] h-full flex flex-col">
        <div className="flex items-center justify-between px-moxe-md py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-moxe-textSecondary text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          <ThemedText className="text-moxe-caption">
            Highlight
          </ThemedText>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex items-center justify-center px-moxe-md">
          {loading && (
            <ThemedText secondary className="text-moxe-caption">
              Loading highlight…
            </ThemedText>
          )}
          {error && !loading && (
            <ThemedText className="text-moxe-caption text-moxe-danger">
              {error}
            </ThemedText>
          )}
          {!loading && !error && !current && (
            <ThemedText secondary className="text-moxe-caption">
              No stories to show.
            </ThemedText>
          )}
          {current && (
            <div className="relative w-full aspect-[9/16] max-h-[80vh] bg-moxe-surface rounded-moxe-lg overflow-hidden">
              <img src={ensureAbsoluteMediaUrl(current.mediaUrl)} alt={current.text || 'Story'} className="w-full h-full object-cover" />
              {current.text && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 rounded-moxe-md px-3 py-2">
                  <ThemedText className="text-moxe-body">{current.text}</ThemedText>
                </div>
              )}
              <div className="absolute inset-y-0 left-0 w-1/3" onClick={prev} />
              <div className="absolute inset-y-0 right-0 w-1/3" onClick={next} />
            </div>
          )}
        </div>
      </div>
    </ThemedView>
  );
}

