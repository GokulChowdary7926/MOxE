import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import { GITIGNORE_TEMPLATES, LICENSE_TEMPLATES, defaultReadme } from './code-templates';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

async function canAccessRepo(
  accountId: string,
  repoId: string,
  minRole: 'READ' | 'WRITE' | 'ADMIN' = 'READ'
): Promise<{ repo: any; role: string }> {
  const repo = await prisma.codeRepository.findUnique({
    where: { id: repoId },
    include: { account: { select: { id: true, displayName: true, username: true } }, branches: true },
  });
  if (!repo) throw new AppError('Repository not found', 404);
  if (repo.accountId === accountId) return { repo, role: 'ADMIN' };
  const collab = await prisma.codeRepoCollaborator.findUnique({
    where: { repoId_accountId: { repoId, accountId } },
  });
  if (!collab) throw new AppError('Access denied', 403);
  const order = ['READ', 'WRITE', 'ADMIN'];
  if (order.indexOf(collab.role) < order.indexOf(minRole)) throw new AppError('Insufficient permissions', 403);
  return { repo, role: collab.role };
}

/** List repos the account can access (owned or collaborator) */
async function getAccessibleRepoIds(accountId: string): Promise<string[]> {
  const [owned, collab] = await Promise.all([
    prisma.codeRepository.findMany({ where: { accountId }, select: { id: true } }),
    prisma.codeRepoCollaborator.findMany({ where: { accountId }, select: { repoId: true } }),
  ]);
  const ids = new Set<string>([...owned.map((r) => r.id), ...collab.map((c) => c.repoId)]);
  return Array.from(ids);
}

