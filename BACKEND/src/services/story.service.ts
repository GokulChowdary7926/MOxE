import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { getIo, emitStoriesNew } from '../sockets';
import { AppError } from '../utils/AppError';
import { assertActorMayMention, assertCommentMentionsAllowed } from './tagMentionPrivacy.service';
import { addAccountActivityLog } from './activity.service';
import { assertNotLimitedIncomingInteraction } from './limitInteractionEnforcement.service';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

const DEFAULT_DURATION_HOURS = 24;

type StoryRepliesAudience = 'everyone' | 'followers' | 'off';

function readStoryRepliesAudience(clientSettings: unknown): StoryRepliesAudience {
  const cs =
    clientSettings && typeof clientSettings === 'object' && !Array.isArray(clientSettings)
      ? (clientSettings as Record<string, unknown>)
      : {};
  const story =
    cs.story && typeof cs.story === 'object' && !Array.isArray(cs.story)
      ? (cs.story as Record<string, unknown>)
      : {};
  const raw = story.repliesAudience;
  if (raw === 'followers' || raw === 'off') return raw;
  return 'everyone';
}

/** Story sticker shapes may include `{ type: 'mention', accountId }` or `accountIds[]`. */
function extractMentionAccountIdsFromStickers(stickers: unknown): string[] {
  if (!Array.isArray(stickers)) return [];
  const ids: string[] = [];
  for (const raw of stickers) {
    if (!raw || typeof raw !== 'object') continue;
    const s = raw as { type?: string; accountId?: unknown; accountIds?: unknown };
    if (s.type !== 'mention') continue;
    if (typeof s.accountId === 'string' && s.accountId.length > 0) ids.push(s.accountId);
    if (Array.isArray(s.accountIds)) {
      for (const id of s.accountIds) {
        if (typeof id === 'string' && id.length > 0) ids.push(id);
      }
    }
  }
  return [...new Set(ids)];
}

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

