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
      const followerCounts = typeof (prisma.follow as any).groupBy === 'function'
        ? await (prisma.follow as any).groupBy({
            by: ['followingId'],
            where: { followingId: { in: filtered.map((a) => a.id) } },
            _count: { followingId: true },
          })
        : [];
      const followerCountByAccountId = new Map(
        (followerCounts as Array<{ followingId: string; _count: { followingId: number } }>).map((row) => [
          row.followingId,
          row._count.followingId,
        ]),
      );
      const relevanceScore = (a: { username: string; displayName: string | null }) => {
        const username = a.username.toLowerCase();
        const displayName = (a.displayName ?? '').toLowerCase();
        if (username === term || displayName === term) return 400;
        if (username.startsWith(term)) return 300;
        if (displayName.startsWith(term)) return 250;
        if (username.includes(term)) return 150;
        if (displayName.includes(term)) return 100;
        return 0;
      };
      filtered.sort((a, b) => {
        const rel = relevanceScore(b) - relevanceScore(a);
        if (rel !== 0) return rel;
        const followers = (followerCountByAccountId.get(b.id) ?? 0) - (followerCountByAccountId.get(a.id) ?? 0);
        if (followers !== 0) return followers;
        // Keep verified accounts slightly boosted only when relevance and followers tie.
        return (b.verifiedBadge ? 1 : 0) - (a.verifiedBadge ? 1 : 0);
      });
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
  async getRecentPublicPosts(accountId: string, limit = 30) {
    const take = Math.min(Math.max(1, limit), 50);
    const [blockedByViewerRows, blockedViewerRows, followingRows] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: accountId },
        select: { blockedId: true, expiresAt: true },
      }),
      prisma.block.findMany({
        where: { blockedId: accountId },
        select: { blockerId: true, expiresAt: true },
      }),
      prisma.follow.findMany({
        where: { followerId: accountId },
        select: { followingId: true },
      }),
    ]);
    const blockedByViewer = blockedByViewerRows
      .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
      .map((x) => x.blockedId);
    const blockedViewer = blockedViewerRows
      .filter((x) => x.expiresAt == null || x.expiresAt > new Date())
      .map((x) => x.blockerId);
    const followingIds = followingRows.map((x) => x.followingId);
    const excludedAuthorIds = [...new Set([accountId, ...followingIds, ...blockedByViewer, ...blockedViewer])];
    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'PUBLIC',
        accountId: { notIn: excludedAuthorIds },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return Promise.all(posts.map(async (p) => ({ ...p, media: await normalizeMediaJsonForApi(p.media) })));
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
      posts: await Promise.all(posts.map(async (p) => ({ ...p, media: await normalizeMediaJsonForApi(p.media) }))),
    };
  }
}
