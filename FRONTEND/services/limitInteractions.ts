import { getApiBase, getToken } from './api';

export type LimitInteractionState = {
  commentsFrom: string;
  dmsFrom: string;
  duration: string;
  expiresAt: string | null;
  active: boolean;
};

/** Stored in `commentsFrom` while the tool is configured (not `everyone`). */
export type LimitWhatLevel = 'some' | 'most';

export type LimitWhoFlags = {
  everyoneButClose: boolean;
  recentFollowers: boolean;
  accountsDontFollow: boolean;
};

const WHO_PREFIX = 'who:';

export function parseWhat(commentsFrom: string): LimitWhatLevel {
  if (commentsFrom === 'some' || commentsFrom === 'most') return commentsFrom;
  return 'most';
}

export function parseWho(dmsFrom: string): LimitWhoFlags {
  if (!dmsFrom.startsWith(WHO_PREFIX)) {
    return { everyoneButClose: false, recentFollowers: true, accountsDontFollow: true };
  }
  const rest = dmsFrom.slice(WHO_PREFIX.length);
  const parts = rest.split(',').map((p) => p.trim());
  if (parts.length !== 3) {
    return { everyoneButClose: false, recentFollowers: true, accountsDontFollow: true };
  }
  return {
    everyoneButClose: parts[0] === '1',
    recentFollowers: parts[1] === '1',
    accountsDontFollow: parts[2] === '1',
  };
}

export function encodeWho(flags: LimitWhoFlags): string {
  return `${WHO_PREFIX}${flags.everyoneButClose ? '1' : '0'},${flags.recentFollowers ? '1' : '0'},${flags.accountsDontFollow ? '1' : '0'}`;
}

export const LIMIT_DURATION_OPTIONS = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
] as const;

export function durationLabel(duration: string): string {
  const hit = LIMIT_DURATION_OPTIONS.find((o) => o.value === duration);
  return hit?.label ?? duration;
}

export function summarizeWhat(level: LimitWhatLevel): string {
  return level === 'some'
    ? 'Some interactions (comments & chats from limited accounts hidden)'
    : 'Most interactions (tags, mentions, story replies, remixes, comments, chats)';
}

export function summarizeWho(flags: LimitWhoFlags): string {
  const bits: string[] = [];
  if (flags.everyoneButClose) bits.push('everyone but close friends');
  if (flags.recentFollowers) bits.push('recent followers');
  if (flags.accountsDontFollow) bits.push("accounts that don't follow you");
  return bits.length > 0 ? bits.join(' · ') : 'None selected (change in settings)';
}

export async function fetchLimitInteractions(): Promise<LimitInteractionState> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${getApiBase()}/privacy/limit-interactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to load');
  }
  return data as LimitInteractionState;
}

export async function patchLimitInteractions(
  body: Partial<{ commentsFrom: string; dmsFrom: string; duration: string; active: boolean }>,
): Promise<LimitInteractionState> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${getApiBase()}/privacy/limit-interactions`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to save');
  }
  return data as LimitInteractionState;
}
