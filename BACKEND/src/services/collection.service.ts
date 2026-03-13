/**
 * Collection service: list/create/update/delete collections, list saved posts.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class CollectionService {
  async list(accountId: string) {
    const collections = await prisma.collection.findMany({
      where: { accountId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { savedPosts: true } } },
    });
    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      coverImage: c.coverImage,
      order: c.order,
      savedCount: c._count.savedPosts,
      createdAt: c.createdAt,
    }));
  }

  async create(accountId: string, name: string, coverImage?: string) {
    const maxOrder = await prisma.collection.aggregate({
      where: { accountId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;
    return prisma.collection.create({
      data: { accountId, name: name.trim().slice(0, 100), coverImage: coverImage ?? null, order },
    });
  }

  async update(accountId: string, collectionId: string, data: { name?: string; coverImage?: string; order?: number }) {
    const c = await prisma.collection.findFirst({ where: { id: collectionId, accountId } });
    if (!c) throw new AppError('Collection not found', 404);
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(data.name != null && { name: data.name.trim().slice(0, 100) }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
  }

  async delete(accountId: string, collectionId: string) {
    const c = await prisma.collection.findFirst({ where: { id: collectionId, accountId } });
    if (!c) throw new AppError('Collection not found', 404);
    await prisma.savedPost.updateMany({ where: { collectionId }, data: { collectionId: null } });
    await prisma.collection.delete({ where: { id: collectionId } });
    return { deleted: true };
  }

  async createShareToken(accountId: string, collectionId: string): Promise<{ shareUrl: string; shareToken: string }> {
    const c = await prisma.collection.findFirst({ where: { id: collectionId, accountId } });
    if (!c) throw new AppError('Collection not found', 404);
    const shareToken = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await prisma.collection.update({
      where: { id: collectionId },
      data: { shareToken },
    });
    const baseUrl = process.env.APP_BASE_URL || 'https://moxe.app';
    return { shareToken, shareUrl: `${baseUrl}/collections/shared/${shareToken}` };
  }

  async getByShareToken(shareToken: string) {
    const c = await prisma.collection.findUnique({
      where: { shareToken },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        _count: { select: { savedPosts: true } },
      },
    });
    if (!c) throw new AppError('Collection not found', 404);
    const saved = await prisma.savedPost.findMany({
      where: { collectionId: c.id },
      orderBy: { savedAt: 'desc' },
      take: 50,
      include: {
        post: {
          include: {
            account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
          },
        },
      },
    });
    return {
      id: c.id,
      name: c.name,
      coverImage: c.coverImage,
      account: c.account,
      savedCount: c._count.savedPosts,
      items: saved.map((s) => ({
        id: s.id,
        postId: s.postId,
        savedAt: s.savedAt,
        post: {
          id: s.post.id,
          accountId: s.post.accountId,
          username: s.post.account?.username,
          displayName: s.post.account?.displayName,
          profilePhoto: s.post.account?.profilePhoto,
          media: s.post.media,
          caption: s.post.caption,
          createdAt: s.post.createdAt,
        },
      })),
    };
  }

  async listSaved(accountId: string, collectionId?: string | null, cursor?: string, limit = 30) {
    const where: { accountId: string; collectionId?: string | null } = { accountId };
    if (collectionId !== undefined) where.collectionId = collectionId;

    const saved = await prisma.savedPost.findMany({
      where,
      orderBy: { savedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        post: {
          include: {
            account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
          },
        },
        collection: { select: { id: true, name: true } },
      },
    });

    const nextCursor = saved.length > limit ? saved[limit - 1].id : null;
    const items = saved.slice(0, limit).map((s) => ({
      id: s.id,
      postId: s.postId,
      collectionId: s.collectionId,
      savedAt: s.savedAt,
      collection: s.collection,
      post: {
        id: s.post.id,
        accountId: s.post.accountId,
        username: s.post.account.username,
        displayName: s.post.account.displayName,
        profilePhoto: s.post.account.profilePhoto,
        media: s.post.media,
        caption: s.post.caption,
        location: s.post.location,
        likeCount: 0,
        commentCount: 0,
        isSaved: true,
        createdAt: s.post.createdAt,
      },
    }));

    return { items, nextCursor };
  }
}
