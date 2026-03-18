import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

function contentMatchesHiddenWords(content: string, words: string[]): boolean {
  const lower = content.toLowerCase();
  return words.some((w) => typeof w === 'string' && w.length > 0 && lower.includes(w.toLowerCase()));
}

export class PostService {
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
  }) {
    // Basic media validation: require at least one media item with a URL.
    const mediaArray = Array.isArray(data.media) ? data.media : [];
    if (!Array.isArray(mediaArray) || mediaArray.length === 0) {
      throw new AppError('At least one media item is required', 400);
    }

    const privacy = (data.privacy as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME') || 'PUBLIC';
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
    const mentionedIds = Array.isArray(data.mentionedUserIds) ? [...new Set(data.mentionedUserIds)].slice(0, 20) : [];
    if (mentionedIds.length > 0) {
      const validAccounts = await prisma.account.findMany({
        where: { id: { in: mentionedIds }, isActive: true },
        select: { id: true },
      });
      const validIds = new Set(validAccounts.map((a) => a.id));
      await prisma.mention.createMany({
        data: [...validIds].map((mentionedAccountId) => ({
          accountId: mentionedAccountId,
          postId: post.id,
        })),
      });
    }
    const withTags = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    });
    return withTags ?? post;
  }

  async getById(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    });
    if (!post || (post as any).isDeleted) {
      throw new AppError('Post not found', 404);
    }
    return post;
  }

  async like(accountId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    await prisma.like.upsert({
      where: { accountId_postId: { accountId, postId } },
      create: { accountId, postId },
      update: {},
    });
    const count = await prisma.like.count({ where: { postId } });
    return { liked: true, likeCount: count };
  }

  async unlike(accountId: string, postId: string) {
    await prisma.like.deleteMany({ where: { accountId, postId } });
    const count = await prisma.like.count({ where: { postId } });
    return { liked: false, likeCount: count };
  }

  async comment(accountId: string, postId: string, content: string, parentId?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    const isRestricted = await prisma.restrict.findUnique({
      where: {
        restrictorId_restrictedId: { restrictorId: post.accountId, restrictedId: accountId },
      },
    });
    const comment = await prisma.comment.create({
      data: {
        accountId,
        postId,
        content: content.slice(0, 500),
        parentId: parentId || null,
        isHidden: !!isRestricted,
      },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
    // Hidden words (1.6.5): if post owner has comment filter and content matches, hide comment from owner
    if (!comment.isHidden && post.accountId !== accountId) {
      const owner = await prisma.account.findUnique({
        where: { id: post.accountId },
        select: { hiddenWordsCommentFilter: true, hiddenWords: true },
      });
      const words = Array.isArray(owner?.hiddenWords) ? (owner!.hiddenWords as string[]) : [];
      if (owner?.hiddenWordsCommentFilter && words.length > 0 && contentMatchesHiddenWords(content, words)) {
        const updated = await prisma.comment.update({
          where: { id: comment.id },
          data: { isHidden: true },
          include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
        });
        return updated;
      }
    }
    return comment;
  }

  async updateComment(accountId: string, commentId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.accountId !== accountId) throw new AppError('Comment not found', 404);
    const minutesSince = (Date.now() - comment.createdAt.getTime()) / (60 * 1000);
    if (minutesSince > 15) throw new AppError('Comments can only be edited within 15 minutes', 400);
    return prisma.comment.update({
      where: { id: commentId },
      data: { content: content.slice(0, 500), updatedAt: new Date() },
      include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } },
    });
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
    await prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }

  async getComments(postId: string, cursor?: string, limit = 30) {
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
    await prisma.savedPost.upsert({
      where: { accountId_postId: { accountId, postId } },
      create: { accountId, postId, collectionId: collectionId || null },
      update: { collectionId: collectionId || null },
    });
    return { saved: true };
  }

  async unsave(accountId: string, postId: string) {
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
    let viewerIsMinor = false;
    if (viewerAccountId && !isOwn) {
      const acc = await prisma.account.findUnique({
        where: { id: viewerAccountId },
        select: { user: { select: { dateOfBirth: true } } },
      });
      if (acc?.user?.dateOfBirth) {
        const age = (Date.now() - new Date(acc.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        viewerIsMinor = age < 18;
      }
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
      ...(isOwn ? {} : { isArchived: false, privacy: 'PUBLIC' as const }),
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
        media: p.media,
        caption: p.caption,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        createdAt: p.createdAt,
      })),
      nextCursor,
    };
  }

  /** List posts where the given account is tagged (for profile Tagged tab). */
  async listTaggedForAccount(accountId: string, cursor?: string, limit = 30) {
    const tags = await prisma.tag.findMany({
      where: { accountId, postId: { not: null } },
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
        media: p.media,
        caption: p.caption,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        createdAt: p.createdAt,
      })),
      nextCursor,
    };
  }
}
