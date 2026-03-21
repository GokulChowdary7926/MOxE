/**
 * Full MOxE subscription capabilities (single source of truth).
 * Maps effective tier (accountType + subscriptionTier) to capability set.
 * Prisma keeps FREE | STAR | THICK; we derive effective tier for capability lookup.
 */

import type { AccountType, SubscriptionTier } from './capabilities';

export type VoiceCommandLevel = 'none' | 'basic' | 'advanced';
export type SupportPriority = 'standard' | 'priority' | 'emergency';

export interface FullAccountCapabilities {
  accountType: AccountType;
  subscriptionTier: SubscriptionTier;
  cloudStorageGB: number;
  hasBlueBadge: boolean;
  hasPurpleBadge: boolean;
  hasAds: boolean;
  canViewProfileVisitors: boolean;
  anonymousStoryViewsPerDay: number;
  canSendToBlockedUsers: number;
  hasDownloadProtection: boolean;
  hasVoiceCommands: VoiceCommandLevel;
  canSchedulePosts: boolean;
  hasTrendingAudio: boolean;
  hasContentIdeas: boolean;
  hasContentCalendar: boolean;
  canRunAds: boolean;
  maxProducts: number;
  hasLiveShopping: boolean;
  hasTeamManagement: boolean;
  canUseSubscriptions: boolean;
  canUseBadges: boolean;
  canUseGifts: boolean;
  canUseBrandedContent: boolean;
  hasBrandMarketplace: boolean;
  hasJobTools: boolean;
  professionalTools: string[];
  supportPriority: SupportPriority;
  supportResponseTime: string;
  nearbyMessagingFreePosts: number;
  /** Text-only nearby messages per day (no photo). */
  nearbyMessagingFreeMessages: number;
  nearbyMessagingExtraCost: number;
}

const JOB_TOOLS_LIST = [
  'TRACK', 'TRACK_RECRUITER', 'WORK', 'KNOW', 'CODE', 'STATUS',
  'FLOW', 'ACCESS', 'ALERT', 'BUILD', 'COMPASS', 'ATLAS',
  'VIDEO', 'CHAT', 'SOURCE', 'CODE_SEARCH', 'AI', 'STRATEGY',
  'ANALYTICS', 'PROFILE', 'INTEGRATION', 'SCRUM', 'TEAMS', 'DOCS',
];

const baseFree = (accountType: AccountType): FullAccountCapabilities => ({
  accountType,
  subscriptionTier: 'FREE',
  cloudStorageGB: 1,
  hasBlueBadge: false,
  hasPurpleBadge: false,
  hasAds: true,
  canViewProfileVisitors: false,
  anonymousStoryViewsPerDay: 0,
  canSendToBlockedUsers: 0,
  hasDownloadProtection: false,
  hasVoiceCommands: 'none',
  canSchedulePosts: false,
  hasTrendingAudio: accountType === 'BUSINESS' || accountType === 'CREATOR',
  hasContentIdeas: false,
  hasContentCalendar: false,
  canRunAds: false,
  maxProducts: accountType === 'BUSINESS' ? 50 : 0,
  hasLiveShopping: false,
  hasTeamManagement: false,
  canUseSubscriptions: false,
  canUseBadges: false,
  canUseGifts: false,
  canUseBrandedContent: accountType === 'BUSINESS',
  hasBrandMarketplace: false,
  hasJobTools: false,
  professionalTools: [],
  supportPriority: 'standard',
  supportResponseTime: '48h',
  nearbyMessagingFreePosts: 1,
  nearbyMessagingFreeMessages: 10,
  nearbyMessagingExtraCost: 0.5,
});