export class CodeService {
  async listRepos(accountId: string) {
    const repoIds = await getAccessibleRepoIds(accountId);
    if (repoIds.length === 0) return [];
    return prisma.codeRepository.findMany({
      where: { id: { in: repoIds } },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        _count: { select: { branches: true, pullRequests: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRepo(accountId: string, repoIdOrOwnerSlug: string) {
    const repoIds = await getAccessibleRepoIds(accountId);
    let repo: any = null;
    if (repoIdOrOwnerSlug.includes('/')) {
      const [ownerSlug, repoSlug] = repoIdOrOwnerSlug.split('/').map((s) => s.trim());
      const owner = await prisma.account.findFirst({ where: { username: ownerSlug }, select: { id: true } });
      if (owner)
        repo = await prisma.codeRepository.findUnique({
          where: { accountId_slug: { accountId: owner.id, slug: repoSlug } },
          include: {
            account: { select: { id: true, displayName: true, username: true } },
            branches: { orderBy: { name: 'asc' } },
            collaborators: { include: { account: { select: { id: true, displayName: true, username: true } } } },
            labels: true,
            _count: { select: { pullRequests: true } },
          },
        });
    }
    if (!repo)
      repo = await prisma.codeRepository.findUnique({
        where: { id: repoIdOrOwnerSlug },
        include: {
          account: { select: { id: true, displayName: true, username: true } },
          branches: { orderBy: { name: 'asc' } },
          collaborators: { include: { account: { select: { id: true, displayName: true, username: true } } } },
          labels: true,
          _count: { select: { pullRequests: true } },
        },
      });
    if (!repo || !repoIds.includes(repo.id)) throw new AppError('Repository not found', 404);
    return repo;
  }

  async createRepo(
    accountId: string,
    data: {
      name: string;
      description?: string;
      visibility?: 'PUBLIC' | 'PRIVATE';
      initReadme?: boolean;
      gitignoreTemplate?: string;
      licenseTemplate?: string;
    }
  ) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new AppError('Name must contain only letters, numbers, hyphens and underscores', 400);
    const slug = slugify(name).slice(0, 120) || 'repo';
    const visibility = data.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';
    const existing = await prisma.codeRepository.findUnique({
      where: { accountId_slug: { accountId, slug } },
    });
    if (existing) throw new AppError('A repository with this name already exists', 400);

    const repo = await prisma.codeRepository.create({
      data: {
        accountId,
        name,
        slug,
        description: (data.description || '').slice(0, 500) || undefined,
        visibility,
        defaultBranch: 'main',
      },
      include: { account: { select: { id: true, displayName: true, username: true } } },
    });

    const mainBranch = await prisma.codeBranch.create({
      data: { repoId: repo.id, name: 'main' },
    });

    const files: { path: string; content: string }[] = [];
    if (data.initReadme) {
      files.push({ path: 'README.md', content: defaultReadme(name, data.description) });
    }
    if (data.gitignoreTemplate && GITIGNORE_TEMPLATES[data.gitignoreTemplate]) {
      files.push({ path: '.gitignore', content: GITIGNORE_TEMPLATES[data.gitignoreTemplate] });
    }
    if (data.licenseTemplate && data.licenseTemplate !== 'Proprietary' && LICENSE_TEMPLATES[data.licenseTemplate]) {
      const year = new Date().getFullYear();
      const account = await prisma.account.findUnique({ where: { id: accountId }, select: { displayName: true } });
      files.push({
        path: 'LICENSE',
        content: LICENSE_TEMPLATES[data.licenseTemplate].replace(/\{\{year\}\}/g, String(year)).replace(/\{\{name\}\}/g, account?.displayName || ''),
      });
    }

    let commit: any = null;
    if (files.length > 0) {
      commit = await prisma.codeCommit.create({
        data: {
          repoId: repo.id,
          branchId: mainBranch.id,
          message: 'Initial commit',
          authorId: accountId,
        },
        include: { author: { select: { id: true, displayName: true } } },
      });
      await prisma.codeCommitFile.createMany({
        data: files.map((f) => ({ commitId: commit.id, path: f.path, content: f.content })),
      });
      await prisma.codeBranch.update({
        where: { id: mainBranch.id },
        data: { headCommitId: commit.id },
      });
    }

    return this.getRepo(accountId, repo.id);
  }

  async updateRepo(accountId: string, repoId: string, data: { name?: string; description?: string; visibility?: string }) {
    await canAccessRepo(accountId, repoId, 'ADMIN');
    const update: any = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
      update.name = name;
      update.slug = slugify(name).slice(0, 120);
    }
    if (data.description !== undefined) update.description = data.description.slice(0, 500) || null;
    if (data.visibility === 'PUBLIC' || data.visibility === 'PRIVATE') update.visibility = data.visibility;
    await prisma.codeRepository.update({ where: { id: repoId }, data: update });
    return this.getRepo(accountId, repoId);
  }

  async deleteRepo(accountId: string, repoId: string) {
    const { repo } = await canAccessRepo(accountId, repoId, 'ADMIN');
    if (repo.accountId !== accountId) throw new AppError('Only the owner can delete the repository', 403);
    await prisma.codeRepository.delete({ where: { id: repoId } });
    return { ok: true };
  }

  async listBranches(accountId: string, repoId: string) {
    await canAccessRepo(accountId, repoId);
    return prisma.codeBranch.findMany({
      where: { repoId },
      orderBy: { name: 'asc' },
      include: { headCommit: { include: { author: { select: { id: true, displayName: true } } } } },
    });
  }

  async createBranch(accountId: string, repoId: string, name: string, fromBranchName?: string) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 255) throw new AppError('Invalid branch name', 400);
    const existing = await prisma.codeBranch.findUnique({ where: { repoId_name: { repoId, name: trimmed } } });
    if (existing) throw new AppError('Branch already exists', 400);

    const repo = await prisma.codeRepository.findUnique({ where: { id: repoId }, include: { branches: true } });
    const fromBranch = fromBranchName
      ? repo?.branches.find((b) => b.name === fromBranchName)
      : repo?.branches.find((b) => b.name === repo?.defaultBranch || 'main');
    if (!fromBranch) throw new AppError('Source branch not found', 400);

    const newBranch = await prisma.codeBranch.create({
      data: { repoId, name: trimmed, headCommitId: fromBranch.headCommitId },
    });
    return prisma.codeBranch.findUnique({
      where: { id: newBranch.id },
      include: { headCommit: { include: { author: { select: { id: true, displayName: true } } } } },
    });
  }

  async listCommits(accountId: string, repoId: string, branchName?: string, limit = 50) {
    await canAccessRepo(accountId, repoId);
    const branch = branchName
      ? await prisma.codeBranch.findUnique({ where: { repoId_name: { repoId, name: branchName } } })
      : await prisma.codeBranch.findFirst({ where: { repoId }, orderBy: { name: 'asc' } });
    if (!branch) return [];
    return prisma.codeCommit.findMany({
      where: { branchId: branch.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async getCommit(accountId: string, repoId: string, commitId: string) {
    await canAccessRepo(accountId, repoId);
    const commit = await prisma.codeCommit.findFirst({
      where: { id: commitId, repoId },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        files: true,
        branch: true,
      },
    });
    if (!commit) throw new AppError('Commit not found', 404);
    return commit;
  }

  async getFileContent(accountId: string, repoId: string, branchName: string, filePath: string) {
    await canAccessRepo(accountId, repoId);
    const branch = await prisma.codeBranch.findUnique({
      where: { repoId_name: { repoId, name: branchName } },
      include: { headCommit: { include: { files: true } } },
    });
    if (!branch?.headCommit) throw new AppError('Branch or file not found', 404);
    const normalized = filePath.replace(/^\/+/, '');
    const file = branch.headCommit.files.find((f) => f.path === normalized || f.path === filePath);
    if (!file) throw new AppError('File not found', 404);
    return file;
  }

  /**
   * Simple code search across repositories the account can access.
   * NOTE: This searches file contents for commits in the repositories,
   * not a full-text indexed engine. Intended as a basic, scoped search.
   */
  async searchCode(
    accountId: string,
    params: {
      query: string;
      repoId?: string;
      pathContains?: string;
      limit?: number;
    }
  ) {
    const rawQuery = (params.query || '').trim();
    if (!rawQuery) throw new AppError('Search query is required', 400);
    if (rawQuery.length > 200) throw new AppError('Search query is too long', 400);

    const repoIds = await getAccessibleRepoIds(accountId);
    if (repoIds.length === 0) return [];

    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

    const where: any = {
      commit: {
        repoId: { in: repoIds },
      },
    };

    if (params.repoId) {
      if (!repoIds.includes(params.repoId)) throw new AppError('Repository not found', 404);
      where.commit.repoId = params.repoId;
    }

    const orConditions: any[] = [
      { content: { contains: rawQuery, mode: 'insensitive' } },
      { path: { contains: rawQuery, mode: 'insensitive' } },
    ];

    where.OR = orConditions;

    if (params.pathContains) {
      where.path = { contains: params.pathContains, mode: 'insensitive' };
    }

    const files = await prisma.codeCommitFile.findMany({
      where,
      include: {
        commit: {
          include: {
            repo: {
              select: {
                id: true,
                name: true,
                slug: true,
                account: { select: { id: true, displayName: true, username: true } },
              },
            },
            branch: { select: { id: true, name: true } },
            author: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return files.map((f) => {
      const content = f.content || '';
      const idx = content.toLowerCase().indexOf(rawQuery.toLowerCase());
      const window = 140;
      let snippet: string;
      if (idx === -1) {
        snippet = content.slice(0, window * 2);
      } else {
        const start = Math.max(idx - window, 0);
        const end = Math.min(idx + rawQuery.length + window, content.length);
        snippet = content.slice(start, end);
      }

      return {
        id: f.id,
        path: f.path,
        contentPreview: snippet,
        repoId: f.commit.repo.id,
        repoName: f.commit.repo.name,
        repoSlug: f.commit.repo.slug,
        owner: f.commit.repo.account,
        branchId: f.commit.branch.id,
        branchName: f.commit.branch.name,
        commitId: f.commit.id,
        commitMessage: f.commit.message,
        commitCreatedAt: f.commit.createdAt,
        author: f.commit.author,
      };
    });
  }

  async createCommit(
    accountId: string,
    repoId: string,
    branchName: string,
    data: { message: string; files: { path: string; content: string }[] }
  ) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const branch = await prisma.codeBranch.findUnique({ where: { repoId_name: { repoId, name: branchName } } });
    if (!branch) throw new AppError('Branch not found', 404);
    if (!data.message?.trim() || data.message.length > 500) throw new AppError('Commit message required (max 500 chars)', 400);
    if (!data.files?.length) throw new AppError('At least one file required', 400);

    const commit = await prisma.codeCommit.create({
      data: {
        repoId,
        branchId: branch.id,
        parentCommitId: branch.headCommitId,
        message: data.message.trim().slice(0, 500),
        authorId: accountId,
      },
      include: { author: { select: { id: true, displayName: true } } },
    });
    await prisma.codeCommitFile.createMany({
      data: data.files.map((f) => ({ commitId: commit.id, path: f.path.slice(0, 500), content: f.content })),
    });
    await prisma.codeBranch.update({
      where: { id: branch.id },
      data: { headCommitId: commit.id },
    });
    return this.getCommit(accountId, repoId, commit.id);
  }

  async listRepoLabels(accountId: string, repoId: string) {
    await canAccessRepo(accountId, repoId);
    return prisma.codeRepoLabel.findMany({ where: { repoId }, orderBy: { name: 'asc' } });
  }

  async createRepoLabel(accountId: string, repoId: string, data: { name: string; color?: string }) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const name = (data.name || '').trim().slice(0, 50);
    if (!name) throw new AppError('Label name required', 400);
    const existing = await prisma.codeRepoLabel.findUnique({ where: { repoId_name: { repoId, name } } });
    if (existing) throw new AppError('Label already exists', 400);
    return prisma.codeRepoLabel.create({
      data: { repoId, name, color: (data.color || '').slice(0, 20) || undefined },
    });
  }

  async createPullRequest(
    accountId: string,
    repoId: string,
    data: {
      sourceBranchId: string;
      targetBranchId: string;
      title: string;
      description?: string;
      status?: 'OPEN' | 'DRAFT';
      reviewerAccountIds?: string[];
      labelIds?: string[];
      issueRefs?: string[];
    }
  ) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    if (data.sourceBranchId === data.targetBranchId) throw new AppError('Source and target branch must be different', 400);
    const title = (data.title || '').trim();
    if (title.length < 10 || title.length > 200) throw new AppError('Title must be 10–200 characters', 400);

    const [source, target] = await Promise.all([
      prisma.codeBranch.findFirst({ where: { id: data.sourceBranchId, repoId } }),
      prisma.codeBranch.findFirst({ where: { id: data.targetBranchId, repoId } }),
    ]);
    if (!source || !target) throw new AppError('Branch not found', 404);

    const { number } = await prisma.codePullRequest
      .aggregate({ where: { repoId }, _max: { number: true } })
      .then((r) => ({ number: (r._max.number ?? 0) + 1 }));

    const pr = await prisma.codePullRequest.create({
      data: {
        repoId,
        number,
        sourceBranchId: data.sourceBranchId,
        targetBranchId: data.targetBranchId,
        title,
        description: (data.description || '').slice(0, 10000) || undefined,
        status: data.status === 'DRAFT' ? 'DRAFT' : 'OPEN',
        authorId: accountId,
      },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        sourceBranch: true,
        targetBranch: true,
      },
    });

    if (data.reviewerAccountIds?.length) {
      await prisma.codePRReviewer.createMany({
        data: data.reviewerAccountIds.map((aid) => ({ prId: pr.id, accountId: aid })),
        skipDuplicates: true,
      });
    }
    if (data.labelIds?.length) {
      await prisma.codePRLabel.createMany({
        data: data.labelIds.map((labelId) => ({ prId: pr.id, labelId })),
        skipDuplicates: true,
      });
    }
    if (data.issueRefs?.length) {
      await prisma.codePRLinkedIssue.createMany({
        data: data.issueRefs.map((issueRef) => ({ prId: pr.id, issueRef: issueRef.slice(0, 100) })),
        skipDuplicates: true,
      });
    }

    return this.getPullRequest(accountId, repoId, pr.number);
  }

  async listPullRequests(accountId: string, repoId: string, status?: string) {
    await canAccessRepo(accountId, repoId);
    const where: any = { repoId };
    if (status && ['OPEN', 'DRAFT', 'CLOSED', 'MERGED'].includes(status)) where.status = status;
    return prisma.codePullRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        sourceBranch: true,
        targetBranch: true,
        _count: { select: { comments: true, reviewers: true } },
      },
    });
  }

  async getPullRequest(accountId: string, repoId: string, prNumber: number) {
    await canAccessRepo(accountId, repoId);
    const pr = await prisma.codePullRequest.findUnique({
      where: { repoId_number: { repoId, number: prNumber } },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        sourceBranch: { include: { headCommit: { include: { files: true } } } },
        targetBranch: { include: { headCommit: { include: { files: true } } } },
        reviewers: { include: { account: { select: { id: true, displayName: true, username: true } } } },
        comments: { where: { parentId: null }, include: { account: { select: { id: true, displayName: true } }, replies: { include: { account: { select: { id: true, displayName: true } } } } }, orderBy: { createdAt: 'asc' } },
        labels: { include: { label: true } },
        linkedIssues: true,
      },
    });
    if (!pr) throw new AppError('Pull request not found', 404);
    return pr;
  }

  async updatePullRequest(
    accountId: string,
    repoId: string,
    prNumber: number,
    data: { title?: string; description?: string; status?: string }
  ) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    if (pr.authorId !== accountId) throw new AppError('Only the author can update the PR', 403);
    if (pr.status !== 'OPEN' && pr.status !== 'DRAFT') throw new AppError('Cannot update closed or merged PR', 400);

    const update: any = {};
    if (data.title !== undefined) {
      const t = data.title.trim();
      if (t.length < 10 || t.length > 200) throw new AppError('Title must be 10–200 characters', 400);
      update.title = t;
    }
    if (data.description !== undefined) update.description = data.description?.slice(0, 10000) || null;
    if (['OPEN', 'DRAFT'].includes(data.status || '')) update.status = data.status;
    await prisma.codePullRequest.update({ where: { id: pr.id }, data: update });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async mergePullRequest(accountId: string, repoId: string, prNumber: number, method: 'merge' | 'squash' | 'rebase' = 'merge') {
    const mergeMethod = ['merge', 'squash', 'rebase'].includes(method) ? method : 'merge';
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({
      where: { repoId_number: { repoId, number: prNumber } },
      include: { sourceBranch: { include: { headCommit: { include: { files: true } } } }, targetBranch: true },
    });
    if (!pr) throw new AppError('Pull request not found', 404);
    if (pr.status !== 'OPEN') throw new AppError('PR is not open', 400);

    const approved = await prisma.codePRReviewer.findMany({
      where: { prId: pr.id, status: 'APPROVED' },
    });
    const requested = await prisma.codePRReviewer.findMany({
      where: { prId: pr.id, status: 'CHANGES_REQUESTED' },
    });
    if (requested.length > 0) throw new AppError('Cannot merge: changes requested by reviewer(s)', 400);

    const targetBranch = pr.targetBranch;
    const sourceCommit = pr.sourceBranch.headCommit;
    if (!sourceCommit) throw new AppError('Source branch has no commits', 400);

    const newCommit = await prisma.codeCommit.create({
      data: {
        repoId,
        branchId: targetBranch.id,
        parentCommitId: targetBranch.headCommitId,
        message: (mergeMethod === 'squash' || mergeMethod === 'rebase') ? pr.title : `Merge PR #${pr.number}: ${pr.title}`,
        authorId: accountId,
      },
      include: { author: { select: { id: true, displayName: true } } },
    });
    await prisma.codeCommitFile.createMany({
      data: sourceCommit.files.map((f) => ({ commitId: newCommit.id, path: f.path, content: f.content })),
    });
    await prisma.codeBranch.update({
      where: { id: targetBranch.id },
      data: { headCommitId: newCommit.id },
    });

    await prisma.codePullRequest.update({
      where: { id: pr.id },
      data: { status: 'MERGED', mergedAt: new Date(), mergedById: accountId },
    });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async closePullRequest(accountId: string, repoId: string, prNumber: number) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    if (pr.status !== 'OPEN' && pr.status !== 'DRAFT') throw new AppError('PR is already closed or merged', 400);
    await prisma.codePullRequest.update({ where: { id: pr.id }, data: { status: 'CLOSED' } });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async addPRReviewer(accountId: string, repoId: string, prNumber: number, reviewerAccountId: string) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    await prisma.codePRReviewer.upsert({
      where: { prId_accountId: { prId: pr.id, accountId: reviewerAccountId } },
      create: { prId: pr.id, accountId: reviewerAccountId },
      update: {},
    });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async setReviewStatus(accountId: string, repoId: string, prNumber: number, status: 'APPROVED' | 'CHANGES_REQUESTED') {
    await canAccessRepo(accountId, repoId);
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    await prisma.codePRReviewer.upsert({
      where: { prId_accountId: { prId: pr.id, accountId } },
      create: { prId: pr.id, accountId, status, reviewedAt: new Date() },
      update: { status, reviewedAt: new Date() },
    });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async addPRComment(
    accountId: string,
    repoId: string,
    prNumber: number,
    data: { body: string; path?: string; lineNumber?: number; parentId?: string }
  ) {
    await canAccessRepo(accountId, repoId);
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    const body = (data.body || '').trim();
    if (!body) throw new AppError('Comment body required', 400);
    return prisma.codePRComment.create({
      data: {
        prId: pr.id,
        accountId,
        body,
        path: data.path?.slice(0, 500),
        lineNumber: data.lineNumber ?? undefined,
        parentId: data.parentId || undefined,
      },
      include: { account: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async listPRComments(accountId: string, repoId: string, prNumber: number) {
    await canAccessRepo(accountId, repoId);
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    return prisma.codePRComment.findMany({
      where: { prId: pr.id },
      orderBy: { createdAt: 'asc' },
      include: {
        account: { select: { id: true, displayName: true } },
        replies: { include: { account: { select: { id: true, displayName: true } } } },
      },
    });
  }

  async addPRLabel(accountId: string, repoId: string, prNumber: number, labelId: string) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    const label = await prisma.codeRepoLabel.findFirst({ where: { id: labelId, repoId } });
    if (!label) throw new AppError('Label not found', 404);
    await prisma.codePRLabel.upsert({
      where: { prId_labelId: { prId: pr.id, labelId } },
      create: { prId: pr.id, labelId },
      update: {},
    });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async removePRLabel(accountId: string, repoId: string, prNumber: number, labelId: string) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    await prisma.codePRLabel.deleteMany({ where: { prId: pr.id, labelId } });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async linkPRIssue(accountId: string, repoId: string, prNumber: number, issueRef: string) {
    await canAccessRepo(accountId, repoId, 'WRITE');
    const pr = await prisma.codePullRequest.findUnique({ where: { repoId_number: { repoId, number: prNumber } } });
    if (!pr) throw new AppError('Pull request not found', 404);
    const ref = issueRef.trim().slice(0, 100);
    if (!ref) throw new AppError('Issue reference required', 400);
    await prisma.codePRLinkedIssue.upsert({
      where: { prId_issueRef: { prId: pr.id, issueRef: ref } },
      create: { prId: pr.id, issueRef: ref },
      update: {},
    });
    return this.getPullRequest(accountId, repoId, prNumber);
  }

  async getDiff(accountId: string, repoId: string, prNumber: number) {
    const pr = await this.getPullRequest(accountId, repoId, prNumber);
    const sourceFiles = (pr.sourceBranch?.headCommit?.files || []).reduce((acc: Record<string, string>, f) => {
      acc[f.path] = f.content;
      return acc;
    }, {});
    const targetFiles = (pr.targetBranch?.headCommit?.files || []).reduce((acc: Record<string, string>, f) => {
      acc[f.path] = f.content;
      return acc;
    }, {});

    const added = Object.keys(sourceFiles).filter((p) => !targetFiles[p]);
    const removed = Object.keys(targetFiles).filter((p) => !sourceFiles[p]);
    const modified = Object.keys(sourceFiles).filter((p) => targetFiles[p] && targetFiles[p] !== sourceFiles[p]);

    return {
      added: added.map((path) => ({ path, content: sourceFiles[path] })),
      removed: removed.map((path) => ({ path, content: targetFiles[path] })),
      modified: modified.map((path) => ({
        path,
        oldContent: targetFiles[path],
        newContent: sourceFiles[path],
      })),
    };
  }

  async getGitignoreTemplates() {
    return Object.keys(GITIGNORE_TEMPLATES);
  }

  async getLicenseTemplates() {
    return Object.keys(LICENSE_TEMPLATES);
  }

  async addCollaborator(accountId: string, repoId: string, collaboratorAccountId: string, role: 'READ' | 'WRITE' | 'ADMIN') {
    await canAccessRepo(accountId, repoId, 'ADMIN');
    await prisma.codeRepoCollaborator.upsert({
      where: { repoId_accountId: { repoId, accountId: collaboratorAccountId } },
      create: { repoId, accountId: collaboratorAccountId, role },
      update: { role },
    });
    return this.getRepo(accountId, repoId);
  }

  async removeCollaborator(accountId: string, repoId: string, collaboratorAccountId: string) {
    await canAccessRepo(accountId, repoId, 'ADMIN');
    if (collaboratorAccountId === (await prisma.codeRepository.findUnique({ where: { id: repoId }, select: { accountId: true } }))?.accountId) {
      throw new AppError('Cannot remove repository owner', 400);
    }
    await prisma.codeRepoCollaborator.deleteMany({ where: { repoId, accountId: collaboratorAccountId } });
    return this.getRepo(accountId, repoId);
  }
}
