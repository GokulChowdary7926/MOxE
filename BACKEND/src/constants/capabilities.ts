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
  // Real-time translation (4.3.1) – paid only
  canLiveTranslation: boolean;
  // Meta
  label: string;
  description: string;
}

export function getCapabilities(
  accountType: AccountType,
  subscriptionTier: SubscriptionTier
): AccountCapabilities {
  const base = {
    canPost: true,
    canStory: true,
    canReel: true,
    canLive: false,
    canSchedulePosts: false,
    maxLinks: 1,
    canDm: true,
    canExplore: true,
    canCloseFriends: false,
    canSavedCollections: false,
    canCommerce: false,
    canSubscriptions: false,
    canBadgesGifts: false,
    canBusinessHours: false,
    canActionButtons: false,
    canAnalytics: false,
    canTrack: false,
    canKnow: false,
    canFlow: false,
    canWork: false,
    canDualProfile: false,
    canJobFeed: false,
    canNetworking: false,
    canLiveTranslation: false,
    label: '',
    description: '',
  };

  switch (accountType) {
    case 'PERSONAL':
      base.label = subscriptionTier === 'STAR' ? 'Personal (Star)' : 'Personal';
      base.description =
        subscriptionTier === 'STAR'
          ? 'Star: scheduling, insights, close friends, collections'
          : 'Free: feed, posts, stories, DMs, 1 link';
      base.canCloseFriends = true;
      base.canSavedCollections = true;
      base.canSchedulePosts = subscriptionTier === 'STAR';
      base.canAnalytics = subscriptionTier === 'STAR';
      base.canLiveTranslation = subscriptionTier === 'STAR';
      if (subscriptionTier === 'STAR') base.maxLinks = 5;
      break;
    case 'BUSINESS':
      base.label = 'Business';
      base.description = 'Thick: commerce, live, business hours, action buttons, analytics';
      base.canLive = true;
      base.canSchedulePosts = true;
      base.canCommerce = true;
      base.canBusinessHours = true;
      base.canActionButtons = true;
      base.canAnalytics = true;
      base.canSubscriptions = true;
      base.canBadgesGifts = true;
      base.maxLinks = 5;
      break;
    case 'CREATOR':
      // Creator includes ALL Personal account features (Guide Section 0: Close Friends, Archive, Highlights, Save & Collections)
      base.label = subscriptionTier === 'THICK' ? 'Creator (Paid)' : 'Creator';
      base.description =
        subscriptionTier === 'THICK'
          ? 'Creator Paid: live, subscriptions, badges, gifts, full analytics, Blue Badge'
          : 'Creator Free: live, schedule, basic analytics, 5 links';
      base.canLive = true;
      base.canSchedulePosts = true;
      base.canAnalytics = true;
      base.maxLinks = 5;
      base.canCloseFriends = true;
      base.canSavedCollections = true;
      base.canSubscriptions = subscriptionTier === 'THICK';
      base.canBadgesGifts = subscriptionTier === 'THICK';
      base.canActionButtons = true;
      base.canLiveTranslation = subscriptionTier === 'THICK';
      break;
    case 'JOB':
      base.label = 'Job';
      base.description = 'Track, Know, Flow, dual profile, job feed, networking';
      base.canTrack = true;
      base.canKnow = true;
      base.canFlow = true;
      base.canWork = true;
      base.canDualProfile = true;
      base.canJobFeed = true;
      base.canNetworking = true;
      base.canSchedulePosts = true;
      base.canSavedCollections = true;
      base.canCloseFriends = true;
      base.maxLinks = 5;
      break;
    default:
      base.label = 'Personal';
      base.description = 'Free account';
  }
  return base;
}

export function canAccessFeature(
  accountType: AccountType,
  subscriptionTier: SubscriptionTier,
  feature: keyof Omit<AccountCapabilities, 'label' | 'description'>
): boolean {
  const cap = getCapabilities(accountType, subscriptionTier);
  return !!cap[feature];
}
