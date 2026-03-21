/**
 * Display helpers for subscription and plan info.
 */

import type { EffectiveTierKey } from '../types/subscription';

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE: 'Free',
  STAR: 'Star',
  PERSONAL_FREE: 'Free',
  PERSONAL_STAR: 'Star',
  BUSINESS_FREE: 'Business Free',
  BUSINESS_PAID: 'Business Paid',
  CREATOR_FREE: 'Creator Free',
  CREATOR_PAID: 'Creator Paid',
  JOB_FREE: 'Job (Free)',
  JOB_PAID: 'Job Professional',
};

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STAR: 1,
  PERSONAL_FREE: 0,
  PERSONAL_STAR: 1,
  BUSINESS_FREE: 0,
  BUSINESS_PAID: 5,
  CREATOR_FREE: 0,
  CREATOR_PAID: 5,
  JOB_FREE: 0,
  JOB_PAID: 10,
};

export function getPlanDisplayName(tier: string): string {
  return PLAN_DISPLAY_NAMES[tier] ?? tier;
}

export function getPlanPrice(tier: string): number {
  return PLAN_PRICES[tier] ?? 0;
}

export function getAnnualPrice(tier: string): number {
  const monthly = getPlanPrice(tier);
  return monthly > 0 ? Math.round(monthly * 12 * 0.9) : 0;
}

export function getBadgeInfo(
  tier: string,
  accountType: string
): { hasBadge: boolean; color: 'blue' | 'purple' | null; symbol: string | null } {
  if (tier === 'JOB_PAID' || tier === 'THICK') {
    const at = (accountType || '').toUpperCase();
    if (at === 'JOB') return { hasBadge: true, color: 'purple', symbol: '✓' };
  }
  if (tier === 'BUSINESS_PAID' || tier === 'CREATOR_PAID' || (tier === 'THICK' && (accountType === 'BUSINESS' || accountType === 'CREATOR'))) {
    return { hasBadge: true, color: 'blue', symbol: '✓' };
  }
  if (tier === 'STAR') return { hasBadge: false, color: null, symbol: null };
  return { hasBadge: false, color: null, symbol: null };
}

export function formatStorage(gb: number): string {
  if (gb >= 1000) return `${gb / 1000} TB`;
  return `${gb} GB`;
}

export function isPaidTier(tier: string): boolean {
  return getPlanPrice(tier) > 0;
}

export function requiresAccountType(tier: string): 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB' | null {
  if (tier === 'JOB_PAID' || tier === 'JOB_FREE') return 'JOB';
  if (tier === 'BUSINESS_FREE' || tier === 'BUSINESS_PAID') return 'BUSINESS';
  if (tier === 'CREATOR_FREE' || tier === 'CREATOR_PAID') return 'CREATOR';
  return 'PERSONAL';
}

/** Derive effective tier key from accountType + subscriptionTier (backend convention) */
export function getEffectiveTierKey(accountType: string, subscriptionTier: string): EffectiveTierKey {
  const at = (accountType || 'PERSONAL').toUpperCase();
  const st = (subscriptionTier || 'FREE').toUpperCase();
  if (at === 'PERSONAL') return st === 'STAR' ? 'PERSONAL_STAR' : 'PERSONAL_FREE';
  if (at === 'BUSINESS') return st === 'THICK' ? 'BUSINESS_PAID' : 'BUSINESS_FREE';
  if (at === 'CREATOR') return st === 'THICK' ? 'CREATOR_PAID' : 'CREATOR_FREE';
  if (at === 'JOB') return st === 'THICK' ? 'JOB_PAID' : 'JOB_FREE';
  return 'PERSONAL_FREE';
}