export class StoryService {
  private async assertPassesHiddenWordFilter(ownerAccountId: string, actorAccountId: string, content: string): Promise<void> {
    if (ownerAccountId === actorAccountId) return;
    const owner = await prisma.account.findUnique({
      where: { id: ownerAccountId },
      select: { hiddenWordsCommentFilter: true, hiddenWords: true, clientSettings: true },
    });
    if (!owner?.hiddenWordsCommentFilter) return;
    const words = Array.isArray(owner.hiddenWords) ? owner.hiddenWords.filter((x): x is string => typeof x === 'string') : [];
    const cfg = parseHiddenWordsConfig(
      (owner.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
    );
    if (cfg.allowListAccountIds.includes(actorAccountId)) return;
    if (contentMatchesHiddenWords(content, words) || contentMatchesRegex(content, cfg.regexPatterns)) {
      await addAccountActivityLog(ownerAccountId, {
        type: 'hidden_word_filter_story',
        title: 'Story interaction blocked',
        description: 'A story reply or question was blocked by your Hidden words filter.',
        metadata: { actorAccountId, at: new Date().toISOString() },
      });
      throw new AppError('Reply contains hidden words and was blocked by recipient settings', 403);
    }
  }

  /** When story.allowReplies is true, still enforce account default “followers only” / off from clientSettings. */
  private async assertStoryInteractiveAudience(storyOwnerId: string, viewerId: string): Promise<void> {
    if (storyOwnerId === viewerId) return;
    const row = await prisma.account.findUnique({
      where: { id: storyOwnerId },
      select: { clientSettings: true },
    });
    const aud = readStoryRepliesAudience(row?.clientSettings);
    if (aud === 'off') {
      throw new AppError('Replies are turned off for this story', 403);
    }
    if (aud === 'followers') {
      const f = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: storyOwnerId } },
      });
      if (!f) throw new AppError('Only followers can interact with this story', 403);
    }
  }

  private async assertCanViewStory(viewerId: string, storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        accountId: true,
        deletedAt: true,
        privacy: true,
        isCloseFriendsOnly: true,
        isSubscriberOnly: true,
        expiresAt: true,
        isMature: true,
        stickers: true,
        allowReplies: true,
        allowReshares: true,
      },
    });
    if (!story || (story as any).deletedAt || story.expiresAt < new Date()) throw new AppError('Story not found', 404);
    if (story.accountId === viewerId) return story;

    const now = new Date();
    const [viewerBlockedAuthor, authorBlockedViewer, viewerAccount] = await Promise.all([
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerId, blockedId: story.accountId } },
        select: { expiresAt: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: story.accountId, blockedId: viewerId } },
        select: { expiresAt: true },
      }),
      prisma.account.findUnique({
        where: { id: viewerId },
        select: { user: { select: { dateOfBirth: true } } },
      }),
    ]);
    const isActiveBlock = (expiresAt: Date | null) => expiresAt == null || expiresAt > now;
    if ((viewerBlockedAuthor && isActiveBlock(viewerBlockedAuthor.expiresAt)) || (authorBlockedViewer && isActiveBlock(authorBlockedViewer.expiresAt))) {
      throw new AppError('Forbidden', 403);
    }

    const viewerIsMinor = viewerAccount?.user?.dateOfBirth
      ? (Date.now() - new Date(viewerAccount.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) < 18
      : false;
    if (story.isMature && viewerIsMinor) throw new AppError('Forbidden', 403);

    if (story.isSubscriberOnly) {
      const sub = await prisma.subscription.findFirst({
        where: { creatorId: story.accountId, subscriberId: viewerId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!sub) throw new AppError('Forbidden', 403);
    }

    const needsCloseFriends = story.privacy === 'CLOSE_FRIENDS_ONLY' || story.isCloseFriendsOnly;
    if (needsCloseFriends) {
      const cf = await prisma.closeFriend.findUnique({
        where: { accountId_friendId: { accountId: story.accountId, friendId: viewerId } },
      });
      if (!cf) throw new AppError('Forbidden', 403);
      return story;
    }
    if (story.privacy === 'FOLLOWERS_ONLY') {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: story.accountId } },
      });
      if (!follow) throw new AppError('Forbidden', 403);
      return story;
    }
    if (story.privacy === 'ONLY_ME') throw new AppError('Forbidden', 403);
    return story;
  }

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

    mediaUrl = normalizeStoredMediaUrl(mediaUrl);
    if (!mediaUrl) {
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
        select: { defaultStoryAllowReplies: true, defaultStoryAllowReshares: true, clientSettings: true },
      });
      const aud = readStoryRepliesAudience(account?.clientSettings);
      if (allowReplies === undefined) {
        if (aud === 'off') allowReplies = false;
        else allowReplies = account?.defaultStoryAllowReplies ?? true;
      }
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

    const parentIdRaw = data.addYoursParentId != null ? String(data.addYoursParentId).trim() : '';
    const parentId = parentIdRaw.length > 0 ? parentIdRaw : null;
    if (parentId) {
      await this.assertCanViewStory(accountId, parentId);
      const parent = await prisma.story.findUnique({
        where: { id: parentId },
        select: { id: true, accountId: true, allowReshares: true, deletedAt: true, expiresAt: true },
      });
      if (!parent || parent.deletedAt || parent.expiresAt < new Date()) {
        throw new AppError('Story not found', 404);
      }
      if (!parent.allowReshares && accountId !== parent.accountId) {
        throw new AppError('Reshares are disabled for this story', 403);
      }
    }

    const mentionIds = extractMentionAccountIdsFromStickers(data.stickers);
    if (mentionIds.length > 0) {
      const existing = await prisma.account.findMany({
        where: { id: { in: mentionIds } },
        select: { id: true },
      });
      const okIds = new Set(existing.map((a) => a.id));
      for (const mid of [...new Set(mentionIds)]) {
        if (!okIds.has(mid)) continue;
        await assertActorMayMention(accountId, mid);
      }
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
        addYoursParentId: parentId ?? undefined,
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
    if (mentionIds.length > 0) {
      const existingM = await prisma.account.findMany({
        where: { id: { in: mentionIds } },
        select: { id: true },
      });
      const ok = new Set(existingM.map((a) => a.id));
      const rows = mentionIds.filter((id) => ok.has(id)).map((mid) => ({ accountId: mid, storyId: story.id }));
      if (rows.length > 0) {
        await prisma.mention.createMany({ data: rows });
      }
    }
    emitStoriesNew();
    return { ...story, media: normalizeStoredMediaUrl(typeof story.media === 'string' ? story.media : String(story.media ?? '')) };
  }

  async listForFeed(accountId: string, username?: string) {
    const following = await prisma.follow.findMany({
      where: { followerId: accountId },
      select: { followingId: true },
    }).then((r) => r.map((x) => x.followingId));
    const closeFriendRows = await prisma.closeFriend.findMany({
      where: { friendId: accountId },
      select: { accountId: true },
    });
    const closeFriendAuthorIds = closeFriendRows.map((x) => x.accountId);

    const accountIds = [...new Set([accountId, ...following, ...closeFriendAuthorIds])];
    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true, expiresAt: true },
    }).then((r) => r.filter((x) => x.expiresAt == null || x.expiresAt > new Date()).map((x) => x.blockedId));
    const allowed = accountIds.filter((id) => !blocked.includes(id));
    const allowedFollowing = following.filter((id) => !blocked.includes(id));
    const allowedCloseFriendAuthors = closeFriendAuthorIds.filter((id) => !blocked.includes(id));

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
    const usernameAccount = username
      ? await prisma.account.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true },
        })
      : null;
    const requestedAccountId = usernameAccount?.id;

    const stories = await prisma.story.findMany({
      where: {
        deletedAt: null,
        accountId: { in: allowed },
        expiresAt: { gt: now },
        ...(viewerIsMinor ? { isMature: false } : {}),
        AND: [
          { OR: [ { isScheduled: false }, { isScheduled: true, scheduledFor: { lte: now } } ] },
          {
            OR: [
              { isSubscriberOnly: false },
              { isSubscriberOnly: true, accountId },
              { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
            ],
          },
          {
            OR: [
              // Always allow own stories regardless of privacy.
              { accountId },
              // Instagram-like visibility gates:
              { privacy: 'PUBLIC', accountId: { in: allowedFollowing } },
              { privacy: 'FOLLOWERS_ONLY', accountId: { in: allowedFollowing } },
              { privacy: 'CLOSE_FRIENDS_ONLY', accountId: { in: allowedCloseFriendAuthors } },
              // Backward compatibility: older rows may use this flag while privacy is PUBLIC.
              { isCloseFriendsOnly: true, accountId: { in: allowedCloseFriendAuthors } },
            ],
          },
          ...(requestedAccountId ? [{ accountId: requestedAccountId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    const viewedIds = await prisma.storyView
      .findMany({
        where: { viewerId: accountId, storyId: { in: stories.map((s) => s.id) } },
        select: { storyId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.storyId)));

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
    return Array.from(byAccount.values()).map((group) => {
      const normalizedStories = group.stories.map((s) => ({
        ...s,
        media: normalizeStoredMediaUrl(typeof s.media === 'string' ? s.media : String(s.media ?? '')),
      }));
      const hasUnseen = normalizedStories.some((s) => !viewedIds.has(s.id));
      const closeFriends = normalizedStories.some((s) => s.privacy === 'CLOSE_FRIENDS_ONLY' || s.isCloseFriendsOnly);
      return {
        ...group,
        stories: normalizedStories,
        id: group.accountId,
        username: group.account.username,
        profilePhoto: group.account.profilePhoto,
        hasUnseen,
        closeFriends,
      };
    });
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
    const storyMedia = normalizeStoredMediaUrl(mediaUrl) || 'https://via.placeholder.com/400x600?text=Shared+post';
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
    return { ...story, media: normalizeStoredMediaUrl(typeof story.media === 'string' ? story.media : String(story.media ?? '')) };
  }

  async likeStory(accountId: string, storyId: string): Promise<{ liked: boolean }> {
    await this.assertCanViewStory(accountId, storyId);
    await prisma.storyLike.upsert({
      where: { storyId_accountId: { storyId, accountId } },
      create: { storyId, accountId },
      update: {},
    });
    return { liked: true };
  }

  async unlikeStory(accountId: string, storyId: string): Promise<{ liked: false }> {
    await this.assertCanViewStory(accountId, storyId);
    await prisma.storyLike.deleteMany({ where: { storyId, accountId } });
    return { liked: false };
  }

  async getStoryLikeStatus(accountId: string, storyId: string): Promise<{ liked: boolean }> {
    await this.assertCanViewStory(accountId, storyId);
    const like = await prisma.storyLike.findUnique({
      where: { storyId_accountId: { storyId, accountId } },
    });
    return { liked: !!like };
  }

  async listStoryViewers(accountId: string, storyId: string): Promise<{
    items: { id: string; username: string; displayName: string | null; profilePhoto: string | null; viewedAt: string }[];
  }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError('Story not found', 404);
    if (story.accountId !== accountId) throw new AppError('Forbidden', 403);
    const views = await prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
      include: {
        viewer: {
          select: { id: true, username: true, displayName: true, profilePhoto: true },
        },
      },
    });
    return {
      items: views.map((v) => ({
        id: v.viewer.id,
        username: v.viewer.username,
        displayName: v.viewer.displayName,
        profilePhoto: v.viewer.profilePhoto,
        viewedAt: v.viewedAt.toISOString(),
      })),
    };
  }

  /** Mentioned accounts (DB + any `mention` stickers not yet synced). Owner only. */
  async listStoryMentions(accountId: string, storyId: string): Promise<{
    items: { id: string; username: string; displayName: string | null; profilePhoto: string | null }[];
  }> {
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true, accountId: true, stickers: true } });
    if (!story) throw new AppError('Story not found', 404);
    if (story.accountId !== accountId) throw new AppError('Forbidden', 403);
    const rows = await prisma.mention.findMany({
      where: { storyId },
      orderBy: { createdAt: 'asc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const byId = new Map(rows.map((r) => [r.accountId, r.account]));
    const fromStickers = extractMentionAccountIdsFromStickers(story.stickers);
    const missing = [...new Set(fromStickers)].filter((id) => !byId.has(id));
    if (missing.length > 0) {
      const extras = await prisma.account.findMany({
        where: { id: { in: missing } },
        select: { id: true, username: true, displayName: true, profilePhoto: true },
      });
      for (const a of extras) byId.set(a.id, a);
    }
    const items = [...byId.values()].sort((a, b) => a.username.localeCompare(b.username));
    return { items };
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
    const story = await this.assertCanViewStory(viewerId, storyId);
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
    const story = await this.assertCanViewStory(accountId, storyId);
    if (!story.allowReplies && story.accountId !== accountId) {
      throw new AppError('Replies are turned off for this story', 403);
    }
    if (story.allowReplies && story.accountId !== accountId) {
      await this.assertStoryInteractiveAudience(story.accountId, accountId);
    }
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
    const story = await this.assertCanViewStory(accountId, storyId);
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
    await this.assertCanViewStory(accountId, storyId);
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
  async submitQuestion(
    accountId: string,
    storyId: string,
    stickerIndex: number,
    question: string,
  ): Promise<{ ok: boolean; questionId: string }> {
    const story = await this.assertCanViewStory(accountId, storyId);
    if (!story.allowReplies && story.accountId !== accountId) {
      throw new AppError('Replies are turned off for this story', 403);
    }
    if (story.allowReplies && story.accountId !== accountId) {
      await this.assertStoryInteractiveAudience(story.accountId, accountId);
    }
    const stickers = (story.stickers as unknown[]) || [];
    const sticker = stickers[stickerIndex] as { type?: string };
    if (!sticker || sticker.type !== 'questions') throw new AppError('Invalid questions sticker', 400);
    const q = String(question).trim().slice(0, 500);
    if (!q) throw new AppError('Question is required', 400);
     await assertCommentMentionsAllowed(accountId, q);
    await this.assertPassesHiddenWordFilter(story.accountId, accountId, q);
    await assertNotLimitedIncomingInteraction(story.accountId, accountId, 'story_reply');
    const row = await prisma.storyQuestion.create({
      data: { storyId, accountId, question: q },
    });
    return { ok: true, questionId: row.id };
  }

  /** List questions for a story (for story owner only). */
  async listQuestionsForStory(accountId: string, storyId: string): Promise<{
    questions: { id: string; question: string; accountId: string; createdAt: string; answerStoryId: string | null }[];
  }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.accountId !== accountId) throw new AppError('Story not found', 404);
    const list = await prisma.storyQuestion.findMany({
      where: { storyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, question: true, accountId: true, createdAt: true, answerStoryId: true },
    });
    return {
      questions: list.map((q) => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
        answerStoryId: q.answerStoryId ?? null,
      })),
    };
  }

  /** Record answer story for a question (creator posts answer as story; link question to that story). */
  async linkQuestionAnswer(ownerAccountId: string, storyId: string, questionId: string, answerStoryId: string): Promise<{ ok: boolean }> {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.accountId !== ownerAccountId) throw new AppError('Story not found', 404);
    const answer = await prisma.story.findUnique({
      where: { id: answerStoryId },
      select: { id: true, accountId: true, deletedAt: true, expiresAt: true },
    });
    if (!answer || answer.deletedAt || answer.expiresAt < new Date() || answer.accountId !== ownerAccountId) {
      throw new AppError('Answer story not found', 404);
    }
    const updated = await prisma.storyQuestion.updateMany({
      where: { id: questionId, storyId },
      data: { answerStoryId },
    });
    if (updated.count === 0) throw new AppError('Question not found', 404);
    return { ok: true };
  }

  /** Submit emoji slider rating (1–10). */
  async submitEmojiRating(accountId: string, storyId: string, stickerIndex: number, value: number): Promise<{ ok: boolean }> {
    const story = await this.assertCanViewStory(accountId, storyId);
    if (!story.allowReplies && story.accountId !== accountId) {
      throw new AppError('Replies are turned off for this story', 403);
    }
    if (story.allowReplies && story.accountId !== accountId) {
      await this.assertStoryInteractiveAudience(story.accountId, accountId);
    }
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
  async listAddYoursResponses(viewerAccountId: string, storyId: string): Promise<{ stories: { id: string; media: string; type: string; accountId: string; account: { id: string; username: string; displayName: string; profilePhoto: string | null }; createdAt: Date }[] }> {
    await this.assertCanViewStory(viewerAccountId, storyId);
    const parent = await prisma.story.findUnique({ where: { id: storyId } });
    if (!parent) throw new AppError('Story not found', 404);
    const list = await prisma.story.findMany({
      where: { addYoursParentId: storyId, deletedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return {
      stories: list.map((s) => ({
        ...s,
        media: normalizeStoredMediaUrl(typeof s.media === 'string' ? s.media : String(s.media ?? '')),
      })),
    };
  }

  /** Viewer story reply (DM-style sheet). Respects allowReplies. */
  async submitStoryReply(replierId: string, storyId: string, message: string): Promise<{ id: string }> {
    const story = await this.assertCanViewStory(replierId, storyId);
    if (!story.allowReplies && story.accountId !== replierId) {
      throw new AppError('Replies are turned off for this story', 403);
    }
    if (story.allowReplies && story.accountId !== replierId) {
      await this.assertStoryInteractiveAudience(story.accountId, replierId);
    }
    const msg = String(message).trim().slice(0, 2000);
    if (!msg) throw new AppError('Message is required', 400);
    await assertCommentMentionsAllowed(replierId, msg);
    await this.assertPassesHiddenWordFilter(story.accountId, replierId, msg);
    await assertNotLimitedIncomingInteraction(story.accountId, replierId, 'story_reply');
    const row = await prisma.storyReply.create({
      data: { storyId, replierId, message: msg },
    });
    await prisma.story.update({
      where: { id: storyId },
      data: { replyCount: { increment: 1 } },
    });
    return { id: row.id };
  }

  /** Public / friends story replies for the comments sheet. */
  async listStoryReplies(viewerAccountId: string, storyId: string): Promise<{
    items: Array<{
      id: string;
      content: string;
      createdAt: string;
      account: {
        id: string;
        username: string;
        displayName: string | null;
        profilePhoto: string | null;
      };
    }>;
  }> {
    const story = await this.assertCanViewStory(viewerAccountId, storyId);
    if (!story.allowReplies && story.accountId !== viewerAccountId) {
      return { items: [] };
    }
    if (story.allowReplies && story.accountId !== viewerAccountId) {
      try {
        await this.assertStoryInteractiveAudience(story.accountId, viewerAccountId);
      } catch {
        return { items: [] };
      }
    }
    const replies = await prisma.storyReply.findMany({
      where: { storyId },
      orderBy: { createdAt: 'desc' },
      include: {
        replier: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return {
      items: replies.map((r) => ({
        id: r.id,
        content: r.message,
        createdAt: r.createdAt.toISOString(),
        account: {
          id: r.replier.id,
          username: r.replier.username,
          displayName: r.replier.displayName,
          profilePhoto: r.replier.profilePhoto,
        },
      })),
    };
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
