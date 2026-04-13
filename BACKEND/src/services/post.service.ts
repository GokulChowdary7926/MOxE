import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { emitFeedNewPost, emitPostUpdated } from '../sockets';
import {
  assertActorMayMention,
  assertCommentMentionsAllowed,
  canActorTag,
  loadTagsMentionPrefs,
  syncMentionsForPostComment,
} from './tagMentionPrivacy.service';
import { assertMayCommentOnPost } from './commentPolicy.service';
import { shouldLimitIncomingInteraction } from './limitInteractionEnforcement.service';
import { NotificationService } from './notification.service';
import { addAccountActivityLog } from './activity.service';
import { normalizeMediaJsonForApi, normalizeStoredMediaUrl } from '../utils/mediaUrl';

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

export class PostService {
  /** In-app notifications for caption @mentions vs photo-only tags on a new post. */
  private async notifyNewPostMentionsAndTags(
    actorId: string,
    postId: string,
    captionMentionIds: Set<string>,
    photoTagOnlyIds: Set<string>,
  ): Promise<void> {
    const ns = new NotificationService();
    for (const uid of captionMentionIds) {
      if (uid === actorId) continue;
      await ns.create(uid, 'MENTION', actorId, 'mentioned you in a post', { postId });
    }
    for (const uid of photoTagOnlyIds) {
      if (uid === actorId || captionMentionIds.has(uid)) continue;
      await ns.create(uid, 'TAG', actorId, 'tagged you in a post', { postId });
    }
  }

