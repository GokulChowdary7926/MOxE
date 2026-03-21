import { NoteType, Prisma, SubscriptionTier } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { canViewByAudience, getNoteLimits } from '../utils/noteUtils';

export class NoteService {
  async createNote(input: {
    accountId: string;
    accountType: 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB';
    tier: SubscriptionTier;
    type: NoteType;
    content: Record<string, unknown>;
    appearance?: Record<string, unknown> | null;
    audience?: { type?: string };
    scheduleAt?: Date;
  }) {
    const limits = getNoteLimits(input.tier);
    const text = typeof input.content?.text === 'string' ? input.content.text : '';
    if (input.type === 'TEXT' && text.length > limits.charLimit) {
      throw new AppError(`Character limit exceeded. Max ${limits.charLimit} characters.`, 400);
    }

    const now = new Date();
    if (input.scheduleAt && !limits.canSchedule) {
      throw new AppError('Scheduling notes requires Star or Thick tier', 403);
    }

    if (input.scheduleAt) {
      const scheduled = await prisma.note.count({
        where: { accountId: input.accountId, status: 'SCHEDULED', publishAt: { gt: now } },
      });
      if (scheduled >= limits.maxScheduledNotes) {
        throw new AppError(`You can only schedule up to ${limits.maxScheduledNotes} notes.`, 400);
      }
    } else {
      const active = await prisma.note.count({
        where: { accountId: input.accountId, status: 'ACTIVE', publishAt: { lte: now }, expiresAt: { gt: now } },
      });
      if (active >= limits.maxActiveNotes) {
        throw new AppError('You already have an active note. Delete it first.', 400);
      }
    }

    const publishAt = input.scheduleAt ?? now;
    const expiresAt = new Date(publishAt.getTime() + limits.durationHours * 60 * 60 * 1000);
    const note = await prisma.note.create({
      data: {
        accountId: input.accountId,
        accountType: input.accountType,
        tier: input.tier,
        type: input.type,
        contentJson: input.content as Prisma.InputJsonValue,
        appearanceJson: input.appearance ? (input.appearance as Prisma.InputJsonValue) : Prisma.JsonNull,
        audienceJson: { type: input.audience?.type ?? 'mutual' },
        publishAt,
        expiresAt,
        status: input.scheduleAt && publishAt > now ? 'SCHEDULED' : 'ACTIVE',
      },
      include: {
        account: { select: { id: true, username: true, profilePhoto: true } },
        likes: true,
        pollVotes: { select: { accountId: true, option: true } },
      },
    });

    if (input.tier !== 'FREE') {
      await prisma.noteAnalytics.create({ data: { noteId: note.id } });
    }
    return note;
  }

