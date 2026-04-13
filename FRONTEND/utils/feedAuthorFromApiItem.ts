/**
 * Normalizes author fields from `GET /api/posts/feed` and `/feed/favorites` items.
 * The API uses flat `username`, `displayName`, `profilePhoto`; some payloads may nest under `author` / `account`.
 */
export function feedAuthorFromApiItem(p: Record<string, unknown>): {
  username: string;
  displayName: string | null;
  avatarUri: string | null;
} {
  const author = (p.author ?? null) as Record<string, unknown> | null;
  const account = (p.account ?? null) as Record<string, unknown> | null;

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const rawUsername =
    str(p.username) ||
    (author ? str(author.username) : '') ||
    (account ? str(account.username) : '');

  const displayNameRaw =
    str(p.displayName) ||
    (author ? str(author.displayName) : '') ||
    (account ? str(account.displayName) : '');

  const avatarUri =
    str(p.profilePhoto) ||
    (author ? str(author.avatarUrl) || str(author.avatarUri) || str(author.profilePhoto) : '') ||
    (account ? str(account.profilePhoto) || str(account.avatarUrl) : '') ||
    null;

  const username = rawUsername || displayNameRaw || 'account';
  const displayName = displayNameRaw ? displayNameRaw : null;

  return { username, displayName, avatarUri: avatarUri || null };
}
