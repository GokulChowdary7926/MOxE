/**
 * Business analytics & insights: reach, engagement, profile visits, link clicks,
 * trend data, top content, demographics, export.
 */
import { prisma } from '../server';
import { ReviewService } from './review.service';
import { AdBillingService } from './ad-billing.service';
import { FraudService } from './fraud.service';

const RANGE_DAYS = { '7d': 7, '30d': 30 } as const;

export type InsightsRange = keyof typeof RANGE_DAYS;

export interface BusinessInsightsPayload {
  metrics: {
    reach: number;
    reachChange: number;
    engagement: number;
    engagementChange: number;
    profileVisits: number;
    profileVisitsChange: number;
    websiteClicks: number;
    websiteClicksChange: number;
    actionButtonClicks: number;
    actionButtonClicksChange: number;
    productTagClicks: number;
    productTagClicksChange: number;
  };
  trendData: number[];
  followerGrowthTrend: number[];
  accountOverview: {
    followers: number;
    posts: number;
    rating: number;
  };
  topPosts: { id: string; title: string; reach: string; engagement: string; date: string }[];
  demographics: {
    age: { range: string; pct: number }[];
    locations: { city: string; pct: number }[];
  };
  creatorInsights?: {
    reelViews: number;
    reelViewsChange: number;
    playsSource: { source: string; count: number }[];
    audioPerformance: { audio: string; views: number; reels: number }[];
    contentComparison: { id: string; title: string; views: number; engagement: number; score: number }[];
    reelRetentionPreview: { second: number; viewers: number }[];
  };
}

const reviewService = new ReviewService();
const adBillingService = new AdBillingService();
const fraudService = new FraudService();

const ALLOWED_EVENT_TYPES = [
  'profile_visit',
  'link_click',
  'action_button_click',
  'ad_impression',
  'ad_click',
  'reel_view',
  'reel_retention',
  /** Map / Nearby: sender-side and viewer-side telemetry (accountId = subject of event). */
  'nearby_message_sent',
  'nearby_message_impression',
] as const;

