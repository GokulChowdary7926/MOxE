export type UsernameValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;

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
  return input.trim().replace(/^@+/, '');
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
      message: 'Username can only contain letters, numbers, periods (.) and underscores (_)',
    };
  }
  const lower = username.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) {
    return { valid: false, message: 'This username is reserved' };
  }

  return { valid: true };
}

