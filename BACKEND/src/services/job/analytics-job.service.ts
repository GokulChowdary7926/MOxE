import { prisma } from '../../server';

type Range = '7d' | '30d';

export class JobAnalyticsService {
  /**
   * Very lightweight job analytics: aggregates existing data for the current
   * Job account (applications, Track projects, Flow cards) into a simple
   * overview payload similar in spirit to business Analytics.
   */
  async getJobInsights(accountId: string, range: Range) {
    const days = range === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      applicationsTotal,
      applicationsLastRange,
      applicationsPrevRange,
      trackProjects,
      flowCards,
    ] = await Promise.all([
      prisma.jobApplication.count({
        where: { accountId },
      }),
      prisma.jobApplication.count({
        where: { accountId, appliedAt: { gte: since } },
      }),
      prisma.jobApplication.count({
        where: {
          accountId,
          appliedAt: {
            gte: new Date(since.getTime() - days * 24 * 60 * 60 * 1000),
            lt: since,
          },
        },
      }),
      prisma.trackProject.count({
        where: { accountId },
      }),
      prisma.flowCard.count({
        where: { column: { board: { accountId } } },
      }),
    ]);

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const applicationsChange = calcChange(applicationsLastRange, applicationsPrevRange);

    return {
      metrics: {
        totalApplications: applicationsTotal,
        applicationsInRange: applicationsLastRange,
        applicationsChange,
        trackProjects,
        flowCards,
      },
      range: {
        days,
        since: since.toISOString(),
      },
    };
  }
}

