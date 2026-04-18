/**
 * Spotify API for music – calls MOxE backend which holds client credentials.
 * Backend uses Authorization: Basic base64(client_id:client_secret) to get token.
 */
import { getApiBase } from './api';

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  album?: string;
  album_image_url?: string | null;
  duration_ms?: number;
  preview_url?: string | null;
};

/** Get a Spotify access token via backend (client credentials flow). */
export async function getSpotifyToken(): Promise<string> {
  const base = getApiBase();
  const res = await fetch(`${base}/spotify/token`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to get Spotify token');
  return data.access_token;
}

/** Search tracks via backend. */
export async function searchSpotifyTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
  const base = getApiBase();
  const q = encodeURIComponent(query);
  const res = await fetch(`${base}/spotify/search?q=${q}&limit=${limit}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Spotify search failed');
  return data.tracks ?? [];
}
