import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X, Settings, Search } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { searchSpotifyTracks, type SpotifyTrack } from '../../services/spotifyApi';

const PILLS = ['For you', 'Trending', 'Original audio', 'Saved'];

function formatDuration(ms?: number): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/**
 * Music for story — search via backend Spotify integration; album art + 30s preview when available.
 */
export default function StoryMusicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPostMusicFlow = location.pathname.includes('/create/post/music');
  const [search, setSearch] = useState('');
  const [pill, setPill] = useState(0);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const defaultQuery = useMemo(() => {
    if (pill === 1) return 'trending';
    if (pill === 2) return 'original';
    return 'popular';
  }, [pill]);

  const loadTracks = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    const effective = trimmed.length >= 2 ? trimmed : defaultQuery;
    setLoading(true);
    setError(null);
    try {
      const results = await searchSpotifyTracks(effective, 20);
      setTracks(results);
    } catch (e) {
      setError((e as Error).message || 'Music search failed. Set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET on the server.');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [defaultQuery]);

  useEffect(() => {
    const delay = search.trim().length >= 2 ? 400 : 0;
    const t = window.setTimeout(() => {
      void loadTracks(search);
    }, delay);
    return () => window.clearTimeout(t);
  }, [search, defaultQuery, loadTracks]);

  const featured = tracks[0];

  const selectTrack = (t: SpotifyTrack) => {
    if (isPostMusicFlow) {
      navigate('/create/post/share', {
        state: { ...(location.state as Record<string, unknown>), prefillMusic: t },
      });
      return;
    }
    navigate('/stories/create/editor', {
      state: { prefillMusic: t },
    });
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">{isPostMusicFlow ? 'Add audio' : 'Add to story'}</span>
          <Link to="/settings/camera" className="p-2 -m-2 text-white" aria-label="Settings">
            <Settings className="w-6 h-6" />
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-20">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
            <input
              type="text"
              placeholder="Search songs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {PILLS.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setPill(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${
                  pill === i ? 'bg-white text-black' : 'bg-[#262626] text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
              <ThemedText className="text-red-300 text-xs">{error}</ThemedText>
            </div>
          )}

          {featured && (
            <button
              type="button"
              onClick={() => selectTrack(featured)}
              className="w-full text-left rounded-xl bg-[#262626] border border-[#363636] overflow-hidden mb-4 active:opacity-90"
            >
              <div className="aspect-[2/1] bg-[#363636] overflow-hidden flex items-center justify-center">
                {featured.album_image_url ? (
                  <img src={featured.album_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#737373] text-sm">Featured</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white font-semibold truncate">{featured.name}</p>
                <p className="text-[#a8a8a8] text-xs truncate">{featured.artists}</p>
                {featured.preview_url && (
                  <audio
                    controls
                    className="w-full mt-2 h-8"
                    src={featured.preview_url}
                    onPlay={() => setPlayingId(featured.id)}
                    onEnded={() => setPlayingId(null)}
                  />
                )}
              </div>
            </button>
          )}

          <p className="text-white font-semibold text-sm mb-2">{loading ? 'Loading…' : 'Music'}</p>
          <div className="space-y-2">
            {tracks.map((t) => (
              <div key={t.id} className="w-full flex items-center gap-3 py-2 rounded-lg">
                <button
                  type="button"
                  onClick={() => selectTrack(t)}
                  className="flex flex-1 min-w-0 items-center gap-3 text-left active:bg-white/5 rounded-lg pr-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#262626] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {t.album_image_url ? (
                      <img src={t.album_image_url} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{t.name}</p>
                    <p className="text-[#a8a8a8] text-xs truncate">{t.artists}</p>
                  </div>
                  <span className="text-[#737373] text-xs flex-shrink-0">{formatDuration(t.duration_ms)}</span>
                </button>
                {t.preview_url ? (
                  <>
                    <button
                      type="button"
                      className="p-2 text-[#0095f6] flex-shrink-0"
                      aria-label={playingId === t.id ? 'Pause preview' : 'Play preview'}
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById(`preview-${t.id}`) as HTMLAudioElement | null;
                        if (!el) return;
                        if (playingId && playingId !== t.id) {
                          document.querySelectorAll('audio[data-story-music-preview]').forEach((a) => (a as HTMLAudioElement).pause());
                        }
                        if (el.paused) {
                          void el.play();
                          setPlayingId(t.id);
                        } else {
                          el.pause();
                          setPlayingId(null);
                        }
                      }}
                    >
                      {playingId === t.id ? '❚❚' : '▶'}
                    </button>
                    <audio
                      id={`preview-${t.id}`}
                      data-story-music-preview
                      className="hidden"
                      src={t.preview_url}
                      onEnded={() => setPlayingId(null)}
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {!loading && tracks.length === 0 && !error && (
            <ThemedText secondary className="text-sm py-6 text-center">
              No tracks yet. Type at least 2 characters to search, or check Spotify credentials on the server.
            </ThemedText>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
