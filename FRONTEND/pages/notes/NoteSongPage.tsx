import React, { useState, useCallback } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { searchSpotifyTracks, type SpotifyTrack } from '../../services/spotifyApi';

export default function NoteSongPage() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchSpotifyTracks(query, 15);
      setTracks(results);
    } catch (e) {
      setError((e as Error).message);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <SettingsPageShell title="Song selection and edit" backTo="/notes/new">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Add music to your note. Search via Spotify.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search for a song"
            className="flex-1 px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
          <button type="button" onClick={search} disabled={loading} className="px-4 py-2.5 rounded-lg bg-[#0095f6] text-white text-sm font-medium disabled:opacity-50">
            {loading ? '…' : 'Search'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="space-y-2">
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full text-left px-3 py-3 rounded-xl bg-[#262626] border border-[#363636] hover:border-[#363636] active:bg-white/5"
            >
              <p className="text-white font-medium text-sm truncate">{t.name}</p>
              <p className="text-[#a8a8a8] text-xs truncate">{t.artists}{t.album ? ` · ${t.album}` : ''}</p>
            </button>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
