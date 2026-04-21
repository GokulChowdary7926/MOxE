// Sync presigned GET URLs for private S3 objects. aws-sdk v2 getSignedUrl is synchronous; v3 presigner is
// async — migrating would require async normalizeStoredMediaUrl across all services (TODO).
import AWS from 'aws-sdk';

let s3ForReads: AWS.S3 | null = null;

function getS3ForReads(): AWS.S3 | null {
  if (s3ForReads) return s3ForReads;
  const region = process.env.AWS_REGION?.trim();
  if (!region) return null;
  const useKeys =
    !!process.env.AWS_ACCESS_KEY_ID?.trim() && !!process.env.AWS_SECRET_ACCESS_KEY?.trim();
  s3ForReads = useKeys
    ? new AWS.S3({
        region,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      })
    : new AWS.S3({ region });
  return s3ForReads;
}

function maybeSignS3ReadUrl(value: string): string {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) return value;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    const bucketHost = `${bucket}.s3.${(process.env.AWS_REGION || '').trim()}.amazonaws.com`.toLowerCase();
    const legacyHost = `${bucket}.s3.amazonaws.com`.toLowerCase();
    if (host !== bucketHost && host !== legacyHost) return value;
    const key = u.pathname.replace(/^\/+/, '');
    if (!key) return value;
    const ttlRaw = Number(process.env.AWS_S3_READ_URL_TTL_SECONDS || '86400');
    const expires = Number.isFinite(ttlRaw) ? Math.max(60, Math.min(604800, Math.floor(ttlRaw))) : 86400;
    const s3 = getS3ForReads();
    if (!s3) return value;
    return s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expires,
    });
  } catch {
    return value;
  }
}

/**
 * Normalize stored media URLs for API clients.
 * Relative filenames (e.g. from legacy clients) become `/uploads/...` so the dev proxy can reach the API.
 */
export function normalizeStoredMediaUrl(raw: unknown): string {
  let value = '';
  if (typeof raw === 'string') value = raw.trim();
  else if (typeof raw === 'number' || typeof raw === 'bigint') value = String(raw).trim();
  if (!value) return '';
  if (value.startsWith('data:')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    // Migrate legacy/local absolute URLs (e.g. http://localhost:5007/uploads/x.jpg)
    // into stable relative upload paths that frontend can resolve with current origin.
    const match = value.match(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(\/uploads\/[^?#]+)/i);
    if (match) return match[1];
    // S3 objects may be private; return a signed URL when value points to configured bucket.
    return maybeSignS3ReadUrl(value);
  }
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('/')) return value;
  return `/uploads/${value.replace(/^\/+/, '')}`;
}

/** Normalize `media` JSON arrays on posts/reels for consistent client `src` values. */
export function normalizeMediaJsonForApi(media: unknown): unknown {
  if (!Array.isArray(media)) return media;
  return media.map((entry) => {
    if (entry && typeof entry === 'object' && 'url' in entry) {
      const o = entry as Record<string, unknown>;
      const url = normalizeStoredMediaUrl(o.url);
      return { ...o, url };
    }
    return entry;
  });
}

/** DM / group message attachment JSON (not poll `options` arrays). */
export function normalizeMessageMediaForApi(media: unknown): unknown {
  if (media == null) return media;
  if (typeof media === 'string') return normalizeStoredMediaUrl(media);
  if (typeof media === 'object' && !Array.isArray(media)) {
    const o = media as Record<string, unknown>;
    if (Array.isArray(o.options)) return media;
    const next = { ...o };
    for (const k of ['url', 'thumbnail', 'previewUrl', 'src', 'uri']) {
      if (typeof next[k] === 'string') next[k] = normalizeStoredMediaUrl(next[k]);
    }
    return next;
  }
  return media;
}

/** Note `contentJson` — normalize common image / media keys. */
export function normalizeNoteContentJsonForApi(content: unknown): unknown {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return content;
  const c = { ...(content as Record<string, unknown>) };
  for (const k of ['image', 'imageUrl', 'mediaUrl', 'thumbnail', 'url', 'backgroundImage']) {
    if (typeof c[k] === 'string') c[k] = normalizeStoredMediaUrl(c[k]);
  }
  // Normalize common nested note payloads used by UI:
  // - VIDEO: contentJson.video.url
  // - MUSIC: contentJson.music.albumArt / previewUrl
  // - LINK: contentJson.link.preview.image / imageUrl / thumbnail
  // - Any nested object with url-like keys in one level.
  for (const nestedKey of ['video', 'music', 'link', 'preview'] as const) {
    const nested = c[nestedKey];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) continue;
    const n = { ...(nested as Record<string, unknown>) };
    for (const k of ['url', 'image', 'imageUrl', 'thumbnail', 'previewUrl', 'albumArt', 'src', 'uri'] as const) {
      if (typeof n[k] === 'string') n[k] = normalizeStoredMediaUrl(n[k]);
    }
    if (n.preview && typeof n.preview === 'object' && !Array.isArray(n.preview)) {
      const p = { ...(n.preview as Record<string, unknown>) };
      for (const k of ['image', 'imageUrl', 'thumbnail', 'url', 'src', 'uri'] as const) {
        if (typeof p[k] === 'string') p[k] = normalizeStoredMediaUrl(p[k]);
      }
      n.preview = p;
    }
    c[nestedKey] = n;
  }
  if (Array.isArray(c.media)) c.media = normalizeMediaJsonForApi(c.media);
  return c;
}
