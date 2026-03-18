import { prisma } from '../../server';

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export class KnowWorkConnectorService {
  /**
   * Suggest relevant job documents for a given issue (task).
   * Uses simple term overlap between issue summary/description and document title/content.
   */
  async suggestDocsForIssue(issueId: string, limit = 5) {
    const issue = await prisma.trackIssue.findUnique({
      where: { id: issueId },
    });
    if (!issue) return [];

    const terms = tokenize(`${issue.summary} ${issue.description || ''}`);
    if (!terms.length) return [];

    const docs = await prisma.jobDocument.findMany({
      // Simple text search approximation – real implementation could use full‑text index.
      where: {
        OR: [
          { title: { contains: terms[0], mode: 'insensitive' } },
          { content: { contains: terms[0], mode: 'insensitive' } },
        ],
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    const docScores = docs
      .map((doc) => {
        const docTerms = tokenize(`${doc.title} ${doc.content}`);
        const set = new Set(docTerms);
        let overlap = 0;
        for (const t of terms) {
          if (set.has(t)) overlap += 1;
        }
        return { doc, score: overlap };
      })
      .filter((d) => d.score > 0);

    docScores.sort((a, b) => b.score - a.score);
    return docScores.slice(0, limit).map((d) => d.doc);
  }

  /**
   * Auto‑link top suggested docs to an issue.
   * For now this is a soft link: it returns suggestions with suggested link metadata
   * that the frontend can render or persist.
   */
  async autoLinkDocsToIssue(issueId: string, limit = 5) {
    const suggested = await this.suggestDocsForIssue(issueId, limit);
    return suggested.map((doc) => ({
      documentId: doc.id,
      title: doc.title,
      preview: doc.content.slice(0, 280),
      linkType: 'KNOW_WORK_SUGGESTION',
    }));
  }

  /**
   * Generate a lightweight retro draft for a project based on recent issues.
   */
  async generateRetroDraft(projectId: string, lookbackDays = 14) {
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const issues = await prisma.trackIssue.findMany({
      where: {
        projectId,
        updatedAt: { gte: since },
        archivedAt: null,
      },
      include: {
        column: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!issues.length) {
      return {
        draft: `Retro for project ${projectId}\n\nNo recent issue activity in the last ${lookbackDays} days.`,
        issues: [],
      };
    }

    const completed = issues.filter((i) =>
      ['Done', 'Resolved', 'Closed'].includes(i.column.name || ''),
    );
    const inProgress = issues.filter((i) =>
      !['Backlog', 'To Do', 'Done', 'Resolved', 'Closed'].includes(i.column.name || ''),
    );
    // The current Comment schema is not linked to TrackIssue, so we skip
    // comment-based "blocked" detection for now to keep this implementation
    // aligned with the actual database models.
    const blockedIds = new Set<string>();

    const bullet = (items: string[]) => items.map((i) => `- ${i}`).join('\n') || '- (none)';

    const whatWentWell = completed.slice(0, 10).map((i) => i.summary);
    const whatDidntGoWell = issues
      .filter((i) => blockedIds.has(i.id))
      .slice(0, 10)
      .map((i) => i.summary);
    const whatToImprove = inProgress.slice(0, 10).map((i) => i.summary);

    const draft = [
      `Retro for project ${projectId}`,
      '',
      `Lookback window: last ${lookbackDays} days (${since.toISOString().slice(0, 10)} → today)`,
      '',
      'What went well',
      bullet(whatWentWell),
      '',
      "What didn't go well",
      bullet(whatDidntGoWell),
      '',
      'What we should improve',
      bullet(whatToImprove),
    ].join('\n');

    return { draft, issues };
  }
}

