// backend/src/services/admin.service.ts

import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class AdminService {
  /**
   * Get system overview
   */
  async getSystemOverview() {
    const [
      totalUsers,
      totalAccounts,
      totalPosts,
      totalStories,
      totalReels,
      totalLives,
      totalMessages,
      totalRevenue,
      activeUsersToday,
      activeUsersThisWeek,
      activeUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.post.count({ where: { isDeleted: false } }),
      prisma.story.count(),
      prisma.reel.count(),
      prisma.live.count(),
      prisma.message.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.analyticsEvent.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        accounts: totalAccounts,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersThisWeek,
        activeThisMonth: activeUsersThisMonth,
      },
      content: {
        posts: totalPosts,
        stories: totalStories,
        reels: totalReels,
        lives: totalLives,
        messages: totalMessages,
      },
      revenue: totalRevenue._sum.amount || 0,
      timestamp: new Date(),
    };
  }

  /**
   * Get users list with pagination
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { phoneNumber: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          accounts: {
            select: {
              id: true,
              username: true,
              displayName: true,
              accountType: true,
              subscriptionTier: true,
              isActive: true,
              verifiedBadge: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              securityLogs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          include: {
            posts: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            followers: {
              take: 10,
              include: {
                follower: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
            following: {
              take: 10,
              include: {
                following: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        sessions: {
          orderBy: { lastActive: 'desc' },
          take: 10,
        },
        securityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: data.phoneNumber,
        email: data.email,
        isVerified: data.isVerified,
      },
    });

    return user;
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason: string, duration?: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        accounts: {
          updateMany: {
            where: { userId },
            data: {
              isActive: false,
              deactivatedAt: new Date(),
            },
          },
        },
      },
    });

    // Log suspension
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'SUSPEND',
        status: 'SUCCESS',
        details: { reason, duration },
      },
    });

    return { success: true, message: 'User suspended successfully' };
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        accounts: {
          updateMany: {
            where: { userId },
            data: {
              isActive: true,
              deactivatedAt: null,
            },
          },
        },
      },
    });

    return { success: true, message: 'User reactivated successfully' };
  }

  /**
   * Get reported content
   */
  async getReports(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          reportedAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          reportedPost: {
            include: {
              account: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          reportedComment: {
            include: {
              account: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Resolve report
   */
  async resolveReport(reportId: string, action: string, notes?: string) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    // Take action based on resolution
    if (action === 'remove_content' && report.reportedPostId) {
      await prisma.post.update({
        where: { id: report.reportedPostId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    } else if (action === 'warn_user' && report.reportedAccountId) {
      // Send warning notification
      await prisma.notification.create({
        data: {
          recipientId: report.reportedAccountId,
          type: 'WARNING',
          content: notes || 'Your content was reported and removed',
        },
      });
    } else if (action === 'suspend_user' && report.reportedAccountId) {
      await prisma.account.update({
        where: { id: report.reportedAccountId },
        data: { isActive: false, deactivatedAt: new Date() },
      });
    }

    return { success: true };
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(days: number = 30) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newPosts,
      newMessages,
      revenue,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          isDeleted: false,
        },
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'SUCCESS',
        },
        _sum: { amount: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['accountId'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
    ]);

    // Daily growth
    const dailyGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as day,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      growth: {
        newUsers,
        newPosts,
        newMessages,
        dailyGrowth,
      },
      revenue: revenue._sum.amount || 0,
      activeUsers: activeUsers.length,
      averageRevenuePerUser: activeUsers.length > 0 
        ? (revenue._sum.amount || 0) / activeUsers.length 
        : 0,
    };
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    const subscriptions = await prisma.subscription.groupBy({
      by: ['tier', 'status'],
      _count: true,
    });

    const revenueByTier = await prisma.subscription.groupBy({
      by: ['tier'],
      where: { status: 'ACTIVE' },
      _sum: { price: true },
    });

    return {
      subscriptions,
      monthlyRecurringRevenue: revenueByTier.reduce((sum, t) => sum + (t._sum.price || 0), 0),
      byTier: revenueByTier,
    };
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue() {
    const [pendingReports, flaggedContent] = await Promise.all([
      prisma.report.count({
        where: { status: 'PENDING' },
      }),
      prisma.post.findMany({
        where: {
          OR: [
            { reports: { some: { status: 'PENDING' } } },
          ],
        },
        include: {
          account: {
            select: {
              id: true,
              username: true,
            },
          },
          reports: {
            where: { status: 'PENDING' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      pendingReports,
      flaggedContent,
      queueLength: pendingReports,
      estimatedTime: pendingReports * 5, // 5 minutes per report
    };
  }
}