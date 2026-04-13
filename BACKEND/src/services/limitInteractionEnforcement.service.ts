/**
 * Runtime enforcement for "Limit interactions" (LimitInteractionSetting).
 * Settings are written from the privacy UI; this module applies them to inbound interactions.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type LimitInteractionKind = 'comment' | 'dm' | 'story_reply' | 'mention_or_tag';

function parseWhat(commentsFrom: string): 'everyone' | 'some' | 'most' {
  if (commentsFrom === 'some' || commentsFrom === 'most') return commentsFrom;
  return 'everyone';
}

export function parseLimitWhoFlags(dmsFrom: string): {
  everyoneButClose: boolean;
  recentFollowers: boolean;
  accountsDontFollow: boolean;
} {
  if (!dmsFrom.startsWith('who:')) {
    return { everyoneButClose: false, recentFollowers: false, accountsDontFollow: false };
  }
  const parts = dmsFrom
    .slice('who:'.length)
    .split(',')
    .map((p) => p.trim());
  if (parts.length !== 3) {
    return { everyoneButClose: false, recentFollowers: false, accountsDontFollow: false };
  }
  return {
    everyoneButClose: parts[0] === '1',
    recentFollowers: parts[1] === '1',
    accountsDontFollow: parts[2] === '1',
  };
}

/** True if actor matches any enabled "who" rule (OR). */
async function actorMatchesLimitedGroup(
  ownerId: string,
  actorId: string,
  flags: ReturnType<typeof parseLimitWhoFlags>,
): Promise<boolean> {
  if (ownerId === actorId) return false;
  if (!flags.everyoneButClose && !flags.recentFollowers && !flags.accountsDontFollow) return false;

  let matched = false;
  if (flags.everyoneButClose) {
    const cf = await prisma.closeFriend.findUnique({
      where: { accountId_friendId: { accountId: ownerId, friendId: actorId } },
    });
    if (!cf) matched = true;
  }
  if (flags.recentFollowers) {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: actorId, followingId: ownerId } },
    });
    if (f) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (f.createdAt >= weekAgo) matched = true;
    }
  }
  if (flags.accountsDontFollow) {
    const ownerFollowsActor = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: ownerId, followingId: actorId } },
    });
    if (!ownerFollowsActor) matched = true;
  }
  return matched;
}

/**
 * When true, the owner is actively limiting this kind of interaction from the actor
 * (comments/DMs: hide; story reply / mentions / tags: reject with 403).
 */
export async function shouldLimitIncomingInteraction(
  ownerAccountId: string,
  actorAccountId: string,
  kind: LimitInteractionKind,
): Promise<boolean> {
  const row = await prisma.limitInteractionSetting.findUnique({
    where: { accountId: ownerAccountId },
  });
  const active = row?.expiresAt ? new Date(row.expiresAt) > new Date() : false;
  if (!active || !row) return false;

  const what = parseWhat(row.commentsFrom);
  if (what === 'everyone') return false;

  if (kind === 'story_reply' || kind === 'mention_or_tag') {
    if (what !== 'most') return false;
  }

  const flags = parseLimitWhoFlags(row.dmsFrom);
  return actorMatchesLimitedGroup(ownerAccountId, actorAccountId, flags);
}

export async function assertNotLimitedIncomingInteraction(
  ownerAccountId: string,
  actorAccountId: string,
  kind: LimitInteractionKind,
): Promise<void> {
  if (await shouldLimitIncomingInteraction(ownerAccountId, actorAccountId, kind)) {
    throw new AppError('This person is limiting interactions from accounts like yours right now.', 403);
  }
}