  async listVisibleNotes(viewerAccountId: string) {
    const [following, followers, closeFriends] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: viewerAccountId }, select: { followingId: true } }),
      prisma.follow.findMany({ where: { followingId: viewerAccountId }, select: { followerId: true } }),
      prisma.closeFriend.findMany({ where: { accountId: viewerAccountId }, select: { friendId: true } }),
    ]);
    const followingSet = new Set(following.map((f) => f.followingId));
    const followersSet = new Set(followers.map((f) => f.followerId));
    const closeFriendsSet = new Set(closeFriends.map((f) => f.friendId));

    const now = new Date();
    const notes = await prisma.note.findMany({
      where: { status: 'ACTIVE', publishAt: { lte: now }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        account: { select: { id: true, username: true, profilePhoto: true } },
        likes: { select: { accountId: true } },
        pollVotes: { select: { accountId: true, option: true } },
      },
    });

    return notes.filter((note) => {
      if (note.accountId === viewerAccountId) return true;
      const audienceType = (note.audienceJson as { type?: string } | null)?.type;
      const isMutual = followingSet.has(note.accountId) && followersSet.has(note.accountId);
      const isCloseFriend = closeFriendsSet.has(note.accountId);
      return canViewByAudience(audienceType, isMutual, isCloseFriend);
    });
  }

  async getMyActiveNote(accountId: string) {
    const now = new Date();
    return prisma.note.findFirst({
      where: { accountId, status: 'ACTIVE', publishAt: { lte: now }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, profilePhoto: true } },
        likes: true,
        pollVotes: { select: { accountId: true, option: true } },
      },
    });
  }

  async deleteNote(noteId: string, accountId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, accountId } });
    if (!note) throw new AppError('Note not found', 404);
    await prisma.note.update({ where: { id: noteId }, data: { status: 'DELETED' } });
  }

  async likeNote(noteId: string, accountId: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.status !== 'ACTIVE') throw new AppError('Note not found', 404);
    const existing = await prisma.noteLike.findUnique({ where: { noteId_accountId: { noteId, accountId } } });
    if (existing) throw new AppError('Already liked this note', 400);
    await prisma.noteLike.create({ data: { noteId, accountId } });
    if (note.accountId !== accountId) {
      await prisma.notification.create({
        data: {
          recipientId: note.accountId,
          senderId: accountId,
          type: 'NOTE_LIKE',
          content: 'liked your note',
          data: { noteId },
        },
      });
    }
  }

  async votePoll(noteId: string, accountId: string, option: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.status !== 'ACTIVE' || note.type !== 'POLL') {
      throw new AppError('Invalid poll note', 400);
    }
    const poll = (note.contentJson as { poll?: { expiresAt?: string } } | null)?.poll;
    if (poll?.expiresAt && new Date(poll.expiresAt) < new Date()) {
      throw new AppError('Poll has expired', 400);
    }
    const existing = await prisma.notePollVote.findUnique({ where: { noteId_accountId: { noteId, accountId } } });
    if (existing) throw new AppError('Already voted', 400);
    await prisma.notePollVote.create({ data: { noteId, accountId, option } });
  }

  async getAnalytics(noteId: string, accountId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, accountId },
      include: {
        likes: true,
        pollVotes: true,
        analytics: true,
      },
    });
    if (!note) throw new AppError('Note not found', 404);
    const limits = getNoteLimits(note.tier);
    if (!limits.canAnalytics) throw new AppError('Analytics require Star or Thick tier', 403);
    const impressions = note.analytics?.impressions ?? 0;
    const likes = note.likes.length;
    const replies = note.pollVotes.length;
    const engagementRate = impressions > 0 ? ((likes + replies) / impressions) * 100 : 0;
    return {
      impressions,
      uniqueImpressions: note.analytics?.uniqueImpressions ?? 0,
      likes,
      replies,
      engagementRate: Number(engagementRate.toFixed(1)),
      likeRate: Number((impressions > 0 ? (likes / impressions) * 100 : 0).toFixed(1)),
      replyRate: Number((impressions > 0 ? (replies / impressions) * 100 : 0).toFixed(1)),
      isPromoted: (note.analytics?.promotionBudget ?? 0) > 0,
      promotionImpressions: note.analytics?.promotionImpressions ?? 0,
    };
  }

  async scheduleNote(noteId: string, accountId: string, publishAt: Date) {
    const note = await prisma.note.findFirst({ where: { id: noteId, accountId } });
    if (!note) throw new AppError('Note not found', 404);
    const limits = getNoteLimits(note.tier);
    if (!limits.canSchedule) throw new AppError('Scheduling requires Star or Thick tier', 403);
    if (publishAt <= new Date()) throw new AppError('publishAt must be in the future', 400);
    const expiresAt = new Date(publishAt.getTime() + limits.durationHours * 60 * 60 * 1000);
    await prisma.note.update({
      where: { id: noteId },
      data: { publishAt, expiresAt, status: 'SCHEDULED' },
    });
  }

  async processDueStatusTransitions() {
    const now = new Date();
    const [expired, published] = await Promise.all([
      prisma.note.updateMany({
        where: { status: 'ACTIVE', expiresAt: { lt: now } },
        data: { status: 'EXPIRED' },
      }),
      prisma.note.updateMany({
        where: { status: 'SCHEDULED', publishAt: { lte: now } },
        data: { status: 'ACTIVE' },
      }),
    ]);
    return { expired: expired.count, published: published.count };
  }
}
