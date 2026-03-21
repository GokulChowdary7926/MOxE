/**
 * MOxE account types and subscription tiers.
 * Capabilities determine which features are available per account type and tier.
 */

export const ACCOUNT_TYPES = ['PERSONAL', 'BUSINESS', 'CREATOR', 'JOB'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const SUBSCRIPTION_TIERS = ['FREE', 'STAR', 'THICK'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/** Personal FREE: feed, posts, stories, reels, DMs, explore, 1 link, no scheduling */
/** Personal STAR: + post scheduling, insights, saved/collections, close friends */
/** Business THICK: commerce, live, subscriptions, badges, business hours, analytics */
/** Creator FREE: basic creator (live, schedule, analytics 7d, 5 links); Creator THICK (Paid $5): + subscriptions, badges, gifts, full analytics, Blue Badge */
/** Job: Paid only ($10/mo). Track, Know, Flow, dual profile, job feed, networking. Purple Verification Badge when verified. 10GB base storage. */

import { getFullCapabilities, type FullAccountCapabilities } from './tierCapabilities';

export interface AccountCapabilities {
  // Content
  canPost: boolean;
  canStory: boolean;
  canReel: boolean;
  canLive: boolean;
  canSchedulePosts: boolean;
  maxLinks: number;
  // Social
  canDm: boolean;
  canExplore: boolean;
  canCloseFriends: boolean;
  canSavedCollections: boolean;
  // Business/Creator
  canCommerce: boolean;
  canSubscriptions: boolean;
  canBadgesGifts: boolean;
  canBusinessHours: boolean;
  canActionButtons: boolean;
  canAnalytics: boolean;
  // Job
  canTrack: boolean;
  canKnow: boolean;
  canFlow: boolean;
  canWork: boolean;
  canDualProfile: boolean;
  canJobFeed: boolean;
  canNetworking: boolean;
  canLiveTranslation: boolean;
  label: string;
  description: string;
  // Extended (subscription system) – included in /accounts/me capabilities
  cloudStorageGB?: number;
  hasBlueBadge?: boolean;
  hasPurpleBadge?: boolean;
  hasAds?: boolean;
  canViewProfileVisitors?: boolean;
  anonymousStoryViewsPerDay?: number;
  canSendToBlockedUsers?: number;
  hasDownloadProtection?: boolean;
  hasVoiceCommands?: 'none' | 'basic' | 'advanced';
  hasTrendingAudio?: boolean;
  hasContentIdeas?: boolean;
  hasContentCalendar?: boolean;
  canRunAds?: boolean;
  maxProducts?: number;
  hasLiveShopping?: boolean;
  hasTeamManagement?: boolean;
  canUseSubscriptions?: boolean;
  canUseBadges?: boolean;
  canUseGifts?: boolean;
  canUseBrandedContent?: boolean;
  hasBrandMarketplace?: boolean;
  hasJobTools?: boolean;
  professionalTools?: string[];
  supportPriority?: 'standard' | 'priority' | 'emergency';
  supportResponseTime?: string;
  nearbyMessagingFreePosts?: number;
  nearbyMessagingFreeMessages?: number;
  nearbyMessagingExtraCost?: number;
}

function mapFullToLegacy(full: FullAccountCapabilities, accountType: AccountType): AccountCapabilities {
  const base: AccountCapabilities = {
    canPost: true,
    canStory: true,
    canReel: true,
    canLive: accountType === 'BUSINESS' || accountType === 'CREATOR',
    canSchedulePosts: full.canSchedulePosts,
    maxLinks: accountType === 'PERSONAL' && full.subscriptionTier !== 'STAR' ? 1 : 5,
    canDm: true,
    canExplore: true,
    canCloseFriends: true,
    canSavedCollections: true,
    canCommerce: accountType === 'BUSINESS',
    canSubscriptions: full.canUseSubscriptions || accountType === 'BUSINESS',
    canBadgesGifts: full.canUseBadges || full.canUseGifts || accountType === 'BUSINESS',
    canBusinessHours: accountType === 'BUSINESS',
    canActionButtons: accountType === 'BUSINESS' || accountType === 'CREATOR',
    canAnalytics: true,
    canTrack: full.hasJobTools,
    canKnow: full.hasJobTools,
    canFlow: full.hasJobTools,
    canWork: full.hasJobTools,
    canDualProfile: full.hasJobTools,
    canJobFeed: full.hasJobTools,
    canNetworking: full.hasJobTools,
    canLiveTranslation: full.hasVoiceCommands !== 'none',
    label: full.accountType === 'PERSONAL' ? (full.subscriptionTier === 'STAR' ? 'Personal (Star)' : 'Personal') : full.accountType,
    description: '',
    cloudStorageGB: full.cloudStorageGB,
    hasBlueBadge: full.hasBlueBadge,
    hasPurpleBadge: full.hasPurpleBadge,
    hasAds: full.hasAds,
    canViewProfileVisitors: full.canViewProfileVisitors,
    anonymousStoryViewsPerDay: full.anonymousStoryViewsPerDay,
    canSendToBlockedUsers: full.canSendToBlockedUsers,
    hasDownloadProtection: full.hasDownloadProtection,
    hasVoiceCommands: full.hasVoiceCommands,
    hasTrendingAudio: full.hasTrendingAudio,
    hasContentIdeas: full.hasContentIdeas,
    hasContentCalendar: full.hasContentCalendar,
    canRunAds: full.canRunAds,
    maxProducts: full.maxProducts,
    hasLiveShopping: full.hasLiveShopping,
    hasTeamManagement: full.hasTeamManagement,
    canUseSubscriptions: full.canUseSubscriptions,
    canUseBadges: full.canUseBadges,
    canUseGifts: full.canUseGifts,
    canUseBrandedContent: full.canUseBrandedContent,
    hasBrandMarketplace: full.hasBrandMarketplace,
    hasJobTools: full.hasJobTools,
    professionalTools: full.professionalTools,
    supportPriority: full.supportPriority,
    supportResponseTime: full.supportResponseTime,
    nearbyMessagingFreePosts: full.nearbyMessagingFreePosts,
    nearbyMessagingFreeMessages: full.nearbyMessagingFreeMessages,
    nearbyMessagingExtraCost: full.nearbyMessagingExtraCost,
  };
  if (accountType === 'PERSONAL') base.description = full.subscriptionTier === 'STAR' ? 'Star: scheduling, insights, close friends, collections' : 'Free: feed, posts, stories, DMs, 1 link';
  else if (accountType === 'BUSINESS') base.description = 'Thick: commerce, live, business hours, action buttons, analytics';
  else if (accountType === 'CREATOR') base.description = full.subscriptionTier === 'THICK' ? 'Creator Paid: live, subscriptions, badges, gifts, full analytics, Blue Badge' : 'Creator Free: live, schedule, basic analytics, 5 links';
  else if (accountType === 'JOB') base.description = 'Track, Know, Flow, dual profile, job feed, networking';
  else base.description = 'Free account';
  return base;
}

export function getCapabilities(
  accountType: AccountType,
  subscriptionTier: SubscriptionTier
): AccountCapabilities {
  const full = getFullCapabilities(accountType, subscriptionTier);
  return mapFullToLegacy(full, accountType);
}

export function canAccessFeature(
  accountType: AccountType,
  subscriptionTier: SubscriptionTier,
  feature: keyof Omit<AccountCapabilities, 'label' | 'description'>
): boolean {
  const cap = getCapabilities(accountType, subscriptionTier);
  return !!cap[feature];
}
