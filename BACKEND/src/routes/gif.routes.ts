import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

type GifItem = { id: string; url: string; previewUrl?: string };
type CacheEntry = { items: GifItem[]; expiresAt: number };

// In‑memory cache; in production you would use Redis or similar.
const CACHE: Record<string, CacheEntry> = {};
const RATE: Record<string, { count: number; windowStart: number }> = {};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // per IP
const CACHE_TTL_MS = 10 * 60_000; // 10 minutes

const GIF_API_KEY = process.env.GIPHY_API_KEY || '';
const GIF_ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function checkRate(ip: string) {
  const now = Date.now();
  const entry = RATE[ip];
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    RATE[ip] = { count: 1, windowStart: now };
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ items: [] });

    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? (req.headers['x-forwarded-for'][0] as string)
        : '') ||
      req.ip ||
      'unknown';

    if (!checkRate(ip)) {
      return res.status(429).json({ error: 'GIF search rate limit exceeded.' });
    }

    const normalized = normalizeQuery(q);
    const now = Date.now();
    const cached = CACHE[normalized];
    if (cached && cached.expiresAt > now) {
      return res.json({ items: cached.items });
    }

    if (!GIF_API_KEY) {
      return res.status(500).json({ error: 'GIF API key not configured.' });
    }

    const url = `${GIF_ENDPOINT}?api_key=${encodeURIComponent(
      GIF_API_KEY,
    )}&q=${encodeURIComponent(normalized)}&limit=25&rating=pg-13`;

    const apiRes = await fetch(url);
    const data: any = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok || !Array.isArray(data.data)) {
      return res.status(500).json({ error: 'Failed to fetch GIFs.' });
    }

    const items: GifItem[] = data.data.map((g: any) => {
      const orig = g.images?.original || g.images?.downsized || {};
      const preview = g.images?.fixed_height_small || g.images?.preview_gif || {};
      return {
        id: g.id,
        url: orig.url,
        previewUrl: preview.url || orig.url,
      };
    });

    CACHE[normalized] = { items, expiresAt: now + CACHE_TTL_MS };
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

export default router;

