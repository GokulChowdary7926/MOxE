import { getApiBase } from '../services/api';
import { mediaEntryToUrl } from './mediaEntries';

/**
 * Safe media access for posts/items. Use instead of p.media[0]?.url to avoid runtime errors
 * when media is undefined, null, or not an array.
 */
export function getFirstMediaUrl(post: { media?: unknown[] | null; mediaUrl?: string; media_uri?: string } | null | undefined): string {
  if (!post) return '';
  if (typeof (post as any).mediaUrl === 'string') return (post as any).mediaUrl;
  if (typeof (post as any).media_uri === 'string') return (post as any).media_uri;
  if (!Array.isArray(post.media) || post.media.length === 0) return '';
  return mediaEntryToUrl(post.media[0]);
}

/** Origin for API (no /api path). Used to resolve relative upload URLs. */
function getMediaOrigin(): string {
  const base = getApiBase().replace(/\/api\/?$/, '');
  if (base && (base.startsWith('http://') || base.startsWith('https://'))) return base;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * Returns an absolute URL for media. Use when rendering img/video src for post, story, reel.
 * Fixes broken images when backend returns relative paths (e.g. /uploads/xxx) or wrong origin.
 */
export function ensureAbsoluteMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (t.startsWith('data:')) return t;
  const origin = getMediaOrigin();
  const localHostUpload = t.match(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(\/uploads\/[^?#]+)/i);
  if (localHostUpload && origin) {
    return `${origin}${localHostUpload[1]}`;
  }
  if (!t.includes('/') && !t.includes('\\') && origin) {
    return `${origin}/uploads/${t}`;
  }
  const pathMatch = t.match(/^(https?:\/\/[^/]+)?(\/uploads\/[^?#]+)/);
  if (pathMatch && origin) {
    return `${origin}${pathMatch[2]}`;
  }
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (!origin) return t;
  return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
}

/** True when URL path looks like a video file (extension-based; strips query string first). */
export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const normalized = url.split('?')[0].toLowerCase();
  return /\.(mp4|mov|webm|m4v|ogg)$/.test(normalized);
}
