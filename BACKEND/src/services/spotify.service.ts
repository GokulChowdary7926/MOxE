/**
 * Spotify API for music (token + search).
 * Uses Client Credentials flow: Authorization: Basic base64(client_id:client_secret).
 * Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.
 */
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || 'Spotify token failed');
  }
  return data.access_token as string;
}

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  album?: string;
  /** Smallest cover image URL from Spotify (HTTPS). */
  album_image_url?: string | null;
  duration_ms?: number;
  preview_url?: string | null;
};

export async function searchTracks(query: string, token: string, limit = 20): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];
  const q = encodeURIComponent(query.trim());
  const res = await fetch(`${SPOTIFY_API}/search?type=track&q=${q}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as { tracks?: { items?: unknown[] }; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Spotify search failed');
  }
  const items = data?.tracks?.items ?? [];
  return items.map((t: any) => {
    const imgs = Array.isArray(t.album?.images) ? t.album.images : [];
    const albumImage =
      imgs.length > 0 ? (imgs[imgs.length - 1] as { url?: string })?.url ?? null : null;
    return {
      id: t.id,
      name: t.name,
      artists: (t.artists ?? []).map((a: any) => a.name).join(', '),
      album: t.album?.name,
      album_image_url: albumImage,
      duration_ms: t.duration_ms,
      preview_url: t.preview_url ?? null,
    };
  });
}
