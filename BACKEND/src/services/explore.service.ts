/**
 * Explore & search algorithm: trending hashtags, search users/hashtags/posts.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { normalizeMediaJsonForApi } from '../utils/mediaUrl';

const TRENDING_LIMIT = 10;
const SEARCH_LIMIT = 20;

export class ExploreService {
  async getTrendingHashtags() {
    return prisma.hashtag.findMany({
      orderBy: { postCount: 'desc' },
      take: TRENDING_LIMIT,
    });
  }

  async suggestHashtags(prefix: string, limit = 10) {
    const q = prefix.trim().toLowerCase().replace(/^#/, '');
    if (!q) return [];
    return prisma.hashtag.findMany({
      where: { name: { startsWith: q, mode: 'insensitive' } },
      orderBy: { postCount: 'desc' },
      take: limit,
      select: { name: true, postCount: true },
    });
  }

  async search(accountId: string, q: string, type: 'all' | 'users' | 'hashtags' | 'posts' = 'all') {
    const term = q.trim().toLowerCase();
    if (!term) return { users: [], hashtags: [], posts: [] };

    const [blockedByViewerRows, blockedViewerRows] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: accountId },
        select: { blockedId: true, expiresAt: true },
      }),
      prisma.block.findMany({
        where: { blockedId: accountId },
        select: { blockerId: true, expiresAt: true },
      }),
    ]);
    const blockedByViewer = blockedByViewerRows
      .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
      .map((x) => x.blockedId);
    const blockedViewer = blockedViewerRows
      .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
      .map((x) => x.blockerId);
    const blocked = [...new Set([...blockedByViewer, ...blockedViewer])];

    const results: { users: unknown[]; hashtags: unknown[]; posts: unknown[] } = {
      users: [],
      hashtags: [],
      posts: [],
    };

    if (type === 'all' || type === 'users') {
      const followingIds = await prisma.follow.findMany({
        where: { followerId: accountId },
        select: { followingId: true },
      }).then((r) => r.map((x) => x.followingId));
      const accounts = await prisma.account.findMany({
        where: {
          isActive: true,
          id: { notIn: blocked },
          OR: [
            { username: { contains: term, mode: 'insensitive' as const } },
            { displayName: { contains: term, mode: 'insensitive' as const } },
          ],
        },
        take: SEARCH_LIMIT * 2,
        select: { id: true, username: true, displayName: true, profilePhoto: true, searchVisibility: true, verifiedBadge: true },
      });
      const filtered = accounts.filter((a) => {
        const vis = a.searchVisibility ?? 'EVERYONE';
        if (vis === 'NO_ONE') return false;
        if (vis === 'FOLLOWERS_ONLY' && !followingIds.includes(a.id)) return false;
        return true;
      });
      // 2.26 Verified benefits: boost verified accounts in search (priority)
      filtered.sort((a, b) => (b.verifiedBadge ? 1 : 0) - (a.verifiedBadge ? 1 : 0));
      results.users = filtered.slice(0, SEARCH_LIMIT).map(({ searchVisibility: _, verifiedBadge, ...u }) => ({ ...u, verifiedBadge: verifiedBadge ?? false }));
    }
    if (type === 'all' || type === 'hashtags') {
      results.hashtags = await prisma.hashtag.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        take: SEARCH_LIMIT,
      });
    }
    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          isDeleted: false,
          isArchived: false,
          privacy: 'PUBLIC',
          accountId: { notIn: blocked },
          OR: [{ caption: { contains: term, mode: 'insensitive' } }],
        },
        take: SEARCH_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { id: true, username: true, displayName: true } } },
      });
    }
    return results;
  }

  /** Recent public posts for Explore grid when ranking/feed are empty. */
  async getRecentPublicPosts(limit = 30) {
    const take = Math.min(Math.max(1, limit), 50);
    const posts = await prisma.post.findMany({
      where: { isDeleted: false, privacy: 'PUBLIC' },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return posts.map((p) => ({ ...p, media: normalizeMediaJsonForApi(p.media) }));
  }

  /** Posts tagged with a hashtag (by normalized name), excluding blocked authors. */
  async getHashtagPosts(accountId: string, rawName: string, limit = 30) {
    const name = rawName.trim().toLowerCase().replace(/^#/, '');
    if (!name) return { hashtag: null, posts: [] };

    const blocked = await prisma.block
      .findMany({
        where: { blockerId: accountId },
        select: { blockedId: true, expiresAt: true },
      })
      .then((r) =>
        r.filter((x) => x.expiresAt == null || x.expiresAt > new Date()).map((x) => x.blockedId),
      );

    const hashtag = await prisma.hashtag.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (!hashtag) return { hashtag: null, posts: [] };

    const take = Math.min(Math.max(1, limit), 50);
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      privacy: 'PUBLIC',
      postHashtags: { some: { hashtagId: hashtag.id } },
    };
    if (blocked.length > 0) {
      where.accountId = { notIn: blocked };
    }

    const posts = await prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    return {
      hashtag: { name: hashtag.name, postCount: hashtag.postCount },
      posts: posts.map((p) => ({ ...p, media: normalizeMediaJsonForApi(p.media) })),
    };
  }
}
