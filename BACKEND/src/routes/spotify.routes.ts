import { Router } from 'express';
import { getSpotifyAccessToken, isSpotifyConfigured, searchTracks } from '../services/spotify.service';
import { AppError } from '../utils/AppError';

const router = Router();

const NOT_CONFIGURED_MSG =
  'Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the server environment.';

/** GET /api/spotify/token – returns { access_token, expires_in } for client credentials flow */
router.get('/token', async (_req, res, next) => {
  try {
    if (!isSpotifyConfigured()) {
      return next(new AppError(NOT_CONFIGURED_MSG, 503, 'SPOTIFY_NOT_CONFIGURED'));
    }
    const access_token = await getSpotifyAccessToken();
    res.json({ access_token, expires_in: 3600 });
  } catch (e) {
    next(new AppError((e as Error).message, 502));
  }
});

/** GET /api/spotify/search?q=... – search tracks (uses token internally) */
router.get('/search', async (req, res, next) => {
  try {
    if (!isSpotifyConfigured()) {
      return next(new AppError(NOT_CONFIGURED_MSG, 503, 'SPOTIFY_NOT_CONFIGURED'));
    }
    const q = (req.query.q as string) ?? '';
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const token = await getSpotifyAccessToken();
    const tracks = await searchTracks(q, token, limit);
    res.json({ tracks });
  } catch (e) {
    next(new AppError((e as Error).message, 502));
  }
});

export default router;
