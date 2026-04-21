import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText } from '../../components/ui/Themed';
import { ensureAbsoluteMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';
import { mediaEntryToUrl } from '../../utils/mediaEntries';

import { getApiBase } from '../../services/api';
const API_BASE = getApiBase();

type ArchivedStory = {
  id: string;
  media: unknown;
  archivedAt: string;
};

function extractArchivedMedia(raw: unknown): { url: string; type?: string } | null {
  if (!raw) return null;
  const entry = Array.isArray(raw) ? raw[0] : raw;
  const url = mediaEntryToUrl(entry);
  if (url) {
    const type =
      entry && typeof entry === 'object' && !Array.isArray(entry)
        ? (entry as { type?: string }).type
        : undefined;
    return { url, type };
  }
  return null;
}

export default function StoryArchive() {
  const [items, setItems] = useState<ArchivedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/archive`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setItems(data?.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Story archive"
        left={
          <Link to="/settings/privacy" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        <ThemedText secondary className="text-moxe-caption">
          Stories you&apos;ve posted that have expired but were archived will appear here. Only you
          can see your archive.
        </ThemedText>

        {loading ? (
          <ThemedText>Loading…</ThemedText>
        ) : items.length === 0 ? (
          <ThemedText secondary className="text-moxe-caption mt-4">
            No archived stories yet.
          </ThemedText>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              const first = extractArchivedMedia(item.media);
              const isVideo = Boolean(first && (first.type === 'VIDEO' || isVideoMediaUrl(first.url)));
              const abs = first ? ensureAbsoluteMediaUrl(first.url) : '';
              return (
                <div key={item.id} className="relative aspect-[9/16] rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border">
                  {first && isVideo ? (
                    <video src={abs} muted playsInline className="w-full h-full object-cover" />
                  ) : first ? (
                    <img src={abs} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moxe-caption">Story</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ThemedView>
  );
}

