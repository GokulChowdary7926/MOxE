import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { getIo, emitStoriesNew } from '../sockets';
import { AppError } from '../utils/AppError';

const DEFAULT_DURATION_HOURS = 24;

export class StoryService {
  async create(accountId: string, data: {
    media: string | unknown;
    type?: string;
    privacy?: string;
    isCloseFriendsOnly?: boolean;
    allowReplies?: boolean;
    allowReshares?: boolean;
    screenshotProtection?: boolean;
    isMature?: boolean;
    stickers?: unknown;
    textOverlay?: unknown;
    drawings?: unknown;
    addYoursParentId?: string | null;
    productTags?: { productId: string; x?: number; y?: number }[];
    isSubscriberOnly?: boolean;
    subscriberTierKeys?: string[] | null;
    isScheduled?: boolean;
    scheduledFor?: string;
  }) {
    // Normalize media: accept string URL or web shape [{ url }] or { url }
    let mediaUrl: string;
    if (typeof data.media === 'string') {
      mediaUrl = data.media;
    } else if (Array.isArray(data.media) && (data.media[0] as { url?: string } | undefined)?.url) {
      mediaUrl = String((data.media[0] as { url: string }).url);
    } else if (data.media && typeof (data.media as any).url === 'string') {
      mediaUrl = String((data.media as { url: string }).url);
    } else {
      throw new AppError('Invalid media', 400);
    }

    if (!/^https?:\/\//.test(mediaUrl)) {
      throw new AppError('Invalid media URL', 400);
    }

    const isScheduled = data.isScheduled ?? false;
    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    const expiresAt = new Date();
    if (isScheduled && scheduledFor) {
      expiresAt.setTime(scheduledFor.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
    } else {
      expiresAt.setHours(expiresAt.getHours() + DEFAULT_DURATION_HOURS);
    }
    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';
    let allowReplies = data.allowReplies;
    let allowReshares = data.allowReshares;
    if (allowReplies === undefined || allowReshares === undefined) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { defaultStoryAllowReplies: true, defaultStoryAllowReshares: true },
      });
      if (allowReplies === undefined) allowReplies = account?.defaultStoryAllowReplies ?? true;
      if (allowReshares === undefined) allowReshares = account?.defaultStoryAllowReshares ?? true;
    }
    const productTags = Array.isArray(data.productTags) ? data.productTags.slice(0, 5) : [];
    if (productTags.length > 0) {
      const productIds = [...new Set(productTags.map((t: { productId: string }) => t.productId))];
      const owned = await prisma.product.findMany({
        where: { id: { in: productIds }, accountId },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((p) => p.id));
      const invalid = productIds.filter((id: string) => !ownedIds.has(id));
      if (invalid.length > 0) throw new AppError('Invalid or unauthorized product in productTags', 400);
    }
    const story = await prisma.story.create({
      data: {
        accountId,
        media: mediaUrl,
        type: (data.type || 'photo').slice(0, 20),
        duration: DEFAULT_DURATION_HOURS,
        expiresAt,
        privacy,
        isCloseFriendsOnly: data.isCloseFriendsOnly ?? false,
        allowReplies: !!allowReplies,
        allowReshares: !!allowReshares,
        screenshotProtection: data.screenshotProtection ?? false,
        isMature: data.isMature ?? false,
        stickers: (data.stickers as any) ?? [],
        textOverlay: (data.textOverlay as any) ?? Prisma.JsonNull,
        drawings: (data.drawings as any) ?? Prisma.JsonNull,
        addYoursParentId: data.addYoursParentId ?? undefined,
        isSubscriberOnly: data.isSubscriberOnly ?? false,
        subscriberTierKeys: data.subscriberTierKeys ? (data.subscriberTierKeys as any) : null,
        isScheduled,
        scheduledFor: scheduledFor ?? undefined,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (productTags.length > 0) {
      await prisma.productTag.createMany({
        data: productTags.map((t: { productId: string; x?: number; y?: number }) => ({
          productId: t.productId,
          storyId: story.id,
          postId: null,
          reelId: null,
          x: t.x ?? null,
          y: t.y ?? null,
        })),
      });
    }
    emitStoriesNew();
    return story;
  }

  async listForFeed(accountId: string) {
    const following = await prisma.follow.findMany({
      where: { followerId: accountId },
      select: { followingId: true },
    }).then((r) => r.map((x) => x.followingId));
    const accountIds = [...new Set([accountId, ...following])];
    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true, expiresAt: true },
    }).then((r) => r.filter((x) => x.expiresAt == null || x.expiresAt > new Date()).map((x) => x.blockedId));
    const allowed = accountIds.filter((id) => !blocked.includes(id));

    const viewerAccount = await prisma.account.findUnique({
      where: { id: accountId },
      select: { user: { select: { dateOfBirth: true } } },
    });
    const viewerIsMinor = viewerAccount?.user?.dateOfBirth
      ? (Date.now() - new Date(viewerAccount.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) < 18
      : false;

    const subscribedCreatorIds = await prisma.subscription
      .findMany({
        where: { subscriberId: accountId, status: 'ACTIVE' },
        select: { creatorId: true },
      })
      .then((r) => r.map((x) => x.creatorId));

    const now = new Date();
    const stories = await prisma.story.findMany({
      where: {
        accountId: { in: allowed },
        expiresAt: { gt: now },
        privacy: 'PUBLIC',
        ...(viewerIsMinor ? { isMature: false } : {}),
        AND: [
          { OR: [ { isScheduled: false }, { isScheduled: true, scheduledFor: { lte: now } } ] },
          { OR: [ { isSubscriberOnly: false }, { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } } ] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    const byAccount = new Map<string, { accountId: string; account: typeof stories[0]['account']; stories: typeof stories }>();
    for (const s of stories) {
      if (!byAccount.has(s.accountId)) {
        byAccount.set(s.accountId, {
          accountId: s.accountId,
          account: s.account,
          stories: [],
        });
      }
      byAccount.get(s.accountId)!.stories.push(s);
    }
    return Array.from(byAccount.values());
  }

  /** Create a story that shares a post (type "share", stickers include postId). */
  async createShareStory(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, media: true, accountId: true },
    });
    if (!post) throw new AppError('Post not found', 404);
    const mediaArr = Array.isArray(post.media) ? post.media : [];
    const firstMedia = mediaArr[0];
    const mediaUrl = typeof firstMedia === 'object' && firstMedia && 'url' in firstMedia
      ? String((firstMedia as { url?: string }).url)
      : typeof firstMedia === 'string'
        ? firstMedia
        : '';
    const storyMedia = mediaUrl || 'https://via.placeholder.com/400x600?text=Shared+post';
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + DEFAULT_DURATION_HOURS);
    const stickers = [{ type: 'post', postId }];
    const story = await prisma.story.create({
      data: {
        accountId,
        media: storyMedia,
        type: 'share',
        duration: DEFAULT_DURATION_HOURS,
        expiresAt,
        privacy: 'PUBLIC',
        isCloseFriendsOnly: false,
        allowReplies: true,
        allowReshares: true,
        stickers: stickers as object,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    await prisma.share.create({
      data: { accountId, postId, sharedTo: 'STORY', storyId: story.id },
    });
    emitStoriesNew();
    return story;
  }

  async likeStory(accountId: string, storyId: string): Promise<{ liked: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    await prisma.storyLike.upsert({
      where: { storyId_accountId: { storyId, accountId } },
      create: { storyId, accountId },
      update: {},
    });
    return { liked: true };
  }

  async unlikeStory(accountId: string, storyId: string): Promise<{ liked: false }> {
    await prisma.storyLike.deleteMany({ where: { storyId, accountId } });
    return { liked: false };
  }

  async getStoryLikeStatus(accountId: string, storyId: string): Promise<{ liked: boolean }> {
    const like = await prisma.storyLike.findUnique({
      where: { storyId_accountId: { storyId, accountId } },
    });
    return { liked: !!like };
  }

  async listStoryLikes(accountId: string, storyId: string): Promise<{ items: { id: string; username: string; displayName: string | null; profilePhoto: string | null }[] }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    // Basic privacy: only story owner can see full like list for now
    if (story.accountId !== accountId) throw new AppError('Forbidden', 403);
    const likes = await prisma.storyLike.findMany({
      where: { storyId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });
    return {
      items: likes.map((l) => ({
        id: l.account.id,
        username: l.account.username,
        displayName: l.account.displayName,
        profilePhoto: l.account.profilePhoto,
      })),
    };
  }

  /** Record that a story was viewed. If anonymous=true and viewer is Star, don't record viewerId and use anonymous quota (2/day). */
  async recordView(viewerId: string, storyId: string, anonymous = false): Promise<void> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) return;
    const account = await prisma.account.findUnique({
      where: { id: viewerId },
      select: { subscriptionTier: true, anonymousStoryViewsUsed: true, anonymousStoryViewsResetAt: true },
    });
    if (!account) return;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const resetAt = account.anonymousStoryViewsResetAt;
    if (!resetAt || resetAt < startOfToday) {
      await prisma.account.update({
        where: { id: viewerId },
        data: { anonymousStoryViewsUsed: 0, anonymousStoryViewsResetAt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) },
      });
    }

    if (anonymous && account.subscriptionTier === 'STAR') {
      const acc = await prisma.account.findUnique({
        where: { id: viewerId },
        select: { anonymousStoryViewsUsed: true, anonymousStoryViewsResetAt: true },
      });
      const used = acc?.anonymousStoryViewsUsed ?? 0;
      if (used >= 2) return;
      await prisma.account.update({
        where: { id: viewerId },
        data: { anonymousStoryViewsUsed: used + 1 },
      });
      await prisma.story.update({
        where: { id: storyId },
        data: { viewedCount: { increment: 1 } },
      });
      return;
    }

    await prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });
    await prisma.story.update({
      where: { id: storyId },
      data: { viewedCount: { increment: 1 } },
    });
  }

  /** Get remaining anonymous story views for the day (Star only). */
  async getAnonymousViewsRemaining(accountId: string): Promise<{ remaining: number }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true, anonymousStoryViewsUsed: true, anonymousStoryViewsResetAt: true },
    });
    if (!account || account.subscriptionTier !== 'STAR') return { remaining: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (account.anonymousStoryViewsResetAt && account.anonymousStoryViewsResetAt < startOfToday) {
      return { remaining: 2 };
    }
    const used = account.anonymousStoryViewsUsed ?? 0;
    return { remaining: Math.max(0, 2 - used) };
  }

  /** Vote on a poll sticker. Sticker at stickerIndex must be type 'poll' with options array. */
  async votePoll(accountId: string, storyId: string, stickerIndex: number, optionIndex: number): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) throw new AppError('Story not found', 404);
    const stickers = (story.stickers as unknown[]) || [];
    const sticker = stickers[stickerIndex];
    if (!sticker || (sticker as { type?: string }).type !== 'poll') throw new AppError('Invalid poll sticker', 400);
    const options = (sticker as { options?: string[] }).options || [];
    if (optionIndex < 0 || optionIndex >= options.length) throw new AppError('Invalid option', 400);
    await prisma.storyPollVote.upsert({
      where: {
        storyId_accountId_stickerIndex: { storyId, accountId, stickerIndex },
      },
      create: { storyId, accountId, stickerIndex, optionIndex },
      update: { optionIndex },
    });
    const io = getIo();
    if (io) {
      const results = await this.getPollResults(accountId, storyId);
      const match = results.results.find((r) => r.stickerIndex === stickerIndex);
      if (match) {
        io.emit('storyPollUpdated', {
          type: 'storyPollUpdated',
          storyId,
          stickerIndex,
          optionCounts: match.optionCounts,
        });
      }
    }
    return { ok: true };
  }

  /** Get poll results for a story (option counts and current user's vote per poll sticker). */
  async getPollResults(accountId: string, storyId: string): Promise<{ results: { stickerIndex: number; optionCounts: number[]; userVote?: number }[] }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return { results: [] };
    const stickers = (story.stickers as unknown[]) || [];
    const votes = await prisma.storyPollVote.findMany({
      where: { storyId },
    });
    const results: { stickerIndex: number; optionCounts: number[]; userVote?: number }[] = [];
    for (let i = 0; i < stickers.length; i++) {
      const s = stickers[i] as { type?: string; options?: string[] };
      if (s?.type !== 'poll' || !Array.isArray(s.options)) continue;
      const optionCounts = s.options.map(() => 0);
      const stickerVotes = votes.filter((v) => v.stickerIndex === i);
      let userVote: number | undefined;
      for (const v of stickerVotes) {
        if (v.optionIndex >= 0 && v.optionIndex < optionCounts.length) optionCounts[v.optionIndex]++;
        if (v.accountId === accountId) userVote = v.optionIndex;
      }
      results.push({ stickerIndex: i, optionCounts, userVote });
    }
    return { results };
  }

  /** Add a countdown reminder for the viewer; notifyAt is when to send the notification. */
  async addReminder(accountId: string, storyId: string, notifyAt: Date, eventName?: string): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) throw new AppError('Story not found', 404);
    if (notifyAt <= new Date()) throw new AppError('Reminder time must be in the future', 400);
    await prisma.storyReminder.upsert({
      where: {
        storyId_accountId: { storyId, accountId },
      },
      create: { accountId, storyId, notifyAt, eventName: eventName ?? null },
      update: { notifyAt, eventName: eventName ?? null },
    });
    return { ok: true };
  }

  /** Process due reminders: create notifications and delete reminders. Call periodically (e.g. every minute). */
  async processDueReminders(): Promise<number> {
    const due = await prisma.storyReminder.findMany({
      where: { notifyAt: { lte: new Date() } },
      include: { account: { select: { id: true } }, story: { select: { id: true, accountId: true } } },
    });
    let count = 0;
    for (const r of due) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: r.accountId,
            type: 'STORY_REMINDER',
            content: r.eventName ? `Reminder: ${r.eventName}` : 'Your story countdown is over!',
            data: { storyId: r.storyId } as object,
          },
        });
        await prisma.storyReminder.delete({ where: { id: r.id } });
        count++;
      } catch {
        // skip on error
      }
    }
    return count;
  }

  /** Submit a question on a story (Questions sticker). Viewer sends question. */
  async submitQuestion(accountId: string, storyId: string, stickerIndex: number, question: string): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) throw new AppError('Story not found', 404);
    const stickers = (story.stickers as unknown[]) || [];
    const sticker = stickers[stickerIndex] as { type?: string };
    if (!sticker || sticker.type !== 'questions') throw new AppError('Invalid questions sticker', 400);
    const q = String(question).trim().slice(0, 500);
    if (!q) throw new AppError('Question is required', 400);
    await prisma.storyQuestion.create({
      data: { storyId, accountId, question: q },
    });
    return { ok: true };
  }

  /** List questions for a story (for story owner only). */
  async listQuestionsForStory(accountId: string, storyId: string): Promise<{ questions: { id: string; question: string; accountId: string; createdAt: string }[] }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.accountId !== accountId) throw new AppError('Story not found', 404);
    const list = await prisma.storyQuestion.findMany({
      where: { storyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, question: true, accountId: true, createdAt: true },
    });
    return {
      questions: list.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() })),
    };
  }

  /** Record answer story for a question (creator posts answer as story; link question to that story). */
  async linkQuestionAnswer(storyId: string, questionId: string, answerStoryId: string): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    await prisma.storyQuestion.updateMany({
      where: { id: questionId, storyId },
      data: { answerStoryId },
    });
    return { ok: true };
  }

  /** Submit emoji slider rating (1–10). */
  async submitEmojiRating(accountId: string, storyId: string, stickerIndex: number, value: number): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) throw new AppError('Story not found', 404);
    const stickers = (story.stickers as unknown[]) || [];
    const sticker = stickers[stickerIndex] as { type?: string };
    if (!sticker || sticker.type !== 'emoji_slider') throw new AppError('Invalid emoji slider sticker', 400);
    const v = Math.min(10, Math.max(1, Math.round(value)));
    await prisma.storyEmojiRating.upsert({
      where: {
        storyId_accountId_stickerIndex: { storyId, accountId, stickerIndex },
      },
      create: { storyId, accountId, stickerIndex, value: v },
      update: { value: v },
    });
    const io = getIo();
    if (io) {
      const results = await this.getEmojiSliderResults(accountId, storyId);
      const match = results.results.find((r) => r.stickerIndex === stickerIndex);
      if (match) {
        io.emit('storyEmojiUpdated', {
          type: 'storyEmojiUpdated',
          storyId,
          stickerIndex,
          average: match.average,
          count: match.count,
        });
      }
    }
    return { ok: true };
  }

  /** List stories that are "Add Yours" responses to the given story (addYoursParentId = storyId). */
  async listAddYoursResponses(storyId: string): Promise<{ stories: { id: string; media: string; type: string; accountId: string; account: { id: string; username: string; displayName: string; profilePhoto: string | null }; createdAt: Date }[] }> {
    const parent = await prisma.story.findUnique({ where: { id: storyId } });
    if (!parent) throw new AppError('Story not found', 404);
    const list = await prisma.story.findMany({
      where: { addYoursParentId: storyId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return { stories: list };
  }

  /** Get emoji slider results (average and count per sticker; current user's rating if any). */
  async getEmojiSliderResults(accountId: string, storyId: string): Promise<{ results: { stickerIndex: number; average: number; count: number; userRating?: number }[] }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return { results: [] };
    const stickers = (story.stickers as unknown[]) || [];
    const ratings = await prisma.storyEmojiRating.findMany({ where: { storyId } });
    const results: { stickerIndex: number; average: number; count: number; userRating?: number }[] = [];
    for (let i = 0; i < stickers.length; i++) {
      const s = stickers[i] as { type?: string };
      if (s?.type !== 'emoji_slider') continue;
      const stickerRatings = ratings.filter((r) => r.stickerIndex === i);
      const count = stickerRatings.length;
      const sum = stickerRatings.reduce((a, r) => a + r.value, 0);
      const average = count > 0 ? sum / count : 0;
      const userRating = stickerRatings.find((r) => r.accountId === accountId)?.value;
      results.push({ stickerIndex: i, average, count, userRating });
    }
    return { results };
  }
}
