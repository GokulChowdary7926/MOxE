import React, { useEffect, useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type Track = {
  id: string;
  title: string;
  artist: string | null;
  usageCount: number;
};

export default function TrendingAudioPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        setTracks([]);
        setError('Sign in to browse trending audio.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/creator/trending-audio?limit=24`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setTracks([]);
          setError(await readApiError(res).catch(() => 'Could not load audio'));
          return;
        }
        const data = (await res.json()) as { items?: Track[] };
        if (!cancelled) setTracks(Array.isArray(data.items) ? data.items : []);
      } catch (e: unknown) {
        if (!cancelled) {
          setTracks([]);
          setError(e instanceof Error ? e.message : 'Could not load audio');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsPageShell title="Trending audio" backTo="/notes/new/song">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Popular audio for your reels and notes.</p>
        {loading && <p className="text-[#737373] text-sm">Loading…</p>}
        {error && !loading && <p className="text-[#a8a8a8] text-sm mb-4">{error}</p>}
        {!loading && !error && tracks.length === 0 && (
          <p className="text-[#737373] text-sm">No trending clips yet.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {!loading &&
            !error &&
            tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                className="aspect-square rounded-xl bg-[#262626] overflow-hidden text-left active:bg-white/5 border border-[#363636]"
              >
                <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 min-h-[120px]" />
                <div className="p-2 -mt-12 relative">
                  <p className="text-white font-medium text-sm truncate">{t.title}</p>
                  <p className="text-[#a8a8a8] text-xs truncate">
                    {t.artist || 'Unknown'} · {t.usageCount.toLocaleString()} uses
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
