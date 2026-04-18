export type UsernameValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; message: string };

export type DisplayNameValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; message: string };

/** Usernames: Instagram-style chars (a-z, 0-9, ., _), normalized to lowercase, 1–30 chars. */
const USERNAME_REGEX = /^[a-z0-9._]{1,30}$/;
const DISPLAY_NAME_MAX_LENGTH = 64;

// Keep this list aligned with MOxE “reserved” concept.
// NOTE: comparisons should be case-insensitive.
const RESERVED_USERNAMES = new Set([
  'admin',
  'support',
  'moxe',
  'instagram',
  'facebook',
  'twitter',
  'help',
  'security',
]);

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

/** Google / OAuth: derive a valid username from email local-part (letters only). */
export function suggestUsernameFromEmailLocalPart(localPart: string): string {
  const lettersOnly = localPart.replace(/[^a-zA-Z]/g, '').toLowerCase();
  let base = lettersOnly.slice(0, 30);
  if (base.length < 3) {
    base = `${lettersOnly}moxeuser`.replace(/[^a-z]/g, '').toLowerCase().slice(0, 30);
  }
  if (base.length < 3) base = 'mox';
  return base.slice(0, 30);
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz';

export function randomAlphabeticLower(length: number): string {
  return Array.from({ length }, () => LOWER[Math.floor(Math.random() * 26)]).join('');
}

export function validateUsernameFormat(input: string): UsernameValidationResult {
  const username = normalizeUsername(input);

  if (!username) return { valid: false, message: 'Username is required' };
  if (username.length < 1 || username.length > 30) {
    return { valid: false, message: 'Username must be 1-30 characters' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      message: 'Username can only use lowercase letters, numbers, periods, and underscores',
    };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, message: 'This username is reserved' };
  }

  return { valid: true, normalized: username };
}

export function validateDisplayNameFormat(input: string): DisplayNameValidationResult {
  const displayName = input.trim();
  if (!displayName) return { valid: false, message: 'Display name is required' };
  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return { valid: false, message: 'Display name must be 1-64 characters' };
  }
  return { valid: true, normalized: displayName };
}

