// backend/src/services/analytics.service.ts

import { prisma } from '../server';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class AnalyticsService {
  /**
   * Get user analytics
   */
  async getUserAnalytics(accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get daily activity
    const dailyActivity = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        accountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Get daily active users (DAU)
    const dau = await prisma.analyticsEvent.findMany({
      where: {
        accountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
      },
      distinct: ['timestamp'],
    });

    // Get engagement metrics
    const engagement = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        accountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      activity: dailyActivity.reduce((acc, item) => {
        acc[item.eventType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      dailyActiveUsers: dau.length,
      engagement: engagement.reduce((acc, item) => {
        acc[item.eventType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Posts analytics
    const posts = await prisma.post.findMany({
      where: {
        accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Stories analytics
    const stories = await prisma.story.findMany({
      where: {
        accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: {
            viewers: true,
            replies: true,
          },
        },
      },
    });

    // Reels analytics
    const reels = await prisma.reel.findMany({
      where: {
        accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: {
            reelsLike: true,
            reelsComment: true,
            reelsView: true,
          },
        },
      },
    });

    // Calculate totals
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + p._count.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p._count.comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + p._count.shares, 0);
    const totalViews = posts.reduce((sum, p) => sum + p._count.views, 0);

    const avgEngagementRate = totalPosts > 0
      ? ((totalLikes + totalComments + totalShares) / totalPosts / (totalViews || 1)) * 100
      : 0;

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      posts: {
        total: totalPosts,
        totalLikes,
        totalComments,
        totalShares,
        totalViews,
        avgEngagementRate: avgEngagementRate.toFixed(2) + '%',
        topPosts: posts.slice(0, 5).map(p => ({
          id: p.id,
          caption: p.caption?.substring(0, 50),
          likes: p._count.likes,
          comments: p._count.comments,
          shares: p._count.shares,
          views: p._count.views,
          createdAt: p.createdAt,
        })),
      },
      stories: {
        total: stories.length,
        totalViews: stories.reduce((sum, s) => sum + s._count.viewers, 0),
        totalReplies: stories.reduce((sum, s) => sum + s._count.replies, 0),
        avgCompletionRate: 85, // Placeholder - would calculate from actual data
      },
      reels: {
        total: reels.length,
        totalLikes: reels.reduce((sum, r) => sum + r._count.reelsLike, 0),
        totalComments: reels.reduce((sum, r) => sum + r._count.reelsComment, 0),
        totalViews: reels.reduce((sum, r) => sum + r._count.reelsView, 0),
        avgWatchTime: 45, // Placeholder - seconds
      },
    };
  }

  /**
   * Get audience analytics
   */
  async getAudienceAnalytics(accountId: string) {
    const followers = await prisma.follow.findMany({
      where: { followingId: accountId },
      include: {
        follower: {
          select: {
            createdAt: true,
            location: true,
          },
        },
      },
    });

    // Follower growth over time
    const growthByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Follow"
      WHERE "followingId" = ${accountId}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    // Demographics
    const locations = followers.reduce((acc, f) => {
      if (f.follower.location) {
        acc[f.follower.location] = (acc[f.follower.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Active times
    const activeTimes = await prisma.analyticsEvent.findMany({
      where: {
        accountId,
        eventType: 'VIEW',
      },
      select: {
        timestamp: true,
      },
    });

    const hourlyActivity = Array(24).fill(0);
    activeTimes.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    return {
      totalFollowers: followers.length,
      followerGrowth: growthByMonth,
      demographics: {
        locations: Object.entries(locations)
          .map(([location, count]) => ({
            location,
            count,
            percentage: (count / followers.length) * 100,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      },
      activity: {
        hourly: hourlyActivity.map((count, hour) => ({
          hour,
          count,
          percentage: (count / activeTimes.length) * 100,
        })),
      },
      engagement: {
        averageLikesPerFollower: totalLikes / followers.length,
        averageCommentsPerFollower: totalComments / followers.length,
      },
    };
  }

  /**
   * Get business analytics (for business accounts)
   */
  async getBusinessAnalytics(accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Product analytics
    const products = await prisma.product.findMany({
      where: { accountId },
      include: {
        orders: {
          where: {
            order: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    });

    // Order analytics
    const orders = await prisma.order.findMany({
      where: {
        sellerId: accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const topProducts = products
      .map(p => ({
        ...p,
        sales: p.orders.length,
        revenue: p.orders.reduce((sum, o) => sum + o.priceAtPurchase * o.quantity, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      orders: {
        total: totalOrders,
        totalRevenue,
        averageOrderValue,
        byStatus: orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        daily: await this.getDailyOrders(accountId, days),
      },
      products: {
        total: products.length,
        topProducts,
        inventory: products.reduce((sum, p) => sum + (p.inventory || 0), 0),
      },
      conversion: {
        views: await this.getProductViews(accountId, days),
        addsToCart: await this.getAddToCart(accountId, days),
        purchases: totalOrders,
        rate: await this.calculateConversionRate(accountId, days),
      },
    };
  }

  /**
   * Get creator analytics (for creator accounts)
   */
  async getCreatorAnalytics(accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Subscription analytics
    const subscriptions = await prisma.subscription.findMany({
      where: {
        creatorId: accountId,
        status: 'ACTIVE',
      },
    });

    const subscriptionRevenue = subscriptions.reduce((sum, s) => sum + s.price, 0);

    // Badge analytics
    const badges = await prisma.liveBadge.findMany({
      where: {
        live: {
          accountId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const badgeRevenue = badges.reduce((sum, b) => sum + b.amount, 0);

    // Gift analytics
    const gifts = await prisma.liveGift.findMany({
      where: {
        live: {
          accountId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const giftRevenue = gifts.reduce((sum, g) => sum + g.amount, 0);

    // Live analytics
    const lives = await prisma.live.findMany({
      where: {
        accountId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: {
            liveViewers: true,
            liveComments: true,
            liveBadges: true,
            liveGifts: true,
          },
        },
      },
    });

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      revenue: {
        subscriptions: subscriptionRevenue,
        badges: badgeRevenue,
        gifts: giftRevenue,
        total: subscriptionRevenue + badgeRevenue + giftRevenue,
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.length,
        churnRate: await this.calculateChurnRate(accountId, days),
      },
      lives: {
        total: lives.length,
        totalViewers: lives.reduce((sum, l) => sum + l._count.liveViewers, 0),
        averageViewers: lives.length > 0 
          ? lives.reduce((sum, l) => sum + l._count.liveViewers, 0) / lives.length 
          : 0,
        totalComments: lives.reduce((sum, l) => sum + l._count.liveComments, 0),
        totalBadges: lives.reduce((sum, l) => sum + l._count.liveBadges, 0),
        totalGifts: lives.reduce((sum, l) => sum + l._count.liveGifts, 0),
      },
      engagement: {
        averageWatchTime: 45, // Placeholder - minutes
        peakConcurrent: await this.getPeakConcurrent(accountId, days),
      },
    };
  }

  // Helper methods
  private async getDailyOrders(accountId: string, days: number) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const orders = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        sellerId: accountId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
      _sum: {
        total: true,
      },
    });

    return orders.map(o => ({
      date: format(o.createdAt, 'yyyy-MM-dd'),
      orders: o._count,
      revenue: o._sum.total || 0,
    }));
  }

  private async getProductViews(accountId: string, days: number) {
    // Implementation would track product views
    return 0;
  }

  private async getAddToCart(accountId: string, days: number) {
    // Implementation would track add to cart events
    return 0;
  }

  private async calculateConversionRate(accountId: string, days: number) {
    // Implementation would calculate conversion rate
    return 0;
  }

  private async calculateChurnRate(accountId: string, days: number) {
    // Implementation would calculate churn rate
    return 0;
  }

  private async getPeakConcurrent(accountId: string, days: number) {
    // Implementation would get peak concurrent viewers
    return 0;
  }
}