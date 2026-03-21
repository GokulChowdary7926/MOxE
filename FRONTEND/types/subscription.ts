/**
 * MOxE subscription & account types (aligned with backend tier capabilities).
 */

export enum AccountType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  CREATOR = 'CREATOR',
  JOB = 'JOB',
}

/** Effective tier keys used by API and capability lookup */
export type EffectiveTierKey =
  | 'PERSONAL_FREE'
  | 'PERSONAL_STAR'
  | 'BUSINESS_FREE'
  | 'BUSINESS_PAID'
  | 'CREATOR_FREE'
  | 'CREATOR_PAID'
  | 'JOB_FREE'
  | 'JOB_PAID';

export enum SubscriptionTier {
  FREE = 'FREE',
  STAR = 'STAR',
  BUSINESS_FREE = 'BUSINESS_FREE',
  BUSINESS_PAID = 'BUSINESS_PAID',
  CREATOR_FREE = 'CREATOR_FREE',
  CREATOR_PAID = 'CREATOR_PAID',
  JOB_PAID = 'JOB_PAID',
}

export type VoiceCommandLevel = 'none' | 'basic' | 'advanced';
export type SupportPriority = 'standard' | 'priority' | 'emergency';

export interface AccountCapabilities {
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
  nearbyMessagingFreeMessages?: number;
  nearbyMessagingExtraCost: number;
}

export interface Account {
  id: string;
  phone?: string;
  email?: string;
  username: string;
  displayName?: string;
  profilePhoto?: string | null;
  accountType: AccountType | string;
  subscriptionTier: string;
  capabilities?: AccountCapabilities | null;
}
