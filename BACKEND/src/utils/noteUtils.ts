import { SubscriptionTier } from '@prisma/client';

export function getNoteLimits(tier: SubscriptionTier) {
  const base = {
    charLimit: 60,
    durationHours: 24,
    maxActiveNotes: 1,
    maxScheduledNotes: 0,
    canSchedule: false,
    canAnalytics: false,
  };

  if (tier === 'STAR') {
    return {
      ...base,
      charLimit: 120,
      durationHours: 48,
      maxActiveNotes: 3,
      maxScheduledNotes: 3,
      canSchedule: true,
      canAnalytics: true,
    };
  }

  if (tier === 'THICK') {
    return {
      ...base,
      charLimit: 200,
      durationHours: 72,
      maxActiveNotes: 5,
      maxScheduledNotes: 5,
      canSchedule: true,
      canAnalytics: true,
    };
  }

  return base;
}

export function canViewByAudience(
  audienceType: string | undefined,
  isMutual: boolean,
  isCloseFriend: boolean,
): boolean {
  if (audienceType === 'closeFriends') return isCloseFriend;
  if (audienceType === 'mutual') return isMutual;
  return isMutual;
}