export const TIER_CAPABILITIES: Record<string, FullAccountCapabilities> = {
  PERSONAL_FREE: { ...baseFree('PERSONAL') },
  PERSONAL_STAR: {
    ...baseFree('PERSONAL'),
    subscriptionTier: 'STAR',
    cloudStorageGB: 5,
    hasAds: false,
    canViewProfileVisitors: true,
    anonymousStoryViewsPerDay: 2,
    canSendToBlockedUsers: 1,
    hasDownloadProtection: true,
    hasVoiceCommands: 'basic',
    supportPriority: 'priority',
    supportResponseTime: '4h',
    nearbyMessagingFreePosts: 1,
    nearbyMessagingFreeMessages: 10,
  },
  BUSINESS_FREE: { ...baseFree('BUSINESS') },
  BUSINESS_PAID: {
    ...baseFree('BUSINESS'),
    subscriptionTier: 'THICK',
    cloudStorageGB: 5,
    hasBlueBadge: true,
    hasAds: false,
    canViewProfileVisitors: true,
    anonymousStoryViewsPerDay: 10,
    canSendToBlockedUsers: 2,
    hasDownloadProtection: true,
    hasVoiceCommands: 'advanced',
    canSchedulePosts: true,
    hasTrendingAudio: true,
    hasContentIdeas: true,
    hasContentCalendar: true,
    canRunAds: true,
    maxProducts: -1,
    hasLiveShopping: true,
    hasTeamManagement: true,
    supportPriority: 'priority',
    supportResponseTime: '30min',
    nearbyMessagingFreePosts: 1,
    nearbyMessagingFreeMessages: 10,
  },
  CREATOR_FREE: { ...baseFree('CREATOR') },
  CREATOR_PAID: {
    ...baseFree('CREATOR'),
    subscriptionTier: 'THICK',
    cloudStorageGB: 5,
    hasBlueBadge: true,
    hasAds: false,
    canViewProfileVisitors: true,
    anonymousStoryViewsPerDay: 10,
    canSendToBlockedUsers: 2,
    hasDownloadProtection: true,
    hasVoiceCommands: 'advanced',
    canSchedulePosts: true,
    hasTrendingAudio: true,
    hasContentIdeas: true,
    hasContentCalendar: true,
    canUseSubscriptions: true,
    canUseBadges: true,
    canUseGifts: true,
    canUseBrandedContent: true,
    hasBrandMarketplace: true,
    supportPriority: 'priority',
    supportResponseTime: '30min',
    nearbyMessagingFreePosts: 1,
    nearbyMessagingFreeMessages: 10,
  },
  JOB_FREE: {
    ...baseFree('JOB'),
    hasJobTools: false,
    professionalTools: [],
  },
  JOB_PAID: {
    ...baseFree('JOB'),
    subscriptionTier: 'THICK',
    cloudStorageGB: 10,
    hasPurpleBadge: true,
    hasAds: false,
    canViewProfileVisitors: true,
    anonymousStoryViewsPerDay: 10,
    canSendToBlockedUsers: 2,
    hasDownloadProtection: true,
    hasVoiceCommands: 'advanced',
    canSchedulePosts: true,
    hasTrendingAudio: true,
    hasContentIdeas: true,
    hasContentCalendar: true,
    hasTeamManagement: true,
    hasJobTools: true,
    professionalTools: JOB_TOOLS_LIST,
    supportPriority: 'priority',
    supportResponseTime: '30min',
    nearbyMessagingFreePosts: 1,
    nearbyMessagingFreeMessages: 10,
  },
};

export type EffectiveTierKey = keyof typeof TIER_CAPABILITIES;

export function getEffectiveTierKey(accountType: AccountType, subscriptionTier: SubscriptionTier): EffectiveTierKey {
  if (accountType === 'PERSONAL') return subscriptionTier === 'STAR' ? 'PERSONAL_STAR' : 'PERSONAL_FREE';
  if (accountType === 'BUSINESS') return subscriptionTier === 'THICK' ? 'BUSINESS_PAID' : 'BUSINESS_FREE';
  if (accountType === 'CREATOR') return subscriptionTier === 'THICK' ? 'CREATOR_PAID' : 'CREATOR_FREE';
  if (accountType === 'JOB') return subscriptionTier === 'THICK' ? 'JOB_PAID' : 'JOB_FREE';
  return 'PERSONAL_FREE';
}

export function getFullCapabilities(accountType: AccountType, subscriptionTier: SubscriptionTier): FullAccountCapabilities {
  const key = getEffectiveTierKey(accountType, subscriptionTier);
  return TIER_CAPABILITIES[key] ?? TIER_CAPABILITIES.PERSONAL_FREE;
}
