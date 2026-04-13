/**
 * Normalize stored media URLs for API clients.
 * Relative filenames (e.g. from legacy clients) become `/uploads/...` so the dev proxy can reach the API.
 */
export function normalizeStoredMediaUrl(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
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
  if (Array.isArray(c.media)) c.media = normalizeMediaJsonForApi(c.media);
  return c;
}
