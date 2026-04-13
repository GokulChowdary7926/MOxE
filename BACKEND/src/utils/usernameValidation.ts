export type UsernameValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; message: string };

/** Usernames: lowercase English letters only (a–z), 3–30 characters. */
const USERNAME_REGEX = /^[a-z]{3,30}$/;

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
  if (username.length < 3 || username.length > 30) {
    return { valid: false, message: 'Username must be 3-30 characters' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      message: 'Username can only use lowercase letters (a–z), no numbers or symbols',
    };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, message: 'This username is reserved' };
  }

  return { valid: true, normalized: username };
}

