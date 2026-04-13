import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { AccountCapabilities } from '../constants/accountTypes';
import { DEFAULT_CAPABILITIES } from '../constants/accountTypes';

/**
 * Returns capabilities from Redux if we stored them after /accounts/me or /accounts/capabilities.
 * Otherwise returns defaults based on currentAccount.accountType and subscriptionTier.
 */
export function useAccountCapabilities(): AccountCapabilities & { loading: boolean } {
  const { currentAccount, capabilities: storedCapabilities } = useSelector((state: RootState) => state.account);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated || !currentAccount) {
    return { ...DEFAULT_CAPABILITIES, loading: false };
  }
  if (storedCapabilities) {
    return { ...storedCapabilities, loading: false };
  }
  // All features free for all accounts – no subscription/tier gating
  const type = (currentAccount as any).accountType || 'PERSONAL';
  const derived: AccountCapabilities = {
    ...DEFAULT_CAPABILITIES,
    label: type,
    canTrack: type === 'JOB',
    canKnow: type === 'JOB',
    canFlow: type === 'JOB',
    canDualProfile: type === 'JOB',
    canJobFeed: type === 'JOB',
    canNetworking: type === 'JOB',
    canLive: type === 'BUSINESS' || type === 'CREATOR',
    canCommerce: type === 'BUSINESS',
    canSubscriptions: type === 'CREATOR' || type === 'BUSINESS',
    canBadgesGifts: type === 'CREATOR' || type === 'BUSINESS',
    canBusinessHours: type === 'BUSINESS',
    canActionButtons: type === 'BUSINESS',
    canAnalytics: true,
    canAds: type === 'BUSINESS' || type === 'CREATOR',
    canSchedulePosts: true,
    canCloseFriends: true,
    canSavedCollections: true,
    maxLinks: 5,
  };
  return { ...derived, loading: false };
}

export function useCurrentAccount() {
  return useSelector((state: RootState) => state.account.currentAccount);
}

export function useAccountType(): string | null {
  const account = useCurrentAccount();
  return (account as any)?.accountType ?? null;
}
