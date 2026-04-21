import { NoteType, Prisma, SubscriptionTier } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { canViewByAudience, getNoteLimits } from '../utils/noteUtils';
import { addAccountActivityLog } from './activity.service';
import { normalizeNoteContentJsonForApi } from '../utils/mediaUrl';

function contentMatchesHiddenWords(content: string, words: string[]): boolean {
  const lower = content.toLowerCase();
  return words.some((w) => typeof w === 'string' && w.length > 0 && lower.includes(w.toLowerCase()));
}

function contentMatchesRegex(content: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (!p) return false;
    try {
      return new RegExp(p, 'i').test(content);
    } catch {
      return false;
    }
  });
}

function parseHiddenWordsConfig(raw: unknown): { regexPatterns: string[]; allowListAccountIds: string[] } {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  return {
    regexPatterns: Array.isArray(obj.regexPatterns) ? obj.regexPatterns.filter((x): x is string => typeof x === 'string') : [],
    allowListAccountIds: Array.isArray(obj.allowListAccountIds) ? obj.allowListAccountIds.filter((x): x is string => typeof x === 'string') : [],
  };
}

export class NoteService {
  private async assertPassesAuthorFilter(authorAccountId: string, content: Record<string, unknown>): Promise<void> {
    const account = await prisma.account.findUnique({
      where: { id: authorAccountId },
      select: { hiddenWordsCommentFilter: true, hiddenWords: true, clientSettings: true },
    });
    if (!account?.hiddenWordsCommentFilter) return;
    const words = Array.isArray(account.hiddenWords) ? account.hiddenWords.filter((x): x is string => typeof x === 'string') : [];
    const cfg = parseHiddenWordsConfig(
      (account.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
    );
    const noteText = typeof content.text === 'string' ? content.text : '';
    const pollOptions = Array.isArray((content as any).poll?.options)
      ? ((content as any).poll.options as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];
    const corpus = [noteText, ...pollOptions].join(' ').trim();
    if (!corpus) return;
    if (contentMatchesHiddenWords(corpus, words) || contentMatchesRegex(corpus, cfg.regexPatterns)) {
      await addAccountActivityLog(authorAccountId, {
        type: 'hidden_word_filter_note',
        title: 'Note blocked',
        description: 'A note was blocked by your Hidden words filter.',
        metadata: { at: new Date().toISOString() },
      });
      throw new AppError('Note content contains hidden words blocked by your safety settings', 400);
    }
  }

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
    await this.assertPassesAuthorFilter(input.accountId, input.content);

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
    return { ...note, contentJson: await normalizeNoteContentJsonForApi(note.contentJson) };
  }

  async listVisibleNotes(viewerAccountId: string) {
    const [following, followers, closeFriendAuthors] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: viewerAccountId }, select: { followingId: true } }),
      prisma.follow.findMany({ where: { followingId: viewerAccountId }, select: { followerId: true } }),
      prisma.closeFriend.findMany({ where: { friendId: viewerAccountId }, select: { accountId: true } }),
    ]);
    const followingSet = new Set(following.map((f) => f.followingId));
    const followersSet = new Set(followers.map((f) => f.followerId));
    const closeFriendAuthorsSet = new Set(closeFriendAuthors.map((f) => f.accountId));

    const now = new Date();
    const notes = await prisma.note.findMany({
      where: { status: 'ACTIVE', deletedAt: null, publishAt: { lte: now }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        account: { select: { id: true, username: true, profilePhoto: true } },
        likes: { select: { accountId: true } },
        pollVotes: { select: { accountId: true, option: true } },
      },
    });

    const filtered = notes.filter((note) => {
      if (note.accountId === viewerAccountId) return true;
      const audienceType = (note.audienceJson as { type?: string } | null)?.type;
      const isMutual = followingSet.has(note.accountId) && followersSet.has(note.accountId);
      const isCloseFriend = closeFriendAuthorsSet.has(note.accountId);
      return canViewByAudience(audienceType, isMutual, isCloseFriend);
    });
    return Promise.all(
      filtered.map(async (note) => ({
        ...note,
        contentJson: await normalizeNoteContentJsonForApi(note.contentJson),
      })),
    );
  }

  async getMyActiveNote(accountId: string) {
    const now = new Date();
    const note = await prisma.note.findFirst({
      where: { accountId, status: 'ACTIVE', deletedAt: null, publishAt: { lte: now }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, profilePhoto: true } },
        likes: true,
        pollVotes: { select: { accountId: true, option: true } },
      },
    });
    if (!note) return null;
    return { ...note, contentJson: await normalizeNoteContentJsonForApi(note.contentJson) };
  }

  async deleteNote(noteId: string, accountId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, accountId } });
    if (!note) throw new AppError('Note not found', 404);
    await prisma.note.update({
      where: { id: noteId },
      data: { status: 'DELETED', deletedAt: new Date(), deletedBy: accountId },
    });
  }

  async likeNote(noteId: string, accountId: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.status !== 'ACTIVE' || note.deletedAt) throw new AppError('Note not found', 404);
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
    if (!note || note.status !== 'ACTIVE' || note.deletedAt || note.type !== 'POLL') {
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
