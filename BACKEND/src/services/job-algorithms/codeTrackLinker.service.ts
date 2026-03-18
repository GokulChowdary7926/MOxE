import { prisma } from '../../server';

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '');
}

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export class CodeTrackLinkerService {
  /**
   * Predict likely TRACK issue(s) for a commit based on:
   * - PR linked issue refs (CodePRLinkedIssue)
   * - simple pattern match in commit message (e.g. "TRACK-123")
   */
  async predictIssuesForCommit(commitId: string) {
    const commit = await prisma.codeCommit.findUnique({
      where: { id: commitId },
      include: {
        branch: {
          include: {
            pullRequestsSource: {
              include: { linkedIssues: true },
            },
          },
        },
      },
    });
    if (!commit) return [];

    const refs = new Set<string>();

    // From linked PR issues.
    for (const pr of commit.branch?.pullRequestsSource || []) {
      for (const link of pr.linkedIssues || []) {
        refs.add(link.issueRef);
      }
    }

    // From commit message pattern.
    const msg = commit.message || '';
    const matches = msg.match(/\b[A-Z]+-\d+\b/g);
    if (matches) {
      for (const m of matches) refs.add(m);
    }

    if (!refs.size) return [];

    const issues = await prisma.trackIssue.findMany({
      where: {
        OR: Array.from(refs).map((ref) => ({
          summary: { contains: ref, mode: 'insensitive' as const },
        })),
      },
      take: 10,
    });

    return issues;
  }

  /**
   * Suggest reviewers for a file path inside a repo:
   * - looks at recent commits touching that file
   * - counts commits per author as a proxy for expertise
   */
  async suggestReviewersForFile(repoId: string, filePath: string, limit = 5) {
    const normalized = normalizePath(filePath);

    const commits = await prisma.codeCommitFile.findMany({
      where: {
        path: normalized,
        commit: { repoId },
      },
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: {
        commit: {
          include: {
            author: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });

    const counts = new Map<
      string,
      { accountId: string; displayName: string | null; username: string | null; commits: number }
    >();

    for (const row of commits) {
      const author = row.commit.author;
      if (!author) continue;
      const key = author.id;
      const existing = counts.get(key);
      if (existing) {
        existing.commits += 1;
      } else {
        counts.set(key, {
          accountId: author.id,
          displayName: author.displayName || null,
          username: author.username || null,
          commits: 1,
        });
      }
    }

    const ranked = Array.from(counts.values()).sort((a, b) => b.commits - a.commits);
    return ranked.slice(0, limit);
  }

  /**
   * Provide lightweight context for a file:
   * - recent commits touching it
   * - PRs that modified it
   */
  async getFileContext(repoId: string, filePath: string, limit = 20) {
    const normalized = normalizePath(filePath);

    const files = await prisma.codeCommitFile.findMany({
      where: {
        path: normalized,
        commit: { repoId },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        commit: {
          include: {
            author: { select: { id: true, displayName: true, username: true } },
            branch: {
              include: {
                pullRequestsSource: true,
              },
            },
          },
        },
      },
    });

    const commits = files.map((f) => ({
      id: f.commit.id,
      message: f.commit.message,
      author: f.commit.author,
      createdAt: f.commit.createdAt,
      branchId: f.commit.branchId,
    }));

    const prMap = new Map<string, any>();
    for (const f of files) {
      for (const pr of f.commit.branch?.pullRequestsSource || []) {
        prMap.set(pr.id, {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          status: pr.status,
          authorId: pr.authorId,
        });
      }
    }

    return {
      commits,
      pullRequests: Array.from(prMap.values()),
    };
  }
}

