import { prisma } from '../server';

/**
 * Lightweight, Algolia-optional search service.
 * For now this exposes config and local DB-powered fallbacks without requiring
 * the algoliasearch client library to be installed.
 */
export class SearchService {
  isEnabled(): boolean {
    // Consider search "enabled" only when Algolia env vars are present.
    return !!(process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY);
  }

  getPublicConfig() {
    return {
      appId: process.env.ALGOLIA_APP_ID || null,
      searchKey: process.env.ALGOLIA_SEARCH_KEY || null,
      indices: {
        users: process.env.ALGOLIA_INDEX_USERS || null,
        posts: process.env.ALGOLIA_INDEX_POSTS || null,
      },
      enabled: this.isEnabled(),
    };
  }

  /**
   * Placeholder: in a full Algolia setup this would push
   * user and post records to the external index.
   */
  async reindexAll(): Promise<void> {
    // No-op for now to avoid requiring algoliasearch.
  }

  // Simple DB-backed fallbacks that can be used by future routes if needed.
  async searchUsers(query: string, limit = 20) {
    if (!query.trim()) return [];
    return prisma.account.findMany({
      where: {
        isActive: true,
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        accountType: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchPosts(query: string, limit = 20) {
    if (!query.trim()) return [];
    return prisma.post.findMany({
      where: {
        isDeleted: false,
        isArchived: false,
        OR: [
          { caption: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        caption: true,
        location: true,
        accountId: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const searchService = new SearchService();

