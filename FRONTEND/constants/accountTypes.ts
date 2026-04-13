/**
 * MOxE account types and capabilities (mirrors backend).
 * Used for UI: nav, route guards, profile/settings forms.
 */

export const ACCOUNT_TYPES = ['PERSONAL', 'BUSINESS', 'CREATOR', 'JOB'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const SUBSCRIPTION_TIERS = ['FREE', 'STAR', 'THICK'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export interface AccountCapabilities {
  canPost: boolean;
  canStory: boolean;
  canReel: boolean;
  canLive: boolean;
  canSchedulePosts: boolean;
  maxLinks: number;
  canDm: boolean;
  canExplore: boolean;
  canCloseFriends: boolean;
  canSavedCollections: boolean;
  canCommerce: boolean;
  canSubscriptions: boolean;
  canBadgesGifts: boolean;
  canBusinessHours: boolean;
  canActionButtons: boolean;
  canAnalytics: boolean;
  canAds: boolean;
  canTrack: boolean;
  canKnow: boolean;
  canFlow: boolean;
  canDualProfile: boolean;
  canJobFeed: boolean;
  canNetworking: boolean;
  label: string;
  description: string;
  /** Extended (from /accounts/me capabilities) */
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

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  PERSONAL: 'Personal',
  BUSINESS: 'Business',
  CREATOR: 'Creator',
  JOB: 'Job',
};

/** Home route after login/signup by account type. Personal = feed, Business = dashboard, Creator = studio, Job = job tools. */
export function getHomeRouteForAccountType(accountType: string | null | undefined): string {
  const t = (accountType || '').toUpperCase();
  if (t === 'JOB') return '/job';
  if (t === 'BUSINESS') return '/business-dashboard';
  if (t === 'CREATOR') return '/creator-studio';
  return '/'; // PERSONAL or unknown
}

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  STAR: 'Star',
  THICK: 'Thick',
};

/** Default capabilities – all core features free (no subscription). */
export const DEFAULT_CAPABILITIES: AccountCapabilities = {
  canPost: true,
  canStory: true,
  canReel: true,
  canLive: false,
  canSchedulePosts: true,
  maxLinks: 5,
  canDm: true,
  canExplore: true,
  canCloseFriends: true,
  canSavedCollections: true,
  canCommerce: false,
  canSubscriptions: false,
  canBadgesGifts: false,
  canBusinessHours: false,
  canActionButtons: false,
  canAnalytics: true,
  canAds: false,
  canTrack: false,
  canKnow: false,
  canFlow: false,
  canDualProfile: false,
  canJobFeed: false,
  canNetworking: false,
  label: 'Personal',
  description: 'Free account',
};
