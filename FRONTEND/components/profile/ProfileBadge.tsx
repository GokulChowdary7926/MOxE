import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { getBadgeInfo } from '../../utils/subscriptionDisplay';
import { VerifiedBadge } from '../atoms/VerifiedBadge';

/**
 * Shows blue or purple verification badge based on account type and subscription tier.
 * Use next to username in headers, profile, etc.
 */
export default function ProfileBadge() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as {
    accountType?: string;
    subscriptionTier?: string;
  } | null;

  if (!currentAccount) return null;

  const accountType = currentAccount.accountType ?? 'PERSONAL';
  const subscriptionTier = currentAccount.subscriptionTier ?? 'FREE';
  const badge = getBadgeInfo(subscriptionTier, accountType);

  if (!badge.hasBadge || !badge.color) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center">
      <VerifiedBadge variant={badge.color} size={14} />
    </span>
  );
}
