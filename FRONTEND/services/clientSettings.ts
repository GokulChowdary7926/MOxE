import { getApiBase, getToken } from './api';

export type NotificationSections = {
  postsStoriesComments?: Record<string, string>;
  followingFollowers?: Record<string, string>;
  messages?: Record<string, string>;
  email?: Record<string, string>;
  fromMoxe?: Record<string, string>;
  liveReels?: Record<string, string>;
};

export type ClientSettingsData = {
  notifications?: NotificationSections;
  dailyLimit?: string;
  language?: string;
  /** Story defaults stored in JSON (see also account.defaultStoryAllowReplies boolean). */
  story?: {
    repliesAudience?: 'everyone' | 'followers' | 'off';
  };
  /** Preset appearance for direct message conversations (web). */
  dmTheme?: string;
  socialCounts?: {
    hideLikeAndShareCounts?: boolean;
    hideLikeCountOnOwnPosts?: boolean;
  };
  /** Who can comment on your posts (enforced in `POST` comment APIs; separate from per-post “turn off comments”). */
  comments?: {
    allowFrom?: 'everyone' | 'followers' | 'follow_back' | 'off';
  };
  /** Tag / @mention privacy (enforced on post create). */
  tagsAndMentions?: {
    tagsFrom?: 'everyone' | 'following' | 'off';
    mentionsFrom?: 'everyone' | 'following' | 'off';
    manualTagApproval?: boolean;
    allowBoostStoriesFromMentions?: boolean;
    /** Whether approved tagged posts are visible on profile by default. */
    showTaggedOnProfile?: boolean;
  };
  /** Bandwidth, preload, and cache preferences (web client; Reels + uploads respect where applicable). */
  deviceAndData?: {
    dataSaver?: boolean;
    preloadReels?: boolean;
    preloadReelsWifiOnly?: boolean;
    highQualityUploads?: boolean;
    /** Soft cap hint for client-side cache pruning (MB). */
    maxCacheBudgetMb?: number;
  };
  /** Accessibility (web): applied to `document.documentElement` where supported. */
  accessibility?: {
    reduceMotion?: boolean;
    captionsMode?: 'always' | 'translated' | 'never';
    highContrast?: boolean;
    largerText?: boolean;
    disableHdr?: boolean;
  };
  /** Discoverability: contact sync preference (web stores intent; native clients may read the same JSON). */
  contactSync?: {
    enabled?: boolean;
    /** User acknowledged periodic sync / storage disclosure */
    acknowledged?: boolean;
  };
  /** Verified-account UX preferences (MOxE; not third-party “Meta Verified”). */
  verifiedExperience?: {
    prioritySupportChannel?: boolean;
    proactiveMonitoring?: boolean;
  };
};

export async function fetchClientSettings(): Promise<ClientSettingsData> {
  const token = getToken();
  if (!token) return {};
  const res = await fetch(`${getApiBase()}/accounts/me/client-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};
  const data = (await res.json()) as { settings?: ClientSettingsData };
  const s = data.settings ?? {};
  applyClientAccessibilityToDocument(s);
  return s;
}

/** Sync accessibility-related classes on `<html>` (call after fetch or patch). */
export function applyClientAccessibilityToDocument(settings: ClientSettingsData): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const a11y = settings.accessibility;
  root.classList.toggle('moxe-reduce-motion', !!(a11y?.reduceMotion));
  root.classList.toggle('moxe-high-contrast', !!(a11y?.highContrast));
  root.classList.toggle('moxe-larger-text', !!(a11y?.largerText));
}

export async function patchClientSettings(patch: ClientSettingsData): Promise<ClientSettingsData> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${getApiBase()}/accounts/me/client-settings`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  const data = (await res.json()) as { settings?: ClientSettingsData };
  const next = data.settings ?? {};
  applyClientAccessibilityToDocument(next);
  return next;
}
