import { prisma } from '../../server';

export class TrackSmartSuggestService {
  /**
   * Predict the next best task for a user in a given project.
   * Signals:
   * - priority (HIGHEST → LOWEST)
   * - not blocked (no children/issues depending on unresolved blockers)
   * - dependency fan‑out (tasks that unblock many others)
   * - simple recency (newer tasks slightly preferred)
   */
  async predictNextTask(userAccountId: string, projectId: string) {
    const issues = await prisma.trackIssue.findMany({
      where: {
        projectId,
        assigneeId: userAccountId,
        archivedAt: null,
        column: {
          // Basic filter: not done
          name: { notIn: ['Done', 'Resolved', 'Closed'] },
        },
      },
      include: {
        column: true,
      },
    });

    if (!issues.length) return null;

    const blockedIds = new Set(
      await prisma.trackIssue.findMany({
        where: { parentIssueId: { in: issues.map((i) => i.id) } },
        select: { parentIssueId: true },
      }).then((rows) => rows.map((r) => r.parentIssueId!).filter(Boolean)),
    );

    const scored = issues.map((issue) => {
      let score = 0;
      // Priority weight.
      const priorityWeights: Record<string, number> = {
        HIGHEST: 5,
        HIGH: 4,
        MEDIUM: 3,
        LOW: 2,
        LOWEST: 1,
      };
      score += priorityWeights[issue.priority] ?? 3;

      // Deprioritize blocked items.
      if (blockedIds.has(issue.id)) score -= 10;

      // Tasks that unblock others (children) get a boost.
      const childCount = issues.filter((i) => i.parentIssueId === issue.id).length;
      score += childCount * 2;

      // Slight recency bias.
      const ageHours = (Date.now() - issue.createdAt.getTime()) / (1000 * 60 * 60);
      const recency = 1 / (1 + Math.exp(ageHours / 24 - 3));
      score += recency * 2;

      return { issue, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    return top.score > 0 ? top.issue : null;
  }

  /**
   * Flag "at risk" issues in a project using:
   * - due date proximity with little/no progress
   * - long time in non-terminal columns
   * - comments containing "blocked"
   */
  async flagAtRiskIssues(projectId: string) {
    const issues = await prisma.trackIssue.findMany({
      where: {
        projectId,
        archivedAt: null,
      },
      include: {
        column: true,
      },
    });

    const atRisk: Array<any> = [];

    for (const issue of issues) {
      let riskScore = 0;

      // Due date risk.
      if (issue.dueDate) {
        const msDiff = issue.dueDate.getTime() - Date.now();
        const daysUntilDue = msDiff / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 0) riskScore += 0.8;
        else if (daysUntilDue < 3) riskScore += 0.6;
        else if (daysUntilDue < 7) riskScore += 0.3;
      }

      // Stale in progress.
      if (issue.column.name && !['Backlog', 'To Do', 'Done', 'Resolved', 'Closed'].includes(issue.column.name)) {
        const daysInStatus =
          (Date.now() - issue.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysInStatus > 7) riskScore += 0.4;
        if (daysInStatus > 14) riskScore += 0.8;
      }

      // Simple text-based block detection in comments was planned here, but the
      // current schema does not link comments directly to TrackIssue. For now
      // we skip this signal to keep the implementation schema-safe.

      if (riskScore >= 0.7) {
        atRisk.push({ ...issue, riskScore });
      }
    }

    return atRisk;
  }

  /**
   * Suggest related issues when viewing an issue:
   * - same project
   * - overlapping labels
   * - similar summary text (simple LIKE fallback)
   */
  async suggestRelatedIssues(projectId: string, issueId: string, limit = 5) {
    const issue = await prisma.trackIssue.findUnique({
      where: { id: issueId },
      include: {
        issueLabels: true,
      },
    });
    if (!issue) return [];

    const labelIds = issue.issueLabels.map((l) => l.labelId);

    const relatedByLabel = labelIds.length
      ? await prisma.trackIssue.findMany({
          where: {
            projectId,
            id: { not: issueId },
            issueLabels: {
              some: { labelId: { in: labelIds } },
            },
          },
          take: limit,
        })
      : [];

    const relatedBySummary = await prisma.trackIssue.findMany({
      where: {
        projectId,
        id: { not: issueId },
        summary: { contains: issue.summary.split(' ')[0], mode: 'insensitive' },
      },
      take: limit,
    });

    const map = new Map<string, any>();
    for (const r of relatedByLabel) map.set(r.id, r);
    for (const r of relatedBySummary) map.set(r.id, r);

    return Array.from(map.values()).slice(0, limit);
  }
}

