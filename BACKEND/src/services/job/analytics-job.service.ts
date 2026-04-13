import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

type Range = '7d' | '30d';

export type TrackAgileReportsWindow = 'sprint' | '30d';

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

  /**
   * Track Agile tab: velocity, burndown-style trend, priority distribution, and assignee throughput
   * derived from TrackIssue / board columns (last column = Done).
   */
  async getTrackAgileReports(accountId: string, projectId: string, window: TrackAgileReportsWindow) {
    const project = await prisma.trackProject.findFirst({
      where: { id: projectId, accountId },
      select: { id: true, name: true },
    });
    if (!project) throw new AppError('Project not found', 404);

    const columns = await prisma.trackBoardColumn.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    });
    const doneColumnId = columns.length ? columns[columns.length - 1].id : null;
    const isDone = (columnId: string) => (doneColumnId ? columnId === doneColumnId : false);

    const now = new Date();
    const since = new Date(now);
    const rangeDays = window === '30d' ? 30 : 14;
    since.setDate(since.getDate() - rangeDays);

    const issues = await prisma.trackIssue.findMany({
      where: { projectId, archivedAt: null },
      select: {
        id: true,
        priority: true,
        storyPoints: true,
        columnId: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
        dueDate: true,
      },
    });

    const points = (i: { storyPoints: number | null }) => i.storyPoints ?? 1;

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const i of issues) {
      const p = (i.priority || 'MEDIUM').toUpperCase();
      if (p === 'HIGHEST') critical += 1;
      else if (p === 'HIGH') high += 1;
      else if (p === 'MEDIUM') medium += 1;
      else low += 1;
    }
    const priTotal = issues.length;

    const velocityWeeks: { label: string; points: number }[] = [];
    for (let w = 3; w >= 0; w -= 1) {
      const periodEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const label =
        w === 0 ? 'This week' : `−${w * 7}d`;
      let pts = 0;
      if (doneColumnId) {
        for (const i of issues) {
          if (!isDone(i.columnId)) continue;
          const t = i.updatedAt.getTime();
          if (t >= periodStart.getTime() && t < periodEnd.getTime()) pts += points(i);
        }
      }
      velocityWeeks.push({ label, points: pts });
    }

    let completedInRange = 0;
    let completedPointsInRange = 0;
    const cycleDays: number[] = [];
    let onTime = 0;
    let withDue = 0;
    for (const i of issues) {
      if (!doneColumnId || !isDone(i.columnId)) continue;
      if (i.updatedAt < since || i.updatedAt > now) continue;
      completedInRange += 1;
      completedPointsInRange += points(i);
      cycleDays.push((i.updatedAt.getTime() - i.createdAt.getTime()) / 86400000);
      if (i.dueDate) {
        withDue += 1;
        if (i.updatedAt.getTime() <= i.dueDate.getTime()) onTime += 1;
      }
    }

    let openIssues = 0;
    let openPointsNow = 0;
    for (const i of issues) {
      if (!isDone(i.columnId)) {
        openIssues += 1;
        openPointsNow += points(i);
      }
    }

    const initialScope = openPointsNow + completedPointsInRange;
    const steps = window === 'sprint' ? 7 : 10;
    const spanMs = Math.max(1, now.getTime() - since.getTime());
    const burndown: { label: string; remaining: number; ideal: number }[] = [];
    for (let s = 0; s <= steps; s += 1) {
      const tEnd = Math.min(now.getTime(), since.getTime() + (s / steps) * spanMs);
      let cumDone = 0;
      if (doneColumnId) {
        for (const i of issues) {
          if (!isDone(i.columnId)) continue;
          const u = i.updatedAt.getTime();
          if (u <= tEnd && u >= since.getTime()) cumDone += points(i);
        }
      }
      const remaining = Math.max(0, initialScope - cumDone);
      const ideal = Math.max(0, initialScope * (1 - s / steps));
      const label = s === 0 ? 'Start' : s === steps ? 'Now' : `+${s}`;
      burndown.push({ label, remaining, ideal });
    }

    const medianCycleDays =
      cycleDays.length === 0
        ? null
        : (() => {
            const sorted = [...cycleDays].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          })();

    const onTimeSprintPct = withDue === 0 ? null : Math.round((onTime / withDue) * 100);

    let velocityChangePct = 0;
    if (velocityWeeks.length >= 2) {
      const a = velocityWeeks[velocityWeeks.length - 1].points;
      const b = velocityWeeks[velocityWeeks.length - 2].points;
      if (b === 0) velocityChangePct = a > 0 ? 100 : 0;
      else velocityChangePct = Math.round(((a - b) / b) * 100);
    }

    const byAssignee = new Map<string | null, number>();
    for (const i of issues) {
      if (!doneColumnId || !isDone(i.columnId)) continue;
      if (i.updatedAt < since || i.updatedAt > now) continue;
      const aid = i.assigneeId;
      byAssignee.set(aid, (byAssignee.get(aid) ?? 0) + points(i));
    }
    const assigneeIds = [...byAssignee.keys()].filter((x): x is string => x != null);
    const accounts =
      assigneeIds.length > 0
        ? await prisma.account.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true, displayName: true, username: true },
          })
        : [];
    const accMap = new Map(accounts.map((a) => [a.id, a]));
    const throughput = [...byAssignee.entries()]
      .map(([assigneeId, pts]) => ({
        assigneeId,
        displayName: assigneeId
          ? accMap.get(assigneeId)?.displayName?.trim() || accMap.get(assigneeId)?.username || 'Member'
          : 'Unassigned',
        points: pts,
      }))
      .sort((x, y) => y.points - x.points);

    const doneColumnName = columns.length ? columns[columns.length - 1].name : 'Done';

    return {
      empty: issues.length === 0,
      projectId: project.id,
      projectName: project.name,
      doneColumnName,
      window,
      rangeSince: since.toISOString(),
      velocityWeeks,
      velocityChangePct,
      priorityMix: {
        critical,
        high,
        medium,
        low,
        total: priTotal,
      },
      burndown,
      summary: {
        completedInRange,
        completedPointsInRange,
        openIssues,
        openPointsNow,
        medianCycleDays: medianCycleDays == null ? null : Math.round(medianCycleDays * 10) / 10,
        onTimeSprintPct,
        initialScope,
      },
      throughput,
    };
  }
}

