import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type ArchivedStory = {
  id: string;
  media: { url: string; type?: string }[] | null;
  archivedAt: string;
};

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
              const first = Array.isArray(item.media) && item.media.length > 0 ? item.media[0] : null;
              const isVideo = first && first.type === 'VIDEO';
              return (
                <div key={item.id} className="relative aspect-[9/16] rounded-moxe-md overflow-hidden bg-moxe-surface border border-moxe-border">
                  {first && !isVideo ? (
                    <img src={first.url} alt="" className="w-full h-full object-cover" />
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

