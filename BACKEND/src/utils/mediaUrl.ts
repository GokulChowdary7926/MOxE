import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSharedS3Client } from './s3Client';

async function maybeSignS3ReadUrl(value: string): Promise<string> {
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
    const expiresIn = Number.isFinite(ttlRaw) ? Math.max(60, Math.min(604800, Math.floor(ttlRaw))) : 86400;
    const client = getSharedS3Client();
    if (!client) return value;
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, cmd, { expiresIn });
  } catch {
    return value;
  }
}

/**
 * Normalize stored media URLs for API clients.
 * Relative filenames (e.g. from legacy clients) become `/uploads/...` so the dev proxy can reach the API.
 */
export async function normalizeStoredMediaUrl(raw: unknown): Promise<string> {
  let value = '';
  if (typeof raw === 'string') value = raw.trim();
  else if (typeof raw === 'number' || typeof raw === 'bigint') value = String(raw).trim();
  if (!value) return '';
  if (value.startsWith('data:')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const match = value.match(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(\/uploads\/[^?#]+)/i);
    if (match) return match[1];
    return maybeSignS3ReadUrl(value);
  }
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('/')) return value;
  return `/uploads/${value.replace(/^\/+/, '')}`;
}

/** Normalize `media` JSON arrays on posts/reels for consistent client `src` values. */
export async function normalizeMediaJsonForApi(media: unknown): Promise<unknown> {
  if (!Array.isArray(media)) return media;
  const results = await Promise.all(
    media.map(async (entry) => {
      if (entry && typeof entry === 'object' && 'url' in entry) {
        const o = entry as Record<string, unknown>;
        const url = await normalizeStoredMediaUrl(o.url);
        return { ...o, url };
      }
      return entry;
    }),
  );
  return results;
}

/** DM / group message attachment JSON (not poll `options` arrays). */
export async function normalizeMessageMediaForApi(media: unknown): Promise<unknown> {
  if (media == null) return media;
  if (typeof media === 'string') return await normalizeStoredMediaUrl(media);
  if (typeof media === 'object' && !Array.isArray(media)) {
    const o = media as Record<string, unknown>;
    if (Array.isArray(o.options)) return media;
    const next = { ...o };
    for (const k of ['url', 'thumbnail', 'previewUrl', 'src', 'uri']) {
      if (typeof next[k] === 'string') next[k] = await normalizeStoredMediaUrl(next[k]);
    }
    return next;
  }
  return media;
}

/** Note `contentJson` — normalize common image / media keys. */
export async function normalizeNoteContentJsonForApi(content: unknown): Promise<unknown> {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return content;
  const c = { ...(content as Record<string, unknown>) };
  for (const k of ['image', 'imageUrl', 'mediaUrl', 'thumbnail', 'url', 'backgroundImage']) {
    if (typeof c[k] === 'string') c[k] = await normalizeStoredMediaUrl(c[k]);
  }
  for (const nestedKey of ['video', 'music', 'link', 'preview'] as const) {
    const nested = c[nestedKey];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) continue;
    const n = { ...(nested as Record<string, unknown>) };
    for (const k of ['url', 'image', 'imageUrl', 'thumbnail', 'previewUrl', 'albumArt', 'src', 'uri'] as const) {
      if (typeof n[k] === 'string') n[k] = await normalizeStoredMediaUrl(n[k]);
    }
    if (n.preview && typeof n.preview === 'object' && !Array.isArray(n.preview)) {
      const p = { ...(n.preview as Record<string, unknown>) };
      for (const k of ['image', 'imageUrl', 'thumbnail', 'url', 'src', 'uri'] as const) {
        if (typeof p[k] === 'string') p[k] = await normalizeStoredMediaUrl(p[k]);
      }
      n.preview = p;
    }
    c[nestedKey] = n;
  }
  if (Array.isArray(c.media)) c.media = await normalizeMediaJsonForApi(c.media);
  return c;
}
