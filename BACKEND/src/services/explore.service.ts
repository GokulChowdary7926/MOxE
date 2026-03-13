/**
 * Explore & search algorithm: trending hashtags, search users/hashtags/posts.
 */
import { prisma } from '../server';

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

    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true, expiresAt: true },
    }).then((r) => r.filter((x) => x.expiresAt == null || x.expiresAt > new Date()).map((x) => x.blockedId));

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
          privacy: 'PUBLIC',
          OR: [{ caption: { contains: term, mode: 'insensitive' } }],
        },
        take: SEARCH_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { id: true, username: true, displayName: true } } },
      });
    }
    return results;
  }
}
