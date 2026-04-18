import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText } from '../../components/ui/Themed';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

import { getApiBase } from '../../services/api';
const API_BASE = getApiBase();

type ArchivedStory = {
  id: string;
  media: unknown;
  archivedAt: string;
};

function extractArchivedMedia(raw: unknown): { url: string; type?: string } | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    return raw.trim() ? { url: raw.trim() } : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] as unknown;
    if (typeof first === 'string') {
      return first.trim() ? { url: first.trim() } : null;
    }
    if (first && typeof first === 'object') {
      const o = first as { url?: string; uri?: string; mediaUrl?: string; type?: string };
      const url = o.url ?? o.uri ?? o.mediaUrl;
      if (typeof url === 'string' && url.trim()) return { url: url.trim(), type: o.type };
    }
  }
  if (typeof raw === 'object') {
    const o = raw as { url?: string; uri?: string; mediaUrl?: string; type?: string };
    const url = o.url ?? o.uri ?? o.mediaUrl;
    if (typeof url === 'string' && url.trim()) return { url: url.trim(), type: o.type };
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
              const isVideo = first && first.type === 'VIDEO';
              return (
                <div key={item.id} className="relative aspect-[9/16] rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border">
                  {first && !isVideo ? (
                    <img src={ensureAbsoluteMediaUrl(first.url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moxe-caption">
                      {isVideo ? 'Video' : 'Story'}
                    </div>
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

