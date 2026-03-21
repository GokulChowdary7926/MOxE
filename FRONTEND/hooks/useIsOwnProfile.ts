import { useParams } from 'react-router-dom';
import { useCurrentAccount } from './useAccountCapabilities';

/**
 * Use for profile, followers, following, and any page that can show either
 * the current user's data (own) or another user's data (other).
 * See docs/OWNERSHIP_AND_VIEWER_PATTERNS.md for full patterns.
 */
export function useIsOwnProfile(): boolean {
  const { username } = useParams<{ username?: string }>();
  const currentAccount = useCurrentAccount();
  const currentUsername = (currentAccount as { username?: string } | null)?.username;
  return !username || currentUsername === username;
}
