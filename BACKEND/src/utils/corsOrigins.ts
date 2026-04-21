/**
 * CORS and Socket.IO: single source of truth for allowed browser origins.
 *
 * - CLIENT_URL: primary production/staging app URL (required in prod for Socket.IO).
 * - ALLOWED_ORIGINS: comma-separated extra origins (e.g. https://app.example.com,https://staging.example.com).
 */

const LOCAL_HOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const DEV_DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:7926',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:7926',
];

function parseExtraOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** All explicit origin strings (CLIENT_URL + ALLOWED_ORIGINS + local dev defaults). */
export function getCorsOriginAllowlist(): string[] {
  const fromEnv = [process.env.CLIENT_URL?.trim(), ...parseExtraOrigins()].filter(Boolean) as string[];
  const merged = [...fromEnv, ...DEV_DEFAULT_ORIGINS];
  return [...new Set(merged)];
}

export function isCorsOriginAllowed(origin: string | undefined, allowlist: string[]): boolean {
  if (!origin) return true;
  if (allowlist.includes(origin)) return true;
  if (LOCAL_HOST_REGEX.test(origin)) return true;
  return false;
}