  private async assertCanViewPost(viewerAccountId: string | null, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        accountId: true,
        privacy: true,
        isDeleted: true,
        isArchived: true,
        isMature: true,
        isScheduled: true,
        scheduledFor: true,
        isSubscriberOnly: true,
        allowComments: true,
      },
    });
    if (!post || post.isDeleted) throw new AppError('Post not found', 404);
    if (post.isScheduled && post.scheduledFor && post.scheduledFor > new Date()) {
      throw new AppError('Post not found', 404);
    }
    if (viewerAccountId === post.accountId) return post;

    if (!viewerAccountId) {
      if (post.privacy !== 'PUBLIC' || post.isArchived || post.isSubscriberOnly) {
        throw new AppError('Post not found', 404);
      }
      return post;
    }

    const now = new Date();
    const [viewerBlockedAuthor, authorBlockedViewer, viewerAccount] = await Promise.all([
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerAccountId, blockedId: post.accountId } },
        select: { expiresAt: true },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: post.accountId, blockedId: viewerAccountId } },
        select: { expiresAt: true },
      }),
      prisma.account.findUnique({
        where: { id: viewerAccountId },
        select: { user: { select: { dateOfBirth: true } } },
      }),
    ]);
    const isActiveBlock = (expiresAt: Date | null) => expiresAt == null || expiresAt > now;
    if ((viewerBlockedAuthor && isActiveBlock(viewerBlockedAuthor.expiresAt)) || (authorBlockedViewer && isActiveBlock(authorBlockedViewer.expiresAt))) {
      throw new AppError('Post not found', 404);
    }

    const viewerIsMinor = viewerAccount?.user?.dateOfBirth
      ? (Date.now() - new Date(viewerAccount.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) < 18
      : false;
    if (post.isMature && viewerIsMinor) throw new AppError('Post not found', 404);

    if (post.isArchived) throw new AppError('Post not found', 404);
    if (post.isSubscriberOnly) {
      const sub = await prisma.subscription.findFirst({
        where: { creatorId: post.accountId, subscriberId: viewerAccountId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!sub) throw new AppError('Post not found', 404);
    }
    if (post.privacy === 'PUBLIC') return post;
    if (post.privacy === 'ONLY_ME') throw new AppError('Post not found', 404);
    if (post.privacy === 'FOLLOWERS_ONLY') {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerAccountId, followingId: post.accountId } },
      });
      if (!follow) throw new AppError('Post not found', 404);
      return post;
    }
    if (post.privacy === 'CLOSE_FRIENDS_ONLY') {
      const cf = await prisma.closeFriend.findUnique({
        where: { accountId_friendId: { accountId: post.accountId, friendId: viewerAccountId } },
      });
      if (!cf) throw new AppError('Post not found', 404);
      return post;
    }
    return post;
  }

  async create(accountId: string, data: {
    media: unknown;
    caption?: string;
    altText?: string;
    location?: string;
    privacy?: string;
    allowComments?: boolean;
    hideLikeCount?: boolean;
    screenshotProtection?: boolean;
    isMature?: boolean;
    productTags?: { productId: string; x?: number; y?: number }[];
    isSubscriberOnly?: boolean;
    subscriberTierKeys?: string[] | null;
    coAuthorId?: string | null;
    brandedContentBrandId?: string | null;
    brandedContentDisclosure?: boolean;
    isScheduled?: boolean;
    scheduledFor?: string;
    mentionedUserIds?: string[];
    /** Photo/reel tags (in addition to caption @mentions); same privacy rules as tags. */
    taggedUserIds?: string[];
  }) {
    // Basic media validation: require at least one media item with a URL.
    const rawMediaArray = Array.isArray(data.media) ? data.media : [];
    if (!Array.isArray(rawMediaArray) || rawMediaArray.length === 0) {
      throw new AppError('At least one media item is required', 400);
    }
    const mediaArray = rawMediaArray
      .map((item) => {
        if (typeof item === 'string') {
          const url = normalizeStoredMediaUrl(item);
          return url ? { url } : null;
        }
        if (item && typeof item === 'object') {
          const source = item as Record<string, unknown>;
          const url = normalizeStoredMediaUrl(source.url ?? source.uri ?? source.mediaUrl);
          if (!url) return null;
          return { ...source, url };
        }
        return null;
      })
      .filter((item): item is { url: string } & Record<string, unknown> => !!item);
    if (mediaArray.length === 0) {
      throw new AppError('At least one valid media URL is required', 400);
    }

    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';

    const mentionedIdsRaw = Array.isArray(data.mentionedUserIds) ? [...new Set(data.mentionedUserIds)].slice(0, 20) : [];
    const taggedExtraRaw = Array.isArray(data.taggedUserIds) ? [...new Set(data.taggedUserIds)].slice(0, 20) : [];
    const taggedExtra = taggedExtraRaw.filter((id) => !mentionedIdsRaw.includes(id));
    for (const tid of mentionedIdsRaw) {
      await assertActorMayMention(accountId, tid);
    }
    for (const tid of taggedExtra) {
      if (!(await canActorTag(accountId, tid))) {
        throw new AppError('You cannot tag one or more of these accounts', 403);
      }
    }

    const productTags = Array.isArray(data.productTags) ? data.productTags.slice(0, 5) : [];
    if (productTags.length > 0) {
      const productIds = [...new Set(productTags.map((t) => t.productId))];
      const owned = await prisma.product.findMany({
        where: { id: { in: productIds }, accountId },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((p) => p.id));
      const invalid = productIds.filter((id) => !ownedIds.has(id));
      if (invalid.length > 0) throw new AppError('Invalid or unauthorized product in productTags', 400);
    }
    const post = await prisma.post.create({
      data: {
        accountId,
        media: mediaArray as any,
        caption: data.caption ?? null,
        altText: data.altText ? String(data.altText).slice(0, 500) : null,
        location: data.location ?? null,
        privacy,
        allowComments: data.allowComments ?? true,
        hideLikeCount: data.hideLikeCount ?? false,
        screenshotProtection: data.screenshotProtection ?? false,
        isMature: data.isMature ?? false,
        isSubscriberOnly: data.isSubscriberOnly ?? false,
        subscriberTierKeys: data.subscriberTierKeys ? (data.subscriberTierKeys as any) : null,
        coAuthorId: data.coAuthorId ?? null,
        brandedContentBrandId: data.brandedContentBrandId ?? null,
        brandedContentDisclosure: data.brandedContentDisclosure ?? false,
        isScheduled: data.isScheduled ?? false,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (productTags.length > 0) {
      await prisma.productTag.createMany({
        data: productTags.map((t) => ({
          productId: t.productId,
          postId: post.id,
          x: t.x ?? null,
          y: t.y ?? null,
        })),
      });
    }
    if (mentionedIdsRaw.length > 0) {
      const validAccounts = await prisma.account.findMany({
        where: { id: { in: mentionedIdsRaw }, isActive: true },
        select: { id: true },
      });
      const validIds = new Set(validAccounts.map((a) => a.id));
      await prisma.mention.createMany({
        data: [...validIds].map((mentionedAccountId) => ({
          accountId: mentionedAccountId,
          postId: post.id,
        })),
        skipDuplicates: true,
      });

      const extraTaggedAccounts =
        taggedExtra.length > 0
          ? await prisma.account.findMany({
              where: { id: { in: taggedExtra }, isActive: true },
              select: { id: true },
            })
          : [];
      const tagTargetIds = [...new Set([...validIds, ...extraTaggedAccounts.map((a) => a.id)])];
      for (const tid of tagTargetIds) {
        if (!(await canActorTag(accountId, tid))) continue;
        const tagPref = await loadTagsMentionPrefs(tid);
        const approved = !tagPref.manualTagApproval;
        await prisma.tag.upsert({
          where: { accountId_postId: { accountId: tid, postId: post.id } },
          create: {
            accountId: tid,
            postId: post.id,
            approved,
            taggedById: accountId,
          },
          update: {},
        });
      }
      const photoTagOnly = new Set(extraTaggedAccounts.map((a) => a.id).filter((id) => !validIds.has(id)));
      await this.notifyNewPostMentionsAndTags(accountId, post.id, validIds, photoTagOnly);
    } else if (taggedExtra.length > 0) {
      const validTaggedAccounts = await prisma.account.findMany({
        where: { id: { in: taggedExtra }, isActive: true },
        select: { id: true },
      });
      for (const row of validTaggedAccounts) {
        const tid = row.id;
        if (!(await canActorTag(accountId, tid))) continue;
        const tagPref = await loadTagsMentionPrefs(tid);
        const approved = !tagPref.manualTagApproval;
        await prisma.tag.upsert({
          where: { accountId_postId: { accountId: tid, postId: post.id } },
          create: {
            accountId: tid,
            postId: post.id,
            approved,
            taggedById: accountId,
          },
          update: {},
        });
      }
      const tagOnlySet = new Set(validTaggedAccounts.map((a) => a.id));
      await this.notifyNewPostMentionsAndTags(accountId, post.id, new Set(), tagOnlySet);
    }
    const withTags = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    });
    // Notify feed surfaces immediately after create so Home/Profile refresh without manual reload.
    emitFeedNewPost();
    const created = withTags ?? post;
    return { ...created, media: normalizeMediaJsonForApi(created.media) };
  }

  async getById(postId: string, viewerAccountId: string | null = null) {
    await this.assertCanViewPost(viewerAccountId, postId);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        coAuthor: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        mentions: {
          include: {
            account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
          },
        },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    });
    if (!post || (post as any).isDeleted) {
      throw new AppError('Post not found', 404);
    }
    let brandedContentBrand: {
      id: string;
      username: string;
      displayName: string;
      profilePhoto: string | null;
    } | null = null;
    if (post.brandedContentBrandId) {
      brandedContentBrand = await prisma.account.findUnique({
        where: { id: post.brandedContentBrandId },
        select: { id: true, username: true, displayName: true, profilePhoto: true },
      });
    }
    return {
      ...post,
      media: normalizeMediaJsonForApi(post.media),
      brandedContentBrand,
    };
  }

  async like(accountId: string, postId: string) {
    const post = await this.assertCanViewPost(accountId, postId);
    await prisma.like.upsert({
      where: { accountId_postId: { accountId, postId } },
      create: { accountId, postId },
      update: {},
    });
    const count = await prisma.like.count({ where: { postId } });
    emitPostUpdated(postId, { likeCount: count });
    return { liked: true, likeCount: count };
  }

  async unlike(accountId: string, postId: string) {
    await this.assertCanViewPost(accountId, postId);
    await prisma.like.deleteMany({ where: { accountId, postId } });
    const count = await prisma.like.count({ where: { postId } });
    emitPostUpdated(postId, { likeCount: count });
    return { liked: false, likeCount: count };
  }

  async listPostLikers(postId: string, viewerAccountId: string | null = null, limit = 100) {
    await this.assertCanViewPost(viewerAccountId, postId);
    const take = Math.min(Math.max(1, limit), 200);
    const likes = await prisma.like.findMany({
      where: { postId },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return likes.map((l) => ({
      id: l.account.id,
      username: l.account.username,
      displayName: l.account.displayName,
      profilePhoto: l.account.profilePhoto,
    }));
  }

  async getCommentReplies(commentId: string, viewerAccountId: string | null = null) {
    const root = await prisma.comment.findFirst({
      where: { id: commentId },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (!root) throw new AppError('Comment not found', 404);
    if (!root.postId) throw new AppError('Comment not found', 404);
    await this.assertCanViewPost(viewerAccountId, root.postId);
    const replies = await prisma.comment.findMany({
      where: { parentId: commentId, isHidden: false },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return {
      comment: root,
      replies,
      postId: root.postId,
    };
  }

  async comment(accountId: string, postId: string, content: string, parentId?: string) {
    const post = await this.assertCanViewPost(accountId, postId);
    if (!post.allowComments) {
      throw new AppError('Comments are turned off for this post', 403);
    }
    await assertMayCommentOnPost(post.accountId, accountId);
    await assertCommentMentionsAllowed(accountId, content);
    const isRestricted = await prisma.restrict.findUnique({
      where: {
        restrictorId_restrictedId: { restrictorId: post.accountId, restrictedId: accountId },
      },
    });
    const limitedBySetting = await shouldLimitIncomingInteraction(post.accountId, accountId, 'comment');
    const comment = await prisma.comment.create({
      data: {
        accountId,
        postId,
        content: content.slice(0, 500),
        parentId: parentId || null,
        isHidden: !!isRestricted || limitedBySetting,
      },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    if (limitedBySetting && post.accountId !== accountId) {
      await addAccountActivityLog(post.accountId, {
        type: 'limit_interaction_comment',
        title: 'Comment hidden',
        description: 'A comment was hidden because you have Limit interactions on.',
        metadata: { postId, commentId: comment.id, fromAccountId: accountId, at: new Date().toISOString() },
      });
    }
    // Hidden words (1.6.5): if post owner has comment filter and content matches, hide comment from owner
    let finalComment = comment;
    if (!comment.isHidden && post.accountId !== accountId) {
      const owner = await prisma.account.findUnique({
        where: { id: post.accountId },
        select: { hiddenWordsCommentFilter: true, hiddenWords: true, clientSettings: true },
      });
      const words = Array.isArray(owner?.hiddenWords) ? (owner!.hiddenWords as string[]) : [];
      const cfg = parseHiddenWordsConfig(
        (owner?.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
      );
      const ownerAllowList = new Set(cfg.allowListAccountIds);
      const blockedByFilter = contentMatchesHiddenWords(content, words) || contentMatchesRegex(content, cfg.regexPatterns);
      if (owner?.hiddenWordsCommentFilter && !ownerAllowList.has(accountId) && blockedByFilter) {
        await addAccountActivityLog(post.accountId, {
          type: 'hidden_word_filter_comment',
          title: 'Comment filtered',
          description: 'A comment was auto-hidden by your Hidden words filter.',
          metadata: { postId, commentId: comment.id, fromAccountId: accountId, at: new Date().toISOString() },
        });
        finalComment = await prisma.comment.update({
          where: { id: comment.id },
          data: { isHidden: true },
          include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
        });
      }
    }
    const commentCount = await prisma.comment.count({ where: { postId, isHidden: false } });
    const commentPayload = {
      id: finalComment.id,
      content: finalComment.content,
      createdAt: finalComment.createdAt?.toISOString?.() ?? new Date().toISOString(),
      account: finalComment.account,
    };
    emitPostUpdated(postId, { commentCount, comment: commentPayload });
    if (finalComment.postId) {
      await syncMentionsForPostComment(postId, finalComment.id, content);
      const mentionedRows = await prisma.mention.findMany({
        where: { commentId: finalComment.id },
        select: { accountId: true },
      });
      const ns = new NotificationService();
      for (const row of mentionedRows) {
        if (row.accountId === accountId) continue;
        await ns.create(row.accountId, 'MENTION', accountId, 'mentioned you in a comment', {
          postId,
          commentId: finalComment.id,
        });
      }
    }
    return finalComment;
  }

  async updateComment(accountId: string, commentId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.accountId !== accountId) throw new AppError('Comment not found', 404);
    const minutesSince = (Date.now() - comment.createdAt.getTime()) / (60 * 1000);
    if (minutesSince > 15) throw new AppError('Comments can only be edited within 15 minutes', 400);
    await assertCommentMentionsAllowed(accountId, content);
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.slice(0, 500), updatedAt: new Date() },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    if (comment.postId) await syncMentionsForPostComment(comment.postId, commentId, content);
    return updated;
  }

  async deleteComment(accountId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { accountId: true } } },
    });
    if (!comment) throw new AppError('Comment not found', 404);
    const isOwner = comment.accountId === accountId;
    const isPostOwner = comment.post?.accountId === accountId;
    if (!isOwner && !isPostOwner) throw new AppError('Comment not found', 404);
    await prisma.mention.deleteMany({ where: { commentId } });
    await prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }

  /** Post owner only: remove every comment and reply on this post (bulk delete). */
  async deleteAllCommentsForPost(ownerAccountId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { accountId: true, isDeleted: true },
    });
    if (!post || post.isDeleted) throw new AppError('Post not found', 404);
    if (post.accountId !== ownerAccountId) throw new AppError('Forbidden', 403);

    const commentIds = await prisma.comment.findMany({
      where: { postId },
      select: { id: true },
    });
    if (commentIds.length > 0) {
      await prisma.mention.deleteMany({
        where: { commentId: { in: commentIds.map((c) => c.id) } },
      });
    }

    let safety = 0;
    while ((await prisma.comment.count({ where: { postId } })) > 0) {
      if (++safety > 500) throw new AppError('Could not delete all comments', 500);
      await prisma.comment.deleteMany({
        where: { postId, replies: { none: {} } },
      });
    }

    const commentCount = await prisma.comment.count({ where: { postId, isHidden: false } });
    emitPostUpdated(postId, { commentCount });
    return { ok: true, commentCount };
  }

  async getComments(postId: string, viewerAccountId: string | null = null, cursor?: string, limit = 30) {
    await this.assertCanViewPost(viewerAccountId, postId);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { accountId: true },
    });
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    const nextCursor = comments.length > limit ? comments[limit - 1].id : null;
    const items = comments.slice(0, limit);
    let subscriberTiers: Map<string, string> = new Map();
    if (post?.accountId) {
      const subs = await prisma.subscription.findMany({
        where: { creatorId: post.accountId, status: 'ACTIVE' },
        select: { subscriberId: true, tier: true },
      });
      subs.forEach((s) => subscriberTiers.set(s.subscriberId, s.tier));
    }
    const enriched = items.map((c) => {
      const tier = subscriberTiers.get(c.accountId);
      const account = c.account as any;
      return {
        ...c,
        account: account
          ? { ...account, isSubscriber: !!tier, subscriberTierKey: tier ?? undefined }
          : account,
      };
    });
    return { items: enriched, nextCursor };
  }

  async getHiddenComments(postId: string, ownerAccountId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.accountId !== ownerAccountId) throw new AppError('Post not found', 404);
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isHidden: true },
      orderBy: { createdAt: 'desc' },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    return { items: comments };
  }

  /** Global hidden comments list for my posts – used by Safety Center. */
  async listAllHiddenCommentsForOwner(ownerAccountId: string, limit = 100) {
    const comments = await prisma.comment.findMany({
      where: {
        isHidden: true,
        parentId: null,
        post: {
          accountId: ownerAccountId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        account: {
          select: { id: true, username: true, displayName: true, profilePhoto: true },
        },
        post: {
          select: { id: true },
        },
      },
    });
    return {
      items: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        account: c.account,
        postId: c.post!.id,
      })),
    };
  }

  async approveComment(commentId: string, accountId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { accountId: true } } },
    });
    if (!comment || !comment.post || comment.post.accountId !== accountId)
      throw new AppError('Comment not found', 404);
    return prisma.comment.update({
      where: { id: commentId },
      data: { isHidden: false },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
  }

  async save(accountId: string, postId: string, collectionId?: string) {
    await this.assertCanViewPost(accountId, postId);
    await prisma.savedPost.upsert({
      where: { accountId_postId: { accountId, postId } },
      create: { accountId, postId, collectionId: collectionId || null },
      update: { collectionId: collectionId || null },
    });
    return { saved: true };
  }

  async unsave(accountId: string, postId: string) {
    await this.assertCanViewPost(accountId, postId);
    await prisma.savedPost.deleteMany({ where: { accountId, postId } });
    return { saved: false };
  }

  async listArchived(accountId: string, cursor?: string, limit = 20) {
    const posts = await prisma.post.findMany({
      where: { accountId, isArchived: true, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const nextCursor = posts.length > limit ? posts[limit - 1].id : null;
    return { items: posts.slice(0, limit), nextCursor };
  }

  async archive(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.accountId !== accountId) throw new AppError('Post not found', 404);
    await prisma.post.update({ where: { id: postId }, data: { isArchived: true } });
    return { ok: true };
  }

  async unarchive(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.accountId !== accountId) throw new AppError('Post not found', 404);
    await prisma.post.update({ where: { id: postId }, data: { isArchived: false } });
    return { ok: true };
  }

  async listRecentlyDeleted(accountId: string, cursor?: string, limit = 20) {
    const posts = await prisma.post.findMany({
      where: { accountId, isDeleted: true },
      orderBy: { deletedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    const nextCursor = posts.length > limit ? posts[limit - 1].id : null;
    return { items: posts.slice(0, limit), nextCursor };
  }

  async restoreDeleted(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.accountId !== accountId) throw new AppError('Post not found', 404);
    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: false, deletedAt: null },
    });
    return { ok: true };
  }

  async softDelete(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.accountId !== accountId) throw new AppError('Post not found', 404);
    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { ok: true };
  }

  /** List posts by account (for profile grid). Public posts only, or own account. Minors do not see isMature posts. */
  async listByAccount(viewerAccountId: string | null, accountId: string, cursor?: string, limit = 30) {
    const isOwn = viewerAccountId === accountId;
    const targetAccount = await prisma.account.findUnique({
      where: { id: accountId },
      select: { isPrivate: true },
    });
    if (!targetAccount) return { items: [], nextCursor: null };
    let viewerIsMinor = false;
    let viewerFollows = false;
    let viewerIsCloseFriend = false;
    if (viewerAccountId && !isOwn) {
      const [acc, follow, closeFriend] = await Promise.all([
        prisma.account.findUnique({
          where: { id: viewerAccountId },
          select: { user: { select: { dateOfBirth: true } } },
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerAccountId, followingId: accountId } },
        }),
        prisma.closeFriend.findUnique({
          where: { accountId_friendId: { accountId, friendId: viewerAccountId } },
        }),
      ]);
      if (acc?.user?.dateOfBirth) {
        const age = (Date.now() - new Date(acc.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        viewerIsMinor = age < 18;
      }
      viewerFollows = !!follow;
      viewerIsCloseFriend = !!closeFriend;
    }
    if (!isOwn && targetAccount.isPrivate && !viewerFollows) {
      return { items: [], nextCursor: null };
    }
    let subscribedCreatorIds: string[] = [];
    if (viewerAccountId && !isOwn) {
      subscribedCreatorIds = await prisma.subscription
        .findMany({
          where: { subscriberId: viewerAccountId, status: 'ACTIVE' },
          select: { creatorId: true },
        })
        .then((r) => r.map((x) => x.creatorId));
    }
    const where: Prisma.PostWhereInput = {
      OR: [{ accountId }, { coAuthorId: accountId }],
      isDeleted: false,
      AND: [
        {
          OR: [
            { isScheduled: false },
            { isScheduled: true, scheduledFor: { lte: new Date() } },
          ],
        },
        ...(!isOwn && viewerAccountId
          ? [
              {
                OR: [
                  { isSubscriberOnly: false },
                  { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
                ],
              },
            ]
          : []),
      ],
      ...(isOwn
        ? {}
        : {
            isArchived: false,
            OR: [
              { privacy: 'PUBLIC' as const },
              ...(viewerFollows ? [{ privacy: 'FOLLOWERS_ONLY' as const }] : []),
              ...(viewerIsCloseFriend ? [{ privacy: 'CLOSE_FRIENDS_ONLY' as const }] : []),
            ],
          }),
      ...(viewerIsMinor ? { isMature: false } : {}),
    };
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        coAuthor: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const nextCursor = posts.length > limit ? posts[limit - 1].id : null;
    type Row = (typeof posts)[number];
    return {
      items: posts.slice(0, limit).map((p: Row) => ({
        id: p.id,
        accountId: p.accountId,
        username: p.account.username,
        displayName: p.account.displayName,
        profilePhoto: p.account.profilePhoto,
        media: normalizeMediaJsonForApi(p.media),
        caption: p.caption,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        createdAt: p.createdAt,
        allowComments: p.allowComments !== false,
        hideLikeCount: !!p.hideLikeCount,
      })),
      nextCursor,
    };
  }

  /** List posts where the given account is tagged (for profile Tagged tab). */
  async listTaggedForAccount(accountId: string, cursor?: string, limit = 30) {
    const tags = await prisma.tag.findMany({
      where: { accountId, postId: { not: null }, approved: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, postId: true },
    });
    const nextCursor = tags.length > limit ? tags[limit - 1].id : null;
    const postIds = tags.slice(0, limit).map((t) => t.postId).filter((id): id is string => id != null);
    if (postIds.length === 0) return { items: [], nextCursor: null };
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds }, isDeleted: false, isArchived: false, privacy: 'PUBLIC' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const byId = new Map(posts.map((p) => [p.id, p]));
    const items = postIds.map((id) => byId.get(id)).filter(Boolean) as typeof posts;
    return {
      items: items.map((p) => ({
        id: p.id,
        accountId: p.accountId,
        username: p.account.username,
        displayName: p.account.displayName,
        profilePhoto: p.account.profilePhoto,
        media: normalizeMediaJsonForApi(p.media),
        caption: p.caption,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        createdAt: p.createdAt,
        allowComments: p.allowComments !== false,
        hideLikeCount: !!p.hideLikeCount,
      })),
      nextCursor,
    };
  }

  async updatePostSettings(
    accountId: string,
    postId: string,
    data: { allowComments?: boolean; hideLikeCount?: boolean },
  ) {
    const post = await prisma.post.findFirst({
      where: { id: postId, accountId, isDeleted: false },
      select: { id: true },
    });
    if (!post) throw new AppError('Post not found', 404);
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(typeof data.allowComments === 'boolean' ? { allowComments: data.allowComments } : {}),
        ...(typeof data.hideLikeCount === 'boolean' ? { hideLikeCount: data.hideLikeCount } : {}),
      },
      select: { id: true, allowComments: true, hideLikeCount: true },
    });
    emitPostUpdated(postId, {
      allowComments: updated.allowComments,
      hideLikeCount: updated.hideLikeCount,
    });
    return updated;
  }

  async listPendingTagRequests(forAccountId: string, limit = 30) {
    const rows = await prisma.tag.findMany({
      where: {
        accountId: forAccountId,
        approved: false,
        postId: { not: null },
        post: { isDeleted: false },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(1, limit), 50),
      include: {
        post: {
          include: {
            account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
          },
        },
      },
    });
    return {
      items: rows
        .filter((r) => !!r.post)
        .map((r) => ({
          tagId: r.id,
          postId: r.postId as string,
          createdAt: r.createdAt,
          post: r.post
            ? {
                id: r.post.id,
                caption: r.post.caption,
                media: normalizeMediaJsonForApi(r.post.media),
                author: r.post.account,
              }
            : null,
        })),
    };
  }

  async approveTagRequest(forAccountId: string, tagId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, accountId: forAccountId, postId: { not: null } },
    });
    if (!tag) throw new AppError('Tag request not found', 404);
    await prisma.tag.update({ where: { id: tagId }, data: { approved: true } });
    return { ok: true };
  }

  async rejectTagRequest(forAccountId: string, tagId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, accountId: forAccountId },
    });
    if (!tag) throw new AppError('Tag request not found', 404);
    await prisma.tag.delete({ where: { id: tagId } });
    return { ok: true };
  }
}
