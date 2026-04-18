import { readApiError } from './readApiError';

/** Patterns that should never be shown to users (browser/engine noise). */
const TECHNICAL =
  /undefined is not an object|evaluating\s+['']|TypeError|ReferenceError|^\s*at\s+/im;

/**
 * Returns empty string if the message looks like a raw JS/runtime error; otherwise trimmed text.
 */
export function sanitizeClientErrorMessage(raw: string | undefined | null): string {
  if (raw == null) return '';
  const t = raw.trim();
  if (!t || TECHNICAL.test(t)) return '';
  return t.length > 200 ? `${t.slice(0, 197)}…` : t;
}

/**
 * Safe message for catch blocks: never surfaces technical engine strings.
 */
export function messageFromUnknown(error: unknown, fallback: string): string {
  const m = error instanceof Error ? error.message : String(error ?? '');
  return sanitizeClientErrorMessage(m) || fallback;
}

/**
 * Human-readable upload failure from a fetch Response (handles 413 / HTML nginx bodies).
 */
export async function userFacingUploadError(
  res: Response,
  fallback = 'Could not upload. Please try again.'
): Promise<string> {
  if (res.status === 413) {
    return 'This file is too large. Use a file under 20 MB for posts and stories.';
  }
  const msg = await readApiError(res);
  const cleaned = sanitizeClientErrorMessage(msg);
  if (cleaned) return cleaned;
  if (res.status >= 500) return 'Something went wrong on the server. Please try again.';
  return fallback;
}

/** Non-upload JSON API failures (safe copy, no raw stack traces). */
export async function userFacingApiError(res: Response, fallback: string): Promise<string> {
  const msg = await readApiError(res);
  const cleaned = sanitizeClientErrorMessage(msg);
  if (cleaned) return cleaned;
  if (res.status === 413) {
    return 'This file is too large. Use a smaller file (under 20 MB for standard uploads).';
  }
  if (res.status >= 500) return 'Something went wrong on the server. Please try again.';
  return fallback;
}
