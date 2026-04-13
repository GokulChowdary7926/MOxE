/** Shared helpers for MOxE social comment lists — white theme screens. */

export function formatCommentRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

/** e.g. 4200 → "4.2k", 123 → "123" */
export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace(/\.0M$/, 'M');
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`.replace(/\.0k$/, 'k');
  return String(Math.floor(n));
}

/** Deterministic pseudo counts when API omits like/reply totals (stable per id). */
export function pseudoCommentCount(seed: string, max: number): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const n = (h % max) + 100;
  return formatCompactCount(n >= 1000 ? n : n);
}
