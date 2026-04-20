export function mediaEntryToUrl(entry: unknown): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry.trim();
  if (typeof entry !== 'object') return '';
  const m = entry as { url?: unknown; uri?: unknown; mediaUrl?: unknown; src?: unknown };
  for (const candidate of [m.url, m.uri, m.mediaUrl, m.src]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

export function getMediaUrls(media: unknown): string[] {
  if (!Array.isArray(media)) return [];
  return media.map((entry) => mediaEntryToUrl(entry)).filter(Boolean);
}
