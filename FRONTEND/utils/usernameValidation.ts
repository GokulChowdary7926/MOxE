/** Aligned with BACKEND/src/utils/usernameValidation.ts — lowercase a-z, 0-9, ., _ (1–30). */

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

const USERNAME_REGEX = /^[a-z0-9._]{1,30}$/;
const DISPLAY_NAME_MAX_LENGTH = 64;

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
  if (normalized.length < 1 || normalized.length > 30) {
    return { ok: false, message: 'Username must be 1–30 characters' };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      ok: false,
      message: 'Username can only use lowercase letters, numbers, periods, and underscores',
    };
  }
  if (RESERVED.has(normalized)) {
    return { ok: false, message: 'This username is reserved' };
  }
  return { ok: true, normalized };
}

export function validateDisplayNameClient(raw: string): { ok: true; normalized: string } | { ok: false; message: string } {
  const normalized = raw.trim();
  if (!normalized) return { ok: false, message: 'Display name is required' };
  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, message: 'Display name must be 1-64 characters' };
  }
  return { ok: true, normalized };
}
