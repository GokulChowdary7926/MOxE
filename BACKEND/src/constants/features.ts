/**
 * Shared feature definitions for MOxE accounts – backend side.
 * Mirrors FRONTEND/constants/accountFeatures.ts so both layers talk about the same features.
 */

import type { AccountType } from './capabilities';

export type FeatureKey =
  | 'feed'
  | 'posts'
  | 'stories'
  | 'reels'
  | 'live'
  | 'dm'
  | 'explore'
  | 'closeFriends'
  | 'savedCollections'
  | 'scheduledPosts'
  | 'links'
  | 'commerce'
  | 'subscriptions'
  | 'badgesGifts'
  | 'businessHours'
  | 'actionButtons'
  | 'analytics'
  | 'track'
  | 'know'
  | 'flow'
  | 'dualProfile'
  | 'jobFeed'
  | 'networking'
  | 'liveTranslation';

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
}

/** MOxE Basic features that every account has conceptually. */
export const COMMON_BASIC_FEATURES: FeatureDefinition[] = [
  {
    key: 'feed',
    name: 'Feed',
    description: 'Home feed with posts from people you follow and suggested content.',
  },
  {
    key: 'posts',
    name: 'Posts',
    description: 'Photo and video posts with captions, tags, and basic insights.',
  },
  {
    key: 'stories',
    name: 'Stories',
    description: '24‑hour stories with archive, highlights, and Close Friends support.',
  },
  {
    key: 'reels',
    name: 'Reels',
    description: 'Short‑form vertical video with audio, effects, and remix tools.',
  },
  {
    key: 'dm',
    name: 'Direct Messages',
    description: 'One‑to‑one and group chats, media sharing, and message requests.',
  },
  {
    key: 'explore',
    name: 'Explore',
    description: 'Discovery surface for accounts, posts, reels, and topics.',
  },
];

/** Per‑account‑type feature groups, on top of MOxE Basic. */
export const ACCOUNT_FEATURE_GROUPS: Record<AccountType, FeatureDefinition[]> = {
  PERSONAL: [
    {
      key: 'closeFriends',
      name: 'Close Friends',
      description: 'Private story audience list for more personal sharing.',
    },
    {
      key: 'savedCollections',
      name: 'Saved & Collections',
      description: 'Save posts into private collections and revisit them later.',
    },
    {
      key: 'scheduledPosts',
      name: 'Scheduled posts',
      description: 'Plan posts in advance and let MOxE publish on your schedule (Star tier).',
    },
    {
      key: 'analytics',
      name: 'Insights',
      description: 'Basic insights for reach, engagement, and follower growth (Star tier).',
    },
  ],
  BUSINESS: [
    {
      key: 'commerce',
      name: 'Commerce',
      description: 'Catalog, product tagging, carts, orders, and checkout integrations.',
    },
    {
      key: 'live',
      name: 'Live',
      description: 'Go live with products, comments, pinned messages, and co‑hosts.',
    },
    {
      key: 'businessHours',
      name: 'Business hours',
      description: 'Show open hours, location, and contact options on your profile.',
    },
    {
      key: 'actionButtons',
      name: 'Action buttons',
      description: 'Profile buttons like Book, Reserve, Call, Email, and Directions.',
    },
    {
      key: 'analytics',
      name: 'Business analytics',
      description: 'Deeper analytics for posts, reels, stories, and conversions.',
    },
    {
      key: 'subscriptions',
      name: 'Subscriptions',
      description: 'Offer paid subscriber content, perks, and VIP chats.',
    },
    {
      key: 'badgesGifts',
      name: 'Badges & gifts',
      description: 'Receive badges and gifts during live and creator interactions.',
    },
  ],
  CREATOR: [
    {
      key: 'live',
      name: 'Live',
      description: 'Creator‑focused live tools with co‑hosts, Q&A, and moderation.',
    },
    {
      key: 'scheduledPosts',
      name: 'Scheduled posts',
      description: 'Plan reels, posts, and live reminders across time zones.',
    },
    {
      key: 'analytics',
      name: 'Creator analytics',
      description: 'Audience, content, and revenue analytics for creators.',
    },
    {
      key: 'subscriptions',
      name: 'Subscriptions',
      description: 'Paid subscriptions for exclusive content and chats (Paid tier).',
    },
    {
      key: 'badgesGifts',
      name: 'Badges & gifts',
      description: 'Earn gifts and badges during live and content interactions.',
    },
    {
      key: 'actionButtons',
      name: 'Action buttons',
      description: 'Contact, sponsor, and external platform links on profile.',
    },
    {
      key: 'liveTranslation',
      name: 'Live translation',
      description: 'Real‑time translation captions on live and reels (Paid tier).',
    },
  ],
  JOB: [
    {
      key: 'track',
      name: 'Track',
      description: 'Pipeline for job applications, interviews, and offers.',
    },
    {
      key: 'know',
      name: 'Know',
      description: 'Insights about companies, roles, and application performance.',
    },
    {
      key: 'flow',
      name: 'Flow',
      description: 'Workflow tools to move opportunities from applied to hired.',
    },
    {
      key: 'dualProfile',
      name: 'Dual profile',
      description: 'Public social profile plus professional job profile.',
    },
    {
      key: 'jobFeed',
      name: 'Job feed',
      description: 'Curated feed of jobs and projects matched to your skills.',
    },
    {
      key: 'networking',
      name: 'Networking',
      description: 'People discovery, introductions, and professional messaging.',
    },
  ],
};