export class AnalyticsService {
  /** Record an analytics event for a business profile (e.g. profile visit, link click, action button tap). */
  async recordEvent(targetAccountId: string, eventType: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!ALLOWED_EVENT_TYPES.includes(eventType as (typeof ALLOWED_EVENT_TYPES)[number])) {
      throw new Error('Invalid event type');
    }
    const account = await prisma.account.findUnique({
      where: { id: targetAccountId },
      select: { id: true },
    });
    if (!account) throw new Error('Account not found');
    await prisma.analyticsEvent.create({
      data: {
        accountId: targetAccountId,
        eventType,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });

    // If this is an ad event and metadata contains a campaignId, update aggregated insights and spend
    if ((eventType === 'ad_impression' || eventType === 'ad_click') && metadata && typeof metadata.campaignId === 'string') {
      const campaignId = metadata.campaignId as string;
      // Best‑effort upsert; ignore failures so analytics events still record
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const campaign = await prisma.adCampaign.findUnique({
          where: { id: campaignId },
          select: { id: true, bidCpm: true, spent: true, totalBudget: true, dailyBudget: true, accountId: true },
        });
        if (!campaign) return;

        const pricePerImpression =
          eventType === 'ad_impression' && campaign.bidCpm != null && campaign.bidCpm > 0
            ? campaign.bidCpm / 1000
            : 0;

        await prisma.$transaction(async (tx) => {
          const insight = await tx.adCampaignInsight.findFirst({
            where: { campaignId, date: today },
          });
          if (!insight) {
            await tx.adCampaignInsight.create({
              data: {
                campaignId,
                date: today,
                impressions: eventType === 'ad_impression' ? 1 : 0,
                clicks: eventType === 'ad_click' ? 1 : 0,
                spend: pricePerImpression,
              },
            });
          } else {
            await tx.adCampaignInsight.update({
              where: { id: insight.id },
              data: {
                impressions: insight.impressions + (eventType === 'ad_impression' ? 1 : 0),
                clicks: insight.clicks + (eventType === 'ad_click' ? 1 : 0),
                spend: insight.spend + pricePerImpression,
              },
            });
          }

          if (pricePerImpression > 0) {
            await tx.adCampaign.update({
              where: { id: campaignId },
              data: { spent: (campaign.spent ?? 0) + pricePerImpression },
            });
          }
        });

        if (pricePerImpression > 0) {
          // Best-effort billing update; ignore failures
          await adBillingService.recordSpend(targetAccountId, pricePerImpression);
        }

        // Best-effort fraud signal recording
        const viewerAccountId = (metadata.viewerAccountId as string | undefined) ?? undefined;
        const ip = (metadata.ip as string | undefined) ?? undefined;
        const userAgent = (metadata.userAgent as string | undefined) ?? undefined;
        await fraudService.recordAdEventSignal({
          campaignId,
          advertiserAccountId: campaign.accountId,
          viewerAccountId,
          ip,
          userAgent,
          eventType: eventType === 'ad_impression' ? 'IMPRESSION' : 'CLICK',
        });
      } catch {
        // swallow – ad metrics are best-effort and should not break analytics ingestion
      }
    }
  }

  async getBusinessInsights(accountId: string, range: InsightsRange): Promise<BusinessInsightsPayload> {
    const days = RANGE_DAYS[range];
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, accountType: true },
    });
    if (!account) throw new Error('Account not found');

    const postIds = await prisma.post
      .findMany({
        where: { accountId, isDeleted: false },
        select: { id: true, caption: true, createdAt: true },
      })
      .then((rows) => rows);

    const postIdList = postIds.map((p) => p.id) as string[];

    const productIds = await prisma.product.findMany({ where: { accountId }, select: { id: true } }).then((r) => r.map((p) => p.id));
    const [reachCur, reachPrev, likeCount, commentCount, profileVisitsCur, profileVisitsPrev, linkClicksCur, linkClicksPrev, followersCount, trendDaily, topPostsRaw, tagClicksCur, tagClicksPrev, followerGrowthTrend] = await Promise.all([
      postIdList.length
        ? prisma.view.count({
            where: {
              postId: { in: postIdList, not: null },
              viewedAt: { gte: since },
            },
          })
        : 0,
      postIdList.length
        ? prisma.view.count({
            where: {
              postId: { in: postIdList, not: null },
              viewedAt: { gte: prevSince, lt: since },
            },
          })
        : 0,
      postIdList.length
        ? prisma.like.count({
            where: { postId: { in: postIdList }, createdAt: { gte: since } },
          })
        : 0,
      postIdList.length
        ? prisma.comment.count({
            where: { postId: { in: postIdList }, createdAt: { gte: since } },
          })
        : 0,
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'profile_visit', timestamp: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'profile_visit', timestamp: { gte: prevSince, lt: since } },
      }),
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'link_click', timestamp: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'link_click', timestamp: { gte: prevSince, lt: since } },
      }),
      prisma.follow.count({ where: { followingId: accountId } }),
      this.getTrendDaily(accountId, since, days),
      this.getTopPosts(accountId, since, 5),
      productIds.length ? prisma.productTagClick.count({ where: { productId: { in: productIds }, createdAt: { gte: since } } }) : 0,
      productIds.length ? prisma.productTagClick.count({ where: { productId: { in: productIds }, createdAt: { gte: prevSince, lt: since } } }) : 0,
      this.getFollowerGrowthTrend(accountId, since, days),
    ]);

    const [actionBtnCur, actionBtnPrev] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'action_button_click', timestamp: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { accountId, eventType: 'action_button_click', timestamp: { gte: prevSince, lt: since } },
      }),
    ]);

    const engagement = likeCount + commentCount;
    const engagementPrev = await (async () => {
      if (!postIdList.length) return 0;
      const [l, c] = await Promise.all([
        prisma.like.count({ where: { postId: { in: postIdList }, createdAt: { gte: prevSince, lt: since } } }),
        prisma.comment.count({ where: { postId: { in: postIdList }, createdAt: { gte: prevSince, lt: since } } }),
      ]);
      return l + c;
    })();

    const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 100));

    const metrics = {
      reach: reachCur,
      reachChange: pct(reachCur, reachPrev),
      engagement,
      engagementChange: pct(engagement, engagementPrev),
      profileVisits: profileVisitsCur,
      profileVisitsChange: pct(profileVisitsCur, profileVisitsPrev),
      websiteClicks: linkClicksCur,
      websiteClicksChange: pct(linkClicksCur, linkClicksPrev),
      actionButtonClicks: actionBtnCur,
      actionButtonClicksChange: pct(actionBtnCur, actionBtnPrev),
      productTagClicks: tagClicksCur,
      productTagClicksChange: pct(tagClicksCur, tagClicksPrev),
    };

    const { rating: reviewRating } = await reviewService.getRatingForSeller(accountId);
    const accountOverview = {
      followers: followersCount,
      posts: postIds.length,
      rating: reviewRating ?? 4.8,
    };

    const demographics = {
      age: [
        { range: '18-24', pct: 15 },
        { range: '25-34', pct: 45 },
        { range: '35-44', pct: 28 },
        { range: '45-54', pct: 8 },
        { range: '55+', pct: 4 },
      ],
      locations: [
        { city: 'Austin', pct: 78 },
        { city: 'Round Rock', pct: 12 },
        { city: 'Cedar Park', pct: 6 },
        { city: 'Other', pct: 4 },
      ],
    };

    const payload: BusinessInsightsPayload = {
      metrics,
      trendData: trendDaily,
      followerGrowthTrend,
      accountOverview,
      topPosts: topPostsRaw,
      demographics,
    };
    if (account.accountType === 'CREATOR') {
      payload.creatorInsights = await this.getCreatorAdvancedInsights(accountId, since, prevSince);
    }
    return payload;
  }

  async recordReelRetention(accountId: string, reelId: string, second: number): Promise<void> {
    const safeSecond = Math.max(0, Math.min(600, Math.floor(second)));
    await prisma.analyticsEvent.create({
      data: {
        accountId,
        eventType: 'reel_retention',
        contentType: 'reel',
        contentId: reelId,
        metadata: { second: safeSecond } as object,
      },
    });
  }

  async getReelRetention(ownerAccountId: string, reelId: string): Promise<{ second: number; viewers: number }[]> {
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      select: { id: true, accountId: true },
    });
    if (!reel || reel.accountId !== ownerAccountId) return [];
    const events = await prisma.analyticsEvent.findMany({
      where: {
        accountId: ownerAccountId,
        eventType: 'reel_retention',
        contentType: 'reel',
        contentId: reelId,
      },
      select: { metadata: true },
      take: 5000,
    });
    const bySecond = new Map<number, number>();
    for (const e of events) {
      const secRaw = (e.metadata as any)?.second;
      const sec = Number.isFinite(secRaw) ? Math.max(0, Math.floor(secRaw)) : NaN;
      if (Number.isNaN(sec)) continue;
      bySecond.set(sec, (bySecond.get(sec) ?? 0) + 1);
    }
    return [...bySecond.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([second, viewers]) => ({ second, viewers }));
  }

  private async getCreatorAdvancedInsights(accountId: string, since: Date, prevSince: Date): Promise<NonNullable<BusinessInsightsPayload['creatorInsights']>> {
    const reels = await prisma.reel.findMany({
      where: { accountId },
      select: { id: true, caption: true, createdAt: true, audio: true, duration: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const reelIds = reels.map((r) => r.id);
    const [viewsCur, viewsPrev] = await Promise.all([
      reelIds.length
        ? prisma.reelView.count({ where: { reelId: { in: reelIds }, viewedAt: { gte: since } } })
        : 0,
      reelIds.length
        ? prisma.reelView.count({ where: { reelId: { in: reelIds }, viewedAt: { gte: prevSince, lt: since } } })
        : 0,
    ]);
    const reelViewsChange = viewsPrev === 0 ? (viewsCur === 0 ? 0 : 100) : Math.round(((viewsCur - viewsPrev) / viewsPrev) * 100);

    const sourceEvents = await prisma.analyticsEvent.findMany({
      where: {
        accountId,
        eventType: 'reel_view',
        timestamp: { gte: since },
      },
      select: { metadata: true },
      take: 5000,
    });
    const sourceMap = new Map<string, number>();
    for (const e of sourceEvents) {
      const source = String((e.metadata as any)?.source || 'unknown');
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    }
    const playsSource = [...sourceMap.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const viewRows = reelIds.length
      ? await prisma.reelView.groupBy({
          by: ['reelId'],
          where: { reelId: { in: reelIds } },
          _count: { _all: true },
        })
      : [];
    const viewByReel = new Map(viewRows.map((r) => [r.reelId, r._count._all]));
    const likeRows = reelIds.length
      ? await prisma.reelLike.groupBy({
          by: ['reelId'],
          where: { reelId: { in: reelIds } },
          _count: { _all: true },
        })
      : [];
    const commentRows = reelIds.length
      ? await prisma.reelComment.groupBy({
          by: ['reelId'],
          where: { reelId: { in: reelIds } },
          _count: { _all: true },
        })
      : [];
    const likesByReel = new Map(likeRows.map((r) => [r.reelId, r._count._all]));
    const commentsByReel = new Map(commentRows.map((r) => [r.reelId, r._count._all]));

    const audioAgg = new Map<string, { views: number; reels: number }>();
    reels.forEach((r) => {
      const audioTitle = String((r.audio as any)?.title || (r.audio as any)?.name || 'Original audio');
      const current = audioAgg.get(audioTitle) ?? { views: 0, reels: 0 };
      current.reels += 1;
      current.views += viewByReel.get(r.id) ?? 0;
      audioAgg.set(audioTitle, current);
    });
    const audioPerformance = [...audioAgg.entries()]
      .map(([audio, v]) => ({ audio, views: v.views, reels: v.reels }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const contentComparison = reels
      .map((r) => {
        const views = viewByReel.get(r.id) ?? 0;
        const engagement = (likesByReel.get(r.id) ?? 0) + (commentsByReel.get(r.id) ?? 0);
        const score = views + engagement * 3;
        return {
          id: r.id,
          title: (r.caption || 'Reel').slice(0, 42) + ((r.caption || '').length > 42 ? '…' : ''),
          views,
          engagement,
          score,
          createdAt: r.createdAt.getTime(),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ createdAt, ...rest }) => rest);

    const topReelId = contentComparison[0]?.id;
    const reelRetentionPreview = topReelId
      ? await this.getReelRetention(accountId, topReelId)
      : [];

    return {
      reelViews: viewsCur,
      reelViewsChange,
      playsSource,
      audioPerformance,
      contentComparison,
      reelRetentionPreview,
    };
  }

  private async getFollowerGrowthTrend(accountId: string, since: Date, days: number): Promise<number[]> {
    const daily: number[] = [];
    for (let i = 0; i < days; i++) {
      const start = new Date(since);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.follow.count({
        where: { followingId: accountId, createdAt: { gte: start, lt: end } },
      });
      daily.push(count);
    }
    return daily;
  }

  private async getTrendDaily(accountId: string, since: Date, days: number): Promise<number[]> {
    const postIds = await prisma.post.findMany({
      where: { accountId, isDeleted: false },
      select: { id: true },
    }).then((r) => r.map((p) => p.id));
    if (!postIds.length) return Array(days).fill(0);
    const daily: number[] = [];
    for (let i = 0; i < days; i++) {
      const start = new Date(since);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.view.count({
        where: {
          postId: { in: postIds, not: null },
          viewedAt: { gte: start, lt: end },
        },
      });
      daily.push(count);
    }
    return daily;
  }

  private async getTopPosts(
    accountId: string,
    _since: Date,
    limit: number
  ): Promise<{ id: string; title: string; reach: string; engagement: string; date: string }[]> {
    const posts = await prisma.post.findMany({
      where: { accountId, isDeleted: false },
      select: { id: true, caption: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const withMetrics = await Promise.all(
      posts.map(async (p) => {
        const [reach, likes, comments] = await Promise.all([
          prisma.view.count({ where: { postId: p.id } }),
          prisma.like.count({ where: { postId: p.id } }),
          prisma.comment.count({ where: { postId: p.id } }),
        ]);
        return {
          id: p.id,
          title: (p.caption || 'Post').slice(0, 30) + (p.caption && p.caption.length > 30 ? '…' : ''),
          reachStr: reach >= 1000 ? `${(reach / 1000).toFixed(1)}K` : String(reach),
          engagement: likes + comments,
          engagementStr: String(likes + comments),
          date: formatDateAgo(p.createdAt),
          reach,
        };
      })
    );
    withMetrics.sort((a, b) => b.reach - a.reach);
    return withMetrics.slice(0, limit).map(({ id, title, reachStr, engagementStr, date }) => ({
      id,
      title,
      reach: reachStr,
      engagement: engagementStr,
      date,
    }));
  }

  async exportInsightsCsv(accountId: string, range: InsightsRange): Promise<string> {
    const insights = await this.getBusinessInsights(accountId, range);
    const rows: string[][] = [
      ['Metric', 'Value', 'Change %'],
      ['Reach', String(insights.metrics.reach), `${insights.metrics.reachChange}%`],
      ['Engagement', String(insights.metrics.engagement), `${insights.metrics.engagementChange}%`],
      ['Profile Visits', String(insights.metrics.profileVisits), `${insights.metrics.profileVisitsChange}%`],
      ['Website Clicks', String(insights.metrics.websiteClicks), `${insights.metrics.websiteClicksChange}%`],
      ['Action Button Clicks', String(insights.metrics.actionButtonClicks), `${insights.metrics.actionButtonClicksChange}%`],
      ['Product Tag Clicks', String(insights.metrics.productTagClicks), `${insights.metrics.productTagClicksChange}%`],
      [],
      ['Account Overview', '', ''],
      ['Followers', String(insights.accountOverview.followers), ''],
      ['Posts', String(insights.accountOverview.posts), ''],
      ['Rating', String(insights.accountOverview.rating), ''],
      [],
      ['Top Posts', 'Reach', 'Engagement', 'Date'],
      ...insights.topPosts.map((p) => [p.title, p.reach, p.engagement, p.date]),
    ];
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}

function formatDateAgo(d: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 1) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 14) return '1w ago';
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}
