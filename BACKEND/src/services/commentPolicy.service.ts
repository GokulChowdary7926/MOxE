/**
 * Who can comment on an account's posts (persisted in account.clientSettings.comments.allowFrom).
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type CommentAllowFrom = 'everyone' | 'followers' | 'follow_back' | 'off';

export function readCommentAllowFrom(clientSettings: unknown): CommentAllowFrom {
  const cs =
    clientSettings && typeof clientSettings === 'object' && !Array.isArray(clientSettings)
      ? (clientSettings as Record<string, unknown>)
      : {};
  const raw = cs.comments && typeof cs.comments === 'object' && !Array.isArray(cs.comments)
    ? (cs.comments as Record<string, unknown>).allowFrom
    : undefined;
  const v = typeof raw === 'string' ? raw.toLowerCase().replace(/-/g, '_') : '';
  if (v === 'followers') return 'followers';
  if (v === 'follow_back') return 'follow_back';
  if (v === 'off') return 'off';
  return 'everyone';
}

/** Enforce account-level "who can comment" (separate from per-post allowComments). */
export async function assertMayCommentOnPost(postOwnerId: string, commenterId: string): Promise<void> {
  if (postOwnerId === commenterId) return;
  const row = await prisma.account.findUnique({
    where: { id: postOwnerId },
    select: { clientSettings: true },
  });
  const mode = readCommentAllowFrom(row?.clientSettings);
  if (mode === 'off') {
    throw new AppError('This person does not allow comments on their posts', 403);
  }
  if (mode === 'followers') {
    const followsOwner = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: commenterId, followingId: postOwnerId } },
    });
    if (!followsOwner) {
      throw new AppError('Only people who follow this account can comment', 403);
    }
  }
  if (mode === 'follow_back') {
    const commenterFollowsOwner = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: commenterId, followingId: postOwnerId } },
    });
    const ownerFollowsCommenter = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: postOwnerId, followingId: commenterId } },
    });
    if (!commenterFollowsOwner || !ownerFollowsCommenter) {
      throw new AppError('Only followers you follow back can comment', 403);
    }
  }
}
