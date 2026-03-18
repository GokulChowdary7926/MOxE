/**
 * Feed algorithm: candidate set from following + self, ranked by recency + engagement.
 */
import { prisma } from '../server';
import { AdBillingService } from './ad-billing.service';
import { FraudService } from './fraud.service';
import { FeedRankingService } from './ranking/feedRanking.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const feedRankingService = new FeedRankingService();

async function isMinor(accountId: string): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { user: { select: { dateOfBirth: true } } },
  });
  if (!account?.user?.dateOfBirth) return false;
  const age = (Date.now() - new Date(account.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age < 18;
}

export class FeedService {
  /**
   * Lightweight recording of feed interactions for ranking.
   */
  async recordInteraction(accountId: string, postId: string, type: 'VIEW' | 'LIKE' | 'COMMENT' | 'SAVE', value?: number) {
    try {
      await prisma.feedInteraction.create({
        data: { accountId, postId, type, value },
      });
    } catch {
      // best-effort; do not block feed on analytics failure
    }
  }
  /**
   * Get feed for accountId: posts from followed accounts + own, ordered by score.
   * Score = recency (newer first) + engagement weight (log(1 + likes + comments)).
   * Minors do not see isMature posts.
   */
  async getFeed(accountId: string, cursor?: string, limit: number = DEFAULT_LIMIT) {
    const take = Math.min(limit, MAX_LIMIT);
    const viewerIsMinor = await isMinor(accountId);

    const followingIds = await prisma.follow.findMany({
      where: { followerId: accountId },
      select: { followingId: true },
    }).then((rows) => rows.map((r) => r.followingId));
    const candidateAccountIds = [...new Set([accountId, ...followingIds])];

    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true, expiresAt: true },
    }).then((rows) => rows.filter((r) => r.expiresAt == null || r.expiresAt > new Date()).map((r) => r.blockedId));
    const allowedAccountIds = candidateAccountIds.filter((id) => !blocked.includes(id));

    // Creator 9.1.2: subscriber-only posts visible only to subscribers of that creator
    const subscribedCreatorIds = await prisma.subscription
      .findMany({
        where: { subscriberId: accountId, status: 'ACTIVE' },
        select: { creatorId: true },
      })
      .then((rows) => rows.map((r) => r.creatorId));

    const findManyParams: Parameters<typeof prisma.post.findMany>[0] = {
      where: {
        accountId: { in: allowedAccountIds },
        isDeleted: false,
        isArchived: false,
        privacy: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] },
        ...(viewerIsMinor ? { isMature: false } : {}),
        AND: [
          {
            OR: [
              { isScheduled: false },
              { isScheduled: true, scheduledFor: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { isSubscriberOnly: false },
              { isSubscriberOnly: true, accountId: { in: subscribedCreatorIds } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        account: {
          select: { id: true, username: true, displayName: true, profilePhoto: true, accountType: true, verifiedBadge: true },
        },
        likes: { select: { id: true, accountId: true } },
        comments: { select: { id: true } },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    };
    if (cursor) {
      findManyParams.cursor = { id: cursor };
      findManyParams.skip = 1;
    }

    const posts = await prisma.post.findMany(findManyParams) as unknown as Array<{
      id: string;
      accountId: string;
      media: unknown;
      caption: string | null;
      location: string | null;
      createdAt: Date;
      account: { username: string; displayName: string; profilePhoto: string | null; accountType: string; verifiedBadge: boolean };
      likes: { accountId: string }[];
      comments: { id: string }[];
      ProductTag?: Array<{ productId: string; x: number | null; y: number | null; product: { id: string; name: string; price: number; images: string[] } }>;
    }>;

    const postIds = posts.map((p) => p.id);
    const savedByMe = await prisma.savedPost.findMany({
      where: { accountId, postId: { in: postIds } },
      select: { postId: true },
    });
    const savedPostIds = new Set(savedByMe.map((s) => s.postId));

    const items = posts.map((p) => ({
      id: p.id,
      accountId: p.accountId,
      username: p.account.username,
      displayName: p.account.displayName,
      profilePhoto: p.account.profilePhoto,
      accountType: p.account.accountType,
      verifiedBadge: p.account.verifiedBadge ?? false,
      media: p.media,
      caption: p.caption,
      location: p.location,
      likeCount: p.likes.length,
      commentCount: p.comments.length,
      isLiked: p.likes.some((l) => l.accountId === accountId),
      isSaved: savedPostIds.has(p.id),
      createdAt: p.createdAt,
      productTags: (p.ProductTag ?? []).map((t) => ({ productId: t.productId, x: t.x, y: t.y, product: t.product })),
    }));

    const rankedItems = await feedRankingService.rank(accountId, items);
    const nextCursor = rankedItems.length === take ? rankedItems[rankedItems.length - 1].id : null;

    // Simple ads delivery: optionally inject one sponsored BOOST post into the feed.
    const itemsWithAd = await this.maybeInjectSponsoredItem(accountId, rankedItems);

    return { items: itemsWithAd, nextCursor };
  }

  async getFavoritesFeed(accountId: string, cursor?: string, limit: number = DEFAULT_LIMIT) {
    const take = Math.min(limit, MAX_LIMIT);
    const favoriteFollowingIds = await prisma.follow.findMany({
      where: { followerId: accountId, isFavorite: true },
      select: { followingId: true },
    }).then((rows) => rows.map((r) => r.followingId));
    const candidateAccountIds = [...new Set([accountId, ...favoriteFollowingIds])];
    const blocked = await prisma.block.findMany({
      where: { blockerId: accountId },
      select: { blockedId: true, expiresAt: true },
    }).then((rows) => rows.filter((r) => r.expiresAt == null || r.expiresAt > new Date()).map((r) => r.blockedId));
    const allowedAccountIds = candidateAccountIds.filter((id) => !blocked.includes(id));
    const viewerIsMinor = await isMinor(accountId);
    const findManyParams: Parameters<typeof prisma.post.findMany>[0] = {
      where: {
        accountId: { in: allowedAccountIds },
        isDeleted: false,
        isArchived: false,
        privacy: { in: ['PUBLIC', 'FOLLOWERS_ONLY'] },
        OR: [
          { isScheduled: false },
          { isScheduled: true, scheduledFor: { lte: new Date() } },
        ],
        ...(viewerIsMinor ? { isMature: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        account: { select: { id: true, username: true, displayName: true, profilePhoto: true, accountType: true, verifiedBadge: true } },
        likes: { select: { id: true, accountId: true } },
        comments: { select: { id: true } },
        ProductTag: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
      },
    };
    if (cursor) {
      findManyParams.cursor = { id: cursor };
      findManyParams.skip = 1;
    }
    const posts = await prisma.post.findMany(findManyParams) as unknown as Array<{
      id: string;
      accountId: string;
      media: unknown;
      caption: string | null;
      location: string | null;
      createdAt: Date;
      account: { username: string; displayName: string; profilePhoto: string | null; accountType: string; verifiedBadge: boolean };
      likes: { accountId: string }[];
      comments: { id: string }[];
      ProductTag?: Array<{ productId: string; x: number | null; y: number | null; product: { id: string; name: string; price: number; images: string[] } }>;
    }>;
    const postIds = posts.map((p) => p.id);
    const savedByMe = await prisma.savedPost.findMany({
      where: { accountId, postId: { in: postIds } },
      select: { postId: true },
    });
    const savedPostIds = new Set(savedByMe.map((s) => s.postId));
    const items = posts.map((p) => ({
      id: p.id,
      accountId: p.accountId,
      username: p.account.username,
      displayName: p.account.displayName,
      profilePhoto: p.account.profilePhoto,
      accountType: p.account.accountType,
      verifiedBadge: p.account.verifiedBadge ?? false,
      media: p.media,
      caption: p.caption,
      location: p.location,
      likeCount: p.likes.length,
      commentCount: p.comments.length,
      isLiked: p.likes.some((l) => l.accountId === accountId),
      isSaved: savedPostIds.has(p.id),
      createdAt: p.createdAt,
      productTags: (p.ProductTag ?? []).map((t) => ({ productId: t.productId, x: t.x, y: t.y, product: t.product })),
    }));
    const nextCursor = items.length === take ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  /**
   * Best‑effort selection of a single sponsored BOOST campaign/post and inject it
   * into the organic feed. Budget and audience evaluation are now rule‑driven.
   */
  private async maybeInjectSponsoredItem(
    viewerAccountId: string,
    organicItems: Array<{
      id: string;
      accountId: string;
      username: string;
      displayName: string;
      profilePhoto: string | null;
      accountType: string;
      verifiedBadge: boolean;
      media: unknown;
      caption: string | null;
      location: string | null;
      likeCount: number;
      commentCount: number;
      isLiked: boolean;
      isSaved: boolean;
      createdAt: Date;
      productTags: any[];
    }>,
  ) {
    // Do not attempt to serve ads to minors for now.
    const viewerIsMinor = await isMinor(viewerAccountId);
    if (viewerIsMinor) return organicItems;

    const now = new Date();
    const candidates = await prisma.adCampaign.findMany({
      where: {
        status: 'ACTIVE',
        type: 'BOOST',
        postId: { not: null },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        post: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
                accountType: true,
                verifiedBadge: true,
              },
            },
            likes: { select: { accountId: true } },
            comments: { select: { id: true } },
            ProductTag: {
              include: { product: { select: { id: true, name: true, price: true, images: true } } },
            },
          },
        },
        audiences: {
          include: { audience: true },
        },
      },
    });

    if (!candidates.length) return organicItems;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const ids = candidates.map((c) => c.id);
    const dailySpendRows = await prisma.adCampaignInsight.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: ids }, date: today },
      _sum: { spend: true },
    });
    const dailySpend = new Map<string, number>(
      dailySpendRows.map((r) => [r.campaignId, r._sum.spend ?? 0]),
    );

    // Filter by budgets, audience rules, and viewer blocks, then score by bid and recency.
    let best: (typeof candidates)[number] | null = null;
    let bestScore = 0;

    const billingService = new AdBillingService();
    const fraudService = new FraudService();

    for (const c of candidates) {
      if (!c.post) continue;
      if (c.totalBudget != null && c.spent >= c.totalBudget) continue;
      const todays = dailySpend.get(c.id) ?? 0;
      if (c.dailyBudget != null && todays >= c.dailyBudget) continue;

      const blocked = await prisma.block.findFirst({
        where: {
          blockerId: viewerAccountId,
          blockedId: c.accountId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true },
      });
      if (blocked) continue;

      // Skip campaigns that are temporarily blocked for fraud/abuse.
      const fraudBlocked = await fraudService.isCampaignBlocked(c.id, c.accountId);
      if (fraudBlocked) continue;

      const bid = c.bidCpm != null && c.bidCpm > 0 ? c.bidCpm : 1;
      const unitCost = c.bidCpm != null && c.bidCpm > 0 ? c.bidCpm / 1000 : 0;

      // Enforce billing limits / credits for this advertiser in a best-effort way.
      if (unitCost > 0) {
        const canServe = await billingService.canServeImpression(c.accountId, unitCost);
        if (!canServe) continue;
      }

      // Evaluate audience rules: if campaign has audiences with definitions,
      // viewer must match at least one; otherwise treat as global.
      const matchesAudience = await this.viewerMatchesAnyAudience(viewerAccountId, c.accountId, c.audiences ?? []);
      if (!matchesAudience) continue;

      const ageDays =
        (now.getTime() - (c.startDate ?? c.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      const recencyFactor = 1 / (1 + Math.max(0, ageDays));
      const score = bid * recencyFactor;
      if (!best || score > bestScore) {
        best = c;
        bestScore = score;
      }
    }

    if (!best || !best.post) return organicItems;

    const p = best.post;
    const savedByViewer = await prisma.savedPost.findMany({
      where: { accountId: viewerAccountId, postId: p.id },
      select: { postId: true },
    });
    const isSaved = savedByViewer.length > 0;

    const adItem = {
      id: p.id,
      accountId: p.accountId,
      username: p.account.username,
      displayName: p.account.displayName,
      profilePhoto: p.account.profilePhoto,
      accountType: p.account.accountType,
      verifiedBadge: p.account.verifiedBadge ?? false,
      media: p.media,
      caption: p.caption,
      location: p.location,
      likeCount: p.likes.length,
      commentCount: p.comments.length,
      isLiked: p.likes.some((l) => l.accountId === viewerAccountId),
      isSaved,
      createdAt: p.createdAt,
      productTags: (p.ProductTag ?? []).map((t) => ({
        productId: t.productId,
        x: t.x ?? 0,
        y: t.y ?? 0,
        product: t.product,
      })),
      adCampaignId: best.id,
    };

    const injected = [...organicItems];
    const insertIndex = injected.length >= 3 ? 2 : injected.length;
    injected.splice(insertIndex, 0, adItem as any);
    return injected;
  }

  /**
   * Evaluate whether the viewer matches at least one of the attached audiences.
   * Audience.definition is expected to contain rule objects, but we treat it
   * best‑effort and default to "match" when missing or invalid.
   */
  private async viewerMatchesAnyAudience(
    viewerAccountId: string,
    advertiserAccountId: string,
    campaignAudiences: Array<{ audience: { definition: any } }>,
  ): Promise<boolean> {
    if (!campaignAudiences.length) return true;

    const signals = await this.getViewerAdvertiserSignals(viewerAccountId, advertiserAccountId);

    for (const link of campaignAudiences) {
      const def = link.audience?.definition as any;
      if (!def) continue;
      try {
        if (this.matchesAudienceDefinition(def, signals)) {
          return true;
        }
      } catch {
        // ignore invalid definition
      }
    }
    // If there are audiences but none matched, do not serve this ad.
    return false;
  }

  /**
   * Fetch relationship / engagement / purchase signals between viewer and advertiser.
   */
  private async getViewerAdvertiserSignals(viewerAccountId: string, advertiserAccountId: string) {
    const now = new Date();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [followRow, likesCount, commentsCount, orderRow] = await Promise.all([
      prisma.follow.findFirst({
        where: { followerId: viewerAccountId, followingId: advertiserAccountId },
        select: { id: true },
      }),
      prisma.like.count({
        where: {
          accountId: viewerAccountId,
          post: { accountId: advertiserAccountId },
          createdAt: { gte: since, lte: now },
        },
      }),
      prisma.comment.count({
        where: {
          accountId: viewerAccountId,
          post: { accountId: advertiserAccountId },
          createdAt: { gte: since, lte: now },
        },
      }),
      prisma.order.findFirst({
        where: { buyerId: viewerAccountId, sellerId: advertiserAccountId },
        select: { id: true },
      }),
    ]);

    return {
      isFollower: !!followRow,
      likesLast30d: likesCount,
      commentsLast30d: commentsCount,
      hasPurchased: !!orderRow,
    };
  }

  /**
   * Rule engine for a single audience definition.
   *
   * Example shapes:
   * {
   *   any: [
   *     { type: 'relationship', follower: true },
   *     { type: 'engagement', minLikesLast30d: 1 }
   *   ],
   *   exclude: [
   *     { type: 'purchaser', required: false }
   *   ]
   * }
   */
  private matchesAudienceDefinition(def: any, signals: {
    isFollower: boolean;
    likesLast30d: number;
    commentsLast30d: number;
    hasPurchased: boolean;
  }): boolean {
    const rulesAny = Array.isArray(def.any) ? def.any : [];
    const rulesAll = Array.isArray(def.all) ? def.all : [];
    const rulesExclude = Array.isArray(def.exclude) ? def.exclude : [];

    // Exclusions: if any exclude rule matches, fail immediately.
    for (const r of rulesExclude) {
      if (this.matchesRule(r, signals)) return false;
    }

    // ALL: if defined, all must match.
    if (rulesAll.length > 0) {
      for (const r of rulesAll) {
        if (!this.matchesRule(r, signals)) return false;
      }
    }

    // ANY: if defined, at least one must match.
    if (rulesAny.length > 0) {
      let anyMatch = false;
      for (const r of rulesAny) {
        if (this.matchesRule(r, signals)) {
          anyMatch = true;
          break;
        }
      }
      if (!anyMatch) return false;
    }

    // If neither ANY nor ALL defined (and exclusions passed), treat as match.
    if (rulesAll.length === 0 && rulesAny.length === 0) return true;

    return true;
  }

  private matchesRule(
    rule: any,
    signals: {
      isFollower: boolean;
      likesLast30d: number;
      commentsLast30d: number;
      hasPurchased: boolean;
    },
  ): boolean {
    if (!rule || typeof rule !== 'object') return false;
    switch (rule.type) {
      case 'relationship': {
        if (rule.follower === true && !signals.isFollower) return false;
        if (rule.nonFollower === true && signals.isFollower) return false;
        return true;
      }
      case 'engagement': {
        if (rule.minLikesLast30d != null && signals.likesLast30d < rule.minLikesLast30d) return false;
        if (rule.minCommentsLast30d != null && signals.commentsLast30d < rule.minCommentsLast30d) return false;
        return true;
      }
      case 'purchaser': {
        if (rule.required === true && !signals.hasPurchased) return false;
        if (rule.required === false && signals.hasPurchased) return false;
        return true;
      }
      default:
        return false;
    }
  }
}
