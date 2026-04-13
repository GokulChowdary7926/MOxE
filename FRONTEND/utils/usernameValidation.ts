/** Aligned with BACKEND/src/utils/usernameValidation.ts — lowercase letters a–z only, 3–30 chars. */

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

const USERNAME_REGEX = /^[a-z]{3,30}$/;

const RESERVED = new Set([
  'admin',
  'support',
  'moxe',
  'instagram',
  'facebook',
  'twitter',
  'help',
  'security',
]);

export function validateUsernameClient(raw: string): { ok: true; normalized: string } | { ok: false; message: string } {
  const normalized = normalizeUsername(raw);
  if (!normalized) return { ok: false, message: 'Username is required' };
  if (normalized.length < 3 || normalized.length > 30) {
    return { ok: false, message: 'Username must be 3–30 characters' };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      ok: false,
      message: 'Username can only use lowercase letters (a–z), no numbers or symbols',
    };
  }
  if (RESERVED.has(normalized)) {
    return { ok: false, message: 'This username is reserved' };
  }
  return { ok: true, normalized };
}
