/**
 * MOxE TRACK – Agile: projects, issues, sprints, boards, backlog.
 * Complements track.service (job postings, pipelines, applications).
 */
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

const DEFAULT_COLUMNS: Record<string, string[]> = {
  SCRUM: ['To Do', 'In Progress', 'Review', 'Done'],
  KANBAN: ['To Do', 'In Progress', 'Done'],
  BUG_TRACKING: ['New', 'In Progress', 'Fixed', 'Verified'],
  CUSTOM: ['To Do', 'In Progress', 'Done'],
};

export class TrackAgileService {
  async getProjects(accountId: string) {
    return prisma.trackProject.findMany({
      where: {
        OR: [
          { accountId },
          { members: { some: { accountId } } },
        ],
      },
      include: {
        lead: { select: { id: true, displayName: true, username: true, profilePhoto: true } },
        columns: { orderBy: { order: 'asc' } },
        _count: { select: { issues: true, sprints: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getProject(accountId: string, projectId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    return prisma.trackProject.findUnique({
      where: { id: projectId },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        lead: { select: { id: true, displayName: true, username: true } },
        columns: { orderBy: { order: 'asc' } },
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
        labels: true,
      },
    });
  }

  async createProject(accountId: string, data: {
    name: string;
    template?: string;
    leadAccountId?: string;
    description?: string;
    members?: { accountId: string; role: string }[];
  }) {
    const name = data.name.trim();
    if (name.length < 3 || name.length > 100) {
      throw new AppError('Project name must be 3–100 characters', 400);
    }
    const existing = await prisma.trackProject.findFirst({
      where: { accountId, name },
    });
    if (existing) throw new AppError('A project with this name already exists', 400);
    const template = (data.template || 'KANBAN').toUpperCase();
    if (!['SCRUM', 'KANBAN', 'BUG_TRACKING', 'CUSTOM'].includes(template)) {
      throw new AppError('Invalid template', 400);
    }
    const project = await prisma.trackProject.create({
      data: {
        accountId,
        name,
        template,
        leadAccountId: data.leadAccountId || undefined,
        description: data.description?.trim() || undefined,
      },
    });
    const columnNames = DEFAULT_COLUMNS[template] || DEFAULT_COLUMNS.KANBAN;
    await prisma.trackBoardColumn.createMany({
      data: columnNames.map((nameCol, i) => ({ projectId: project.id, name: nameCol, order: i })),
    });
    await prisma.trackProjectMember.create({
      data: { projectId: project.id, accountId, role: 'ADMIN' },
    });
    if (data.members?.length) {
      const validRoles = ['ADMIN', 'MEMBER', 'VIEWER'];
      for (const m of data.members) {
        if (m.accountId === accountId) continue;
        const role = validRoles.includes((m.role || 'MEMBER').toUpperCase()) ? (m.role || 'MEMBER').toUpperCase() : 'MEMBER';
        await prisma.trackProjectMember.upsert({
          where: { projectId_accountId: { projectId: project.id, accountId: m.accountId } },
          create: { projectId: project.id, accountId: m.accountId, role },
          update: { role },
        });
      }
    }
    return this.getProject(accountId, project.id);
  }

  async updateProject(accountId: string, projectId: string, data: {
    name?: string;
    template?: string;
    leadAccountId?: string;
    description?: string;
  }) {
    await this.ensureProjectAdmin(accountId, projectId);
    return prisma.trackProject.update({
      where: { id: projectId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.leadAccountId !== undefined && { leadAccountId: data.leadAccountId || null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
      include: {
        lead: { select: { id: true, displayName: true, username: true } },
        columns: { orderBy: { order: 'asc' } },
      },
    });
  }

  async deleteProject(accountId: string, projectId: string) {
    await this.ensureProjectAdmin(accountId, projectId);
    await prisma.trackProject.delete({ where: { id: projectId } });
    return { deleted: true };
  }

  async updateBoardColumn(accountId: string, columnId: string, data: { name?: string; wipLimit?: number | null }) {
    const column = await prisma.trackBoardColumn.findUnique({
      where: { id: columnId },
      include: { project: true },
    });
    if (!column) throw new AppError('Column not found', 404);
    await this.ensureProjectAdmin(accountId, column.projectId);
    return prisma.trackBoardColumn.update({
      where: { id: columnId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.wipLimit !== undefined && { wipLimit: data.wipLimit ?? null }),
      },
    });
  }

  private static readonly STORY_POINTS_VALID = [1, 2, 3, 5, 8, 13, 21];

  private buildIssueWhere(projectId: string, filters?: {
    assigneeId?: string;
    priority?: string;
    labelIds?: string[];
    q?: string;
    includeArchived?: boolean;
  }) {
    const where: any = { projectId };
    if (!filters?.includeArchived) where.archivedAt = null;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.labelIds?.length) {
      where.issueLabels = { some: { labelId: { in: filters.labelIds } } };
    }
    if (filters?.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { summary: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildIssueFilterOnly(filters?: {
    assigneeId?: string;
    priority?: string;
    labelIds?: string[];
    q?: string;
    includeArchived?: boolean;
    sprintId?: string;
  }) {
    const where: any = {};
    if (!filters?.includeArchived) where.archivedAt = null;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.labelIds?.length) where.issueLabels = { some: { labelId: { in: filters.labelIds } } };
    if (filters?.sprintId) where.sprintId = filters.sprintId;
    if (filters?.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { summary: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return Object.keys(where).length ? where : { archivedAt: null };
  }

  async getBoard(accountId: string, projectId: string, filters?: {
    assigneeId?: string;
    priority?: string;
    labelIds?: string[];
    q?: string;
    sprintId?: string;
  }) {
    await this.ensureProjectAccess(accountId, projectId);
    const issueFilter = this.buildIssueFilterOnly(filters);
    const project = await prisma.trackProject.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            issues: {
              ...(issueFilter && { where: issueFilter }),
              orderBy: { rank: 'asc' },
              include: {
                assignee: { select: { id: true, displayName: true, username: true, profilePhoto: true } },
                issueLabels: { include: { label: true } },
              },
            },
          },
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  }

  async getBacklog(accountId: string, projectId: string, filters?: {
    assigneeId?: string;
    priority?: string;
    labelIds?: string[];
    q?: string;
  }) {
    await this.ensureProjectAccess(accountId, projectId);
    const where = { ...this.buildIssueWhere(projectId, filters), sprintId: null };
    return prisma.trackIssue.findMany({
      where,
      orderBy: { rank: 'asc' },
      include: {
        assignee: { select: { id: true, displayName: true, username: true } },
        issueLabels: { include: { label: true } },
      },
    });
  }

  async createIssue(accountId: string, projectId: string, data: {
    issueType?: string;
    summary: string;
    description?: string;
    assigneeId?: string;
    priority?: string;
    storyPoints?: number;
    sprintId?: string;
    columnId?: string;
    dueDate?: string;
    labelIds?: string[];
    parentIssueId?: string;
  }) {
    await this.ensureProjectMember(accountId, projectId);
    const project = await prisma.trackProject.findUnique({
      where: { id: projectId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (!project) throw new AppError('Project not found', 404);
    const firstColumn = project.columns[0];
    if (!firstColumn) throw new AppError('Project has no columns', 400);
    const columnId = data.columnId || firstColumn.id;
    if (data.storyPoints != null && !TrackAgileService.STORY_POINTS_VALID.includes(data.storyPoints)) {
      throw new AppError('Story points must be one of: 1, 2, 3, 5, 8, 13, 21', 400);
    }
    const maxRank = await prisma.trackIssue.findMany({
      where: { projectId, sprintId: null, archivedAt: null },
      orderBy: { rank: 'desc' },
      take: 1,
      select: { rank: true },
    });
    const rank = (maxRank[0]?.rank ?? -1) + 1;
    const issue = await prisma.trackIssue.create({
      data: {
        projectId,
        parentIssueId: data.parentIssueId || undefined,
        issueType: (data.issueType || 'TASK').toUpperCase(),
        summary: data.summary.trim(),
        description: data.description?.trim() || undefined,
        assigneeId: data.assigneeId || undefined,
        priority: (data.priority || 'MEDIUM').toUpperCase(),
        storyPoints: data.storyPoints ?? undefined,
        sprintId: data.sprintId || undefined,
        columnId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        rank,
        createdById: accountId,
      },
    });
    if (data.labelIds?.length) {
      await prisma.trackIssueLabel.createMany({
        data: data.labelIds.map((labelId) => ({ issueId: issue.id, labelId })),
        skipDuplicates: true,
      });
    }
    return this.getIssue(accountId, issue.id);
  }

  async getIssue(accountId: string, issueId: string) {
    const issue = await prisma.trackIssue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        parentIssue: { select: { id: true, summary: true, issueType: true } },
        childIssues: { select: { id: true, summary: true, issueType: true, columnId: true } },
        assignee: { select: { id: true, displayName: true, username: true, profilePhoto: true } },
        creator: { select: { id: true, displayName: true, username: true } },
        column: true,
        sprint: true,
        issueLabels: { include: { label: true } },
        attachments: true,
      },
    });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectAccess(accountId, issue.projectId);
    return issue;
  }

  async updateIssue(accountId: string, issueId: string, data: {
    summary?: string;
    description?: string;
    assigneeId?: string;
    priority?: string;
    storyPoints?: number;
    sprintId?: string;
    dueDate?: string;
  }) {
    if (data.storyPoints != null && !TrackAgileService.STORY_POINTS_VALID.includes(data.storyPoints)) {
      throw new AppError('Story points must be one of: 1, 2, 3, 5, 8, 13, 21', 400);
    }
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    return prisma.trackIssue.update({
      where: { id: issueId },
      data: {
        ...(data.summary !== undefined && { summary: data.summary.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
        ...(data.priority !== undefined && { priority: data.priority.toUpperCase() }),
        ...(data.storyPoints !== undefined && { storyPoints: data.storyPoints }),
        ...(data.sprintId !== undefined && { sprintId: data.sprintId || null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      },
      include: {
        assignee: { select: { id: true, displayName: true, username: true } },
        column: true,
        sprint: true,
        issueLabels: { include: { label: true } },
      },
    });
  }

  async moveIssue(accountId: string, issueId: string, targetColumnId: string, newRank?: number) {
    const issue = await prisma.trackIssue.findUnique({
      where: { id: issueId },
      include: { column: { include: { project: true } } },
    });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.column.projectId);
    const target = await prisma.trackBoardColumn.findFirst({
      where: { id: targetColumnId, projectId: issue.column.projectId },
    });
    if (!target) throw new AppError('Target column not found', 400);
    return prisma.trackIssue.update({
      where: { id: issueId },
      data: { columnId: targetColumnId, ...(newRank !== undefined && { rank: newRank }) },
      include: {
        assignee: { select: { id: true, displayName: true, username: true } },
        column: true,
        issueLabels: { include: { label: true } },
      },
    });
  }

  async deleteIssue(accountId: string, issueId: string) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    await prisma.trackIssue.delete({ where: { id: issueId } });
    return { deleted: true };
  }

  async reorderBacklog(accountId: string, projectId: string, issueIds: string[]) {
    await this.ensureProjectMember(accountId, projectId);
    await prisma.$transaction(
      issueIds.map((id, i) =>
        prisma.trackIssue.update({ where: { id, projectId, archivedAt: null }, data: { rank: i } })
      )
    );
    return this.getBacklog(accountId, projectId);
  }

  async calculateCapacity(accountId: string, projectId: string, sprintId?: string) {
    await this.ensureProjectAccess(accountId, projectId);
    const completed = await prisma.trackSprint.findMany({
      where: { projectId, status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: 5,
      include: {
        issues: {
          where: { archivedAt: null },
          select: { storyPoints: true },
        },
      },
    });
    const velocities = completed.map((s) => {
      const points = s.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
      return points;
    });
    const averageVelocity = velocities.length
      ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
      : null;
    return {
      averageVelocity,
      recommendedPoints: averageVelocity ?? 0,
      completedSprintCount: velocities.length,
      lastVelocities: velocities.slice(0, 3),
    };
  }

  async splitIssue(accountId: string, issueId: string, data: { childSummaries: string[] }) {
    const parent = await prisma.trackIssue.findUnique({
      where: { id: issueId },
      include: { project: { include: { columns: { orderBy: { order: 'asc' } } } } },
    });
    if (!parent) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, parent.projectId);
    if (!data.childSummaries?.length) throw new AppError('At least one child summary required', 400);
    const firstColumn = parent.project.columns[0];
    if (!firstColumn) throw new AppError('Project has no columns', 400);
    const created = await prisma.$transaction(
      data.childSummaries.map((summary, i) =>
        prisma.trackIssue.create({
          data: {
            projectId: parent.projectId,
            parentIssueId: parent.id,
            issueType: parent.issueType === 'EPIC' ? 'STORY' : 'TASK',
            summary: summary.trim(),
            columnId: parent.columnId,
            rank: parent.rank + i,
            createdById: accountId,
            priority: parent.priority,
          },
        })
      )
    );
    return created;
  }

  async archiveIssues(accountId: string, projectId: string, issueIds: string[]) {
    await this.ensureProjectMember(accountId, projectId);
    if (!issueIds?.length) throw new AppError('At least one issue required', 400);
    await prisma.trackIssue.updateMany({
      where: { id: { in: issueIds }, projectId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    return this.getBacklog(accountId, projectId);
  }

  async getArchivedIssues(accountId: string, projectId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    return prisma.trackIssue.findMany({
      where: { projectId, archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
      include: {
        assignee: { select: { id: true, displayName: true, username: true } },
        issueLabels: { include: { label: true } },
      },
    });
  }

  async unarchiveIssue(accountId: string, issueId: string) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    await prisma.trackIssue.update({
      where: { id: issueId },
      data: { archivedAt: null },
    });
    return this.getIssue(accountId, issueId);
  }

  async getSprints(accountId: string, projectId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    return prisma.trackSprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { issues: true } } },
    });
  }

  async createSprint(accountId: string, projectId: string, data: {
    name: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
  }) {
    await this.ensureProjectMember(accountId, projectId);
    return prisma.trackSprint.create({
      data: {
        projectId,
        name: data.name.trim(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        goal: data.goal?.trim() || undefined,
      },
    });
  }

  async startSprint(accountId: string, sprintId: string) {
    const sprint = await prisma.trackSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);
    await this.ensureProjectAdmin(accountId, sprint.projectId);
    await prisma.trackSprint.updateMany({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
      data: { status: 'COMPLETED' },
    });
    return prisma.trackSprint.update({
      where: { id: sprintId },
      data: { status: 'ACTIVE', startDate: sprint.startDate || new Date() },
    });
  }

  async completeSprint(accountId: string, sprintId: string) {
    const sprint = await prisma.trackSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);
    await this.ensureProjectAdmin(accountId, sprint.projectId);
    await prisma.trackIssue.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    });
    return prisma.trackSprint.update({
      where: { id: sprintId },
      data: { status: 'COMPLETED', endDate: new Date() },
    });
  }

  async addIssueToSprint(accountId: string, issueId: string, sprintId: string) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    const sprint = await prisma.trackSprint.findUnique({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== issue.projectId) throw new AppError('Sprint not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    return prisma.trackIssue.update({
      where: { id: issueId },
      data: { sprintId },
      include: { assignee: true, column: true, sprint: true, issueLabels: { include: { label: true } } },
    });
  }

  // ----- Labels -----
  async getLabels(accountId: string, projectId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    return prisma.trackLabel.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(accountId: string, projectId: string, data: { name: string; color?: string }) {
    await this.ensureProjectMember(accountId, projectId);
    const name = data.name.trim();
    if (!name) throw new AppError('Label name required', 400);
    return prisma.trackLabel.create({
      data: { projectId, name, color: data.color?.trim() || '#6B7280' },
    });
  }

  async updateLabel(accountId: string, labelId: string, data: { name?: string; color?: string }) {
    const label = await prisma.trackLabel.findUnique({ where: { id: labelId } });
    if (!label) throw new AppError('Label not found', 404);
    await this.ensureProjectMember(accountId, label.projectId);
    return prisma.trackLabel.update({
      where: { id: labelId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.color !== undefined && { color: data.color?.trim() || '#6B7280' }),
      },
    });
  }

  async deleteLabel(accountId: string, labelId: string) {
    const label = await prisma.trackLabel.findUnique({ where: { id: labelId } });
    if (!label) throw new AppError('Label not found', 404);
    await this.ensureProjectMember(accountId, label.projectId);
    await prisma.trackLabel.delete({ where: { id: labelId } });
    return { deleted: true };
  }

  async addLabelToIssue(accountId: string, issueId: string, labelId: string) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    const label = await prisma.trackLabel.findUnique({ where: { id: labelId } });
    if (!label || label.projectId !== issue.projectId) throw new AppError('Label not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    await prisma.trackIssueLabel.upsert({
      where: { issueId_labelId: { issueId, labelId } },
      create: { issueId, labelId },
      update: {},
    });
    return this.getIssue(accountId, issueId);
  }

  async removeLabelFromIssue(accountId: string, issueId: string, labelId: string) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    await prisma.trackIssueLabel.deleteMany({ where: { issueId, labelId } });
    return this.getIssue(accountId, issueId);
  }

  // ----- Attachments -----
  async addAttachment(accountId: string, issueId: string, data: { url: string; fileName: string; fileSize?: number }) {
    const issue = await prisma.trackIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AppError('Issue not found', 404);
    await this.ensureProjectMember(accountId, issue.projectId);
    return prisma.trackAttachment.create({
      data: {
        issueId,
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize ?? 0,
        uploadedById: accountId,
      },
    });
  }

  async deleteAttachment(accountId: string, attachmentId: string) {
    const att = await prisma.trackAttachment.findUnique({ where: { id: attachmentId }, include: { issue: true } });
    if (!att) throw new AppError('Attachment not found', 404);
    await this.ensureProjectMember(accountId, att.issue.projectId);
    await prisma.trackAttachment.delete({ where: { id: attachmentId } });
    return { deleted: true };
  }

  // ----- Export -----
  async exportBoard(accountId: string, projectId: string, format: 'csv' | 'json', filters?: {
    assigneeId?: string;
    priority?: string;
    labelIds?: string[];
    q?: string;
  }) {
    await this.ensureProjectAccess(accountId, projectId);
    const where = this.buildIssueWhere(projectId, filters);
    const issues = await prisma.trackIssue.findMany({
      where,
      orderBy: [{ column: { order: 'asc' } }, { rank: 'asc' }],
      include: {
        assignee: { select: { displayName: true, username: true } },
        column: true,
        sprint: true,
        issueLabels: { include: { label: true } },
      },
    });
    if (format === 'json') return { issues };
    const rows = issues.map((i) => ({
      id: i.id,
      summary: i.summary,
      issueType: i.issueType,
      priority: i.priority,
      storyPoints: i.storyPoints,
      column: i.column?.name,
      sprint: i.sprint?.name,
      assignee: i.assignee?.displayName || i.assignee?.username,
      dueDate: i.dueDate?.toISOString().slice(0, 10),
      labels: (i.issueLabels as any[])?.map((il) => il.label?.name).filter(Boolean).join('; ') || '',
    }));
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(','), ...rows.map((r) => header.map((k) => `"${String((r as any)[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    return { csv, filename: `board-export-${projectId.slice(-6)}-${Date.now()}.csv` };
  }

  // ----- Bulk update -----
  async bulkUpdateIssues(accountId: string, projectId: string, data: {
    issueIds: string[];
    updates: {
      assigneeId?: string | null;
      priority?: string;
      columnId?: string;
      sprintId?: string | null;
      labelIds?: string[];
      storyPoints?: number | null;
      dueDate?: string | null;
    };
  }) {
    await this.ensureProjectMember(accountId, projectId);
    const { issueIds, updates } = data;
    if (!issueIds?.length || !updates || Object.keys(updates).length === 0) {
      throw new AppError('issueIds and updates required', 400);
    }
    if (updates.storyPoints != null && !TrackAgileService.STORY_POINTS_VALID.includes(updates.storyPoints)) {
      throw new AppError('Story points must be one of: 1, 2, 3, 5, 8, 13, 21', 400);
    }
    const project = await prisma.trackProject.findUnique({
      where: { id: projectId },
      include: { columns: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    if (updates.columnId) {
      const col = project.columns.find((c) => c.id === updates.columnId);
      if (!col) throw new AppError('Column not found', 400);
    }
    const updatePayload: any = {};
    if (updates.assigneeId !== undefined) updatePayload.assigneeId = updates.assigneeId || null;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority.toUpperCase();
    if (updates.columnId !== undefined) updatePayload.columnId = updates.columnId;
    if (updates.sprintId !== undefined) updatePayload.sprintId = updates.sprintId || null;
    if (updates.storyPoints !== undefined) updatePayload.storyPoints = updates.storyPoints;
    if (updates.dueDate !== undefined) updatePayload.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    await prisma.$transaction([
      ...issueIds.map((id) =>
        prisma.trackIssue.updateMany({
          where: { id, projectId },
          data: updatePayload,
        })
      ),
    ]);
    if (updates.labelIds !== undefined) {
      for (const issueId of issueIds) {
        await prisma.trackIssueLabel.deleteMany({ where: { issueId } });
        if (updates.labelIds.length) {
          await prisma.trackIssueLabel.createMany({
            data: updates.labelIds.map((labelId) => ({ issueId, labelId })),
            skipDuplicates: true,
          });
        }
      }
    }
    return this.getBacklog(accountId, projectId);
  }

  // ----- CSV import -----
  async importIssuesFromCsv(accountId: string, projectId: string, csvText: string) {
    await this.ensureProjectMember(accountId, projectId);
    const project = await prisma.trackProject.findUnique({
      where: { id: projectId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (!project) throw new AppError('Project not found', 404);
    const firstColumn = project.columns[0];
    if (!firstColumn) throw new AppError('Project has no columns', 400);
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new AppError('CSV must have header and at least one row', 400);
    const header = lines[0].toLowerCase();
    const parseRow = (line: string): string[] => {
      const out: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if ((c === ',' && !inQuotes) || c === '\n') {
          out.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          cur = '';
        } else {
          cur += c;
        }
      }
      out.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return out;
    };
    const summaryIdx = header.indexOf('summary') >= 0 ? header.indexOf('summary') : (header.indexOf('title') >= 0 ? header.indexOf('title') : 0);
    const descIdx = header.indexOf('description') >= 0 ? header.indexOf('description') : -1;
    const typeIdx = header.indexOf('issuetype') >= 0 ? header.indexOf('issuetype') : (header.indexOf('type') >= 0 ? header.indexOf('type') : -1);
    const priorityIdx = header.indexOf('priority') >= 0 ? header.indexOf('priority') : -1;
    const created: any[] = [];
    let rank = await prisma.trackIssue.findMany({
      where: { projectId, sprintId: null },
      orderBy: { rank: 'desc' },
      take: 1,
      select: { rank: true },
    }).then((r) => (r[0]?.rank ?? -1) + 1);
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      const summary = (cells[summaryIdx] || '').replace(/^"|"$/g, '').trim();
      if (!summary) continue;
      const issueType = (typeIdx >= 0 && cells[typeIdx]) ? String(cells[typeIdx]).toUpperCase().replace(/^"|"$/g, '') : 'TASK';
      const priority = (priorityIdx >= 0 && cells[priorityIdx]) ? String(cells[priorityIdx]).toUpperCase().replace(/^"|"$/g, '') : 'MEDIUM';
      const description = descIdx >= 0 && cells[descIdx] ? String(cells[descIdx]).replace(/^"|"$/g, '').trim() : undefined;
      const issue = await prisma.trackIssue.create({
        data: {
          projectId,
          issueType: ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'].includes(issueType) ? issueType : 'TASK',
          summary,
          description: description || undefined,
          priority: ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'].includes(priority) ? priority : 'MEDIUM',
          columnId: firstColumn.id,
          rank,
          createdById: accountId,
        },
      });
      created.push(issue);
      rank++;
    }
    return { imported: created.length, issues: created };
  }

  private async ensureProjectAccess(accountId: string, projectId: string) {
    const project = await prisma.trackProject.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    if (project.accountId !== accountId && !project.members.some((m) => m.accountId === accountId)) {
      throw new AppError('Access denied', 403);
    }
  }

  private async ensureProjectMember(accountId: string, projectId: string) {
    const project = await prisma.trackProject.findFirst({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    const isAdmin = project.accountId === accountId;
    const member = project.members.find((m) => m.accountId === accountId);
    if (!isAdmin && !member) throw new AppError('Access denied', 403);
    if (member && member.role === 'VIEWER') throw new AppError('Viewer cannot modify', 403);
  }

  private async ensureProjectAdmin(accountId: string, projectId: string) {
    const project = await prisma.trackProject.findFirst({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    if (project.accountId !== accountId) {
      const m = project.members.find((x) => x.accountId === accountId);
      if (!m || m.role !== 'ADMIN') throw new AppError('Admin access required', 403);
    }
  }
}
