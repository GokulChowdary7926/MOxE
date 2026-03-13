/**
 * MOxE WORK – Business Project Planning
 * Projects, task lists, tasks, goals, team, dependencies, Gantt.
 */
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

const PROJECT_TYPES = ['CAMPAIGN', 'EVENT', 'INITIATIVE', 'PRODUCT_LAUNCH', 'INTERNAL', 'PERSONAL'] as const;
const MEMBER_ROLES = ['LEAD', 'MEMBER', 'CONTRIBUTOR', 'STAKEHOLDER', 'APPROVER'] as const;
const DEPENDENCY_TYPES = ['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'] as const;

export class WorkService {
  private async ensureProjectAccess(accountId: string, projectId: string) {
    const project = await prisma.workProject.findUnique({
      where: { id: projectId },
      select: { accountId: true, members: { select: { accountId: true } } },
    });
    if (!project) throw new AppError('Project not found', 404);
    const canAccess =
      project.accountId === accountId ||
      project.members.some((m) => m.accountId === accountId);
    if (!canAccess) throw new AppError('Not authorized for this project', 403);
  }

  /** List projects for account (owner or member). */
  async listProjects(accountId: string) {
    const owned = await prisma.workProject.findMany({
      where: { accountId },
      include: {
        taskLists: { include: { _count: { select: { tasks: true } } } },
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const memberOf = await prisma.workProjectMember.findMany({
      where: { accountId, project: { accountId: { not: accountId } } },
      include: {
        project: {
          include: {
            taskLists: { include: { _count: { select: { tasks: true } } } },
            members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
          },
        },
      },
    });
    const combined = [
      ...owned.map((p) => ({ ...p, role: 'LEAD' as const })),
      ...memberOf.map((m) => ({ ...m.project, role: m.role as typeof MEMBER_ROLES[number] })),
    ];
    return combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /** Get single project by id or slug. */
  async getProject(accountId: string, idOrSlug: string) {
    const isSlug = !idOrSlug.includes('_') && idOrSlug.length < 30;
    const project = await prisma.workProject.findFirst({
      where: isSlug ? { slug: idOrSlug } : { id: idOrSlug },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
        taskLists: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignedTo: { select: { id: true, displayName: true, username: true } },
                checklist: { orderBy: { order: 'asc' } },
                _count: { select: { comments: true, attachments: true } },
              },
            },
          },
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    await this.ensureProjectAccess(accountId, project.id);
    return project;
  }

  /** Create business project. */
  async createProject(accountId: string, data: {
    name: string;
    projectType?: string;
    startDate?: Date;
    endDate?: Date;
    budgetAmount?: number;
    budgetCurrency?: string;
    budgetBreakdown?: Record<string, number>;
    goals?: Array<{ objective: string; keyResults?: string[]; targetDate?: string; ownerId?: string }>;
    memberIds?: string[];
  }) {
    const name = data.name.trim();
    if (name.length < 3 || name.length > 100) {
      throw new AppError('Project name must be 3–100 characters', 400);
    }
    const projectType = data.projectType && PROJECT_TYPES.includes(data.projectType as any)
      ? data.projectType
      : 'INTERNAL';
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let n = 0;
    while (true) {
    const exists = await prisma.workProject.findUnique({
      where: { slug },
    });
      if (!exists) break;
      slug = `${baseSlug}-${++n}`;
    }
    const project = await prisma.workProject.create({
      data: {
        accountId,
        name,
        slug,
        projectType,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budgetAmount: data.budgetAmount,
        budgetCurrency: data.budgetCurrency || 'USD',
        budgetBreakdown: data.budgetBreakdown ?? undefined,
        goals: data.goals?.length ? (data.goals as any) : undefined,
      },
      include: {
        taskLists: true,
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
    });
    if (data.memberIds?.length) {
      for (const accountIdMember of data.memberIds) {
        if (accountIdMember === accountId) continue;
        await prisma.workProjectMember.create({
          data: { projectId: project.id, accountId: accountIdMember, role: 'MEMBER' },
        });
      }
    }
    return prisma.workProject.findUnique({
      where: { id: project.id },
      include: {
        taskLists: true,
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
    });
  }

  /** Update project. */
  async updateProject(accountId: string, projectId: string, data: Partial<{
    name: string;
    projectType: string;
    startDate: Date;
    endDate: Date;
    budgetAmount: number;
    budgetCurrency: string;
    budgetBreakdown: Record<string, number>;
    goals: any;
  }>) {
    await this.ensureProjectAccess(accountId, projectId);
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) throw new AppError('Project name must be 3–100 characters', 400);
    }
    return prisma.workProject.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.projectType && { projectType: data.projectType }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.budgetAmount !== undefined && { budgetAmount: data.budgetAmount }),
        ...(data.budgetCurrency && { budgetCurrency: data.budgetCurrency }),
        ...(data.budgetBreakdown !== undefined && { budgetBreakdown: data.budgetBreakdown }),
        ...(data.goals !== undefined && { goals: data.goals }),
        updatedAt: new Date(),
      },
      include: { taskLists: true, members: { include: { account: { select: { id: true, displayName: true } } } } },
    });
  }

  /** Delete project. */
  async deleteProject(accountId: string, projectId: string) {
    const project = await prisma.workProject.findUnique({ where: { id: projectId }, select: { accountId: true } });
    if (!project) throw new AppError('Project not found', 404);
    if (project.accountId !== accountId) throw new AppError('Only the project owner can delete it', 403);
    await prisma.workProject.delete({ where: { id: projectId } });
    return { ok: true };
  }

  /** Add project member. */
  async addMember(accountId: string, projectId: string, memberAccountId: string, role?: string) {
    await this.ensureProjectAccess(accountId, projectId);
    const r = role && MEMBER_ROLES.includes(role as any) ? role : 'MEMBER';
    await prisma.workProjectMember.upsert({
      where: { projectId_accountId: { projectId, accountId: memberAccountId } },
      create: { projectId, accountId: memberAccountId, role: r },
      update: { role: r },
    });
    return prisma.workProject.findUnique({
      where: { id: projectId },
      include: { members: { include: { account: { select: { id: true, displayName: true, username: true } } } } },
    });
  }

  /** Remove project member. */
  async removeMember(accountId: string, projectId: string, memberAccountId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    await prisma.workProjectMember.deleteMany({
      where: { projectId, accountId: memberAccountId },
    });
    return { ok: true };
  }

  /** Create task list. */
  async createTaskList(accountId: string, projectId: string, name: string) {
    await this.ensureProjectAccess(accountId, projectId);
    const maxOrder = await prisma.workTaskList.aggregate({
      where: { projectId },
      _max: { order: true },
    });
    return prisma.workTaskList.create({
      data: { projectId, name, order: (maxOrder._max.order ?? -1) + 1 },
      include: { tasks: true },
    });
  }

  /** Update task list. */
  async updateTaskList(accountId: string, listId: string, data: { name?: string; order?: number }) {
    const list = await prisma.workTaskList.findUnique({ where: { id: listId }, select: { projectId: true } });
    if (!list) throw new AppError('Task list not found', 404);
    await this.ensureProjectAccess(accountId, list.projectId);
    return prisma.workTaskList.update({
      where: { id: listId },
      data: { ...(data.name && { name: data.name }), ...(data.order !== undefined && { order: data.order }) },
      include: { tasks: true },
    });
  }

  /** Delete task list. */
  async deleteTaskList(accountId: string, listId: string) {
    const list = await prisma.workTaskList.findUnique({ where: { id: listId }, select: { projectId: true } });
    if (!list) throw new AppError('Task list not found', 404);
    await this.ensureProjectAccess(accountId, list.projectId);
    await prisma.workTaskList.delete({ where: { id: listId } });
    return { ok: true };
  }

  /** Add task. */
  async addTask(accountId: string, taskListId: string, data: {
    title: string;
    description?: string;
    assignedToId?: string;
    dueDate?: Date;
    priority?: string;
    startDate?: Date;
    durationDays?: number;
  }) {
    const list = await prisma.workTaskList.findUnique({ where: { id: taskListId }, select: { projectId: true } });
    if (!list) throw new AppError('Task list not found', 404);
    await this.ensureProjectAccess(accountId, list.projectId);
    const title = (data.title || '').trim();
    if (!title || title.length > 200) throw new AppError('Task title required, max 200 characters', 400);
    const maxOrder = await prisma.workTask.aggregate({
      where: { taskListId },
      _max: { order: true },
    });
    return prisma.workTask.create({
      data: {
        taskListId,
        title,
        description: data.description?.trim() || undefined,
        assignedToId: data.assignedToId || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority === 'HIGH' || data.priority === 'LOW' ? data.priority : 'MEDIUM',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        durationDays: data.durationDays ?? undefined,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        checklist: true,
      },
    });
  }

  /** Update task. */
  async updateTask(accountId: string, taskId: string, data: Partial<{
    title: string;
    description: string;
    assignedToId: string | null;
    dueDate: Date | null;
    priority: string;
    status: string;
    progress: number;
    startDate: Date | null;
    durationDays: number | null;
    order: number;
  }>) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    const payload: any = { updatedAt: new Date() };
    if (data.title !== undefined) {
      const t = data.title.trim();
      if (!t || t.length > 200) throw new AppError('Task title required, max 200 characters', 400);
      payload.title = t;
    }
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.assignedToId !== undefined) payload.assignedToId = data.assignedToId || null;
    if (data.dueDate !== undefined) payload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.status !== undefined) payload.status = data.status;
    if (data.progress !== undefined) payload.progress = Math.max(0, Math.min(100, data.progress));
    if (data.startDate !== undefined) payload.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.durationDays !== undefined) payload.durationDays = data.durationDays;
    if (data.order !== undefined) payload.order = data.order;
    if (data.status === 'DONE') payload.completedAt = new Date();
    else if (data.status && data.status !== 'DONE') payload.completedAt = null;
    return prisma.workTask.update({
      where: { id: taskId },
      data: payload,
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        checklist: true,
      },
    });
  }

  /** Complete task (set status DONE, progress 100). */
  async completeTask(accountId: string, taskId: string) {
    return this.updateTask(accountId, taskId, { status: 'DONE', progress: 100 });
  }

  /** Get single task with checklist, comments, and attachments (for detail view). */
  async getTask(accountId: string, taskId: string) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: {
        taskList: { select: { projectId: true, name: true } },
        assignedTo: { select: { id: true, displayName: true, username: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' }, include: { account: { select: { id: true, displayName: true, username: true } } } },
        attachments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    return task;
  }

  /** Add attachment to task (fileUrl from upload, optional fileName). */
  async addTaskAttachment(accountId: string, taskId: string, fileUrl: string, fileName?: string) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    return prisma.workTaskAttachment.create({
      data: { taskId, accountId, fileUrl: fileUrl.trim(), fileName: fileName?.trim() || undefined },
    });
  }

  /** Delete task attachment. */
  async deleteTaskAttachment(accountId: string, attachmentId: string) {
    const att = await prisma.workTaskAttachment.findUnique({
      where: { id: attachmentId },
      include: { task: { include: { taskList: { select: { projectId: true } } } } },
    });
    if (!att) throw new AppError('Attachment not found', 404);
    await this.ensureProjectAccess(accountId, att.task.taskList.projectId);
    await prisma.workTaskAttachment.delete({ where: { id: attachmentId } });
    return { ok: true };
  }

  /** Delete task. */
  async deleteTask(accountId: string, taskId: string) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    await prisma.workTask.delete({ where: { id: taskId } });
    return { ok: true };
  }

  /** Add checklist item. */
  async addChecklistItem(accountId: string, taskId: string, text: string) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    const maxOrder = await prisma.workTaskChecklistItem.aggregate({
      where: { taskId },
      _max: { order: true },
    });
    return prisma.workTaskChecklistItem.create({
      data: { taskId, text: text.trim(), order: (maxOrder._max.order ?? -1) + 1 },
    });
  }

  /** Toggle checklist item completed. */
  async toggleChecklistItem(accountId: string, itemId: string) {
    const item = await prisma.workTaskChecklistItem.findUnique({
      where: { id: itemId },
      include: { task: { include: { taskList: { select: { projectId: true } } } } },
    });
    if (!item) throw new AppError('Checklist item not found', 404);
    await this.ensureProjectAccess(accountId, item.task.taskList.projectId);
    return prisma.workTaskChecklistItem.update({
      where: { id: itemId },
      data: { completed: !item.completed },
    });
  }

  /** Add comment to task. */
  async addComment(accountId: string, taskId: string, body: string) {
    const task = await prisma.workTask.findUnique({
      where: { id: taskId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!task) throw new AppError('Task not found', 404);
    await this.ensureProjectAccess(accountId, task.taskList.projectId);
    return prisma.workTaskComment.create({
      data: { taskId, accountId, body: body.trim() },
      include: { account: { select: { id: true, displayName: true, username: true } } },
    });
  }

  /** Set task dependency. */
  async setDependency(accountId: string, predecessorId: string, successorId: string, type?: string) {
    const pred = await prisma.workTask.findUnique({
      where: { id: predecessorId },
      include: { taskList: { select: { projectId: true } } },
    });
    if (!pred) throw new AppError('Predecessor task not found', 404);
    await this.ensureProjectAccess(accountId, pred.taskList.projectId);
    const succ = await prisma.workTask.findUnique({ where: { id: successorId }, select: { id: true } });
    if (!succ) throw new AppError('Successor task not found', 404);
    if (predecessorId === successorId) throw new AppError('Task cannot depend on itself', 400);
    const depType = type && DEPENDENCY_TYPES.includes(type as any) ? type : 'FINISH_TO_START';
    return prisma.workTaskDependency.upsert({
      where: { predecessorId_successorId: { predecessorId, successorId } },
      create: { predecessorId, successorId, dependencyType: depType },
      update: { dependencyType: depType },
      include: { predecessor: true, successor: true },
    });
  }

  /** Get project data for Gantt (tasks with dates, dependencies, critical path). */
  async getProjectGantt(accountId: string, projectId: string) {
    await this.ensureProjectAccess(accountId, projectId);
    const project = await prisma.workProject.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    const tasks = await prisma.workTask.findMany({
      where: { taskList: { projectId } },
      include: {
        taskList: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, displayName: true } },
        dependenciesOut: { include: { successor: { select: { id: true, title: true, startDate: true, dueDate: true, durationDays: true } } } },
        dependenciesIn: { include: { predecessor: { select: { id: true } } } },
      },
      orderBy: [{ taskList: { order: 'asc' } }, { order: 'asc' }],
    });
    const criticalTaskIds = this.computeCriticalPath(tasks);
    return { project, tasks, criticalTaskIds };
  }

  /** Compute critical path: task IDs on the longest path (zero slack). */
  private computeCriticalPath(tasks: any[]): string[] {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const getDuration = (t: any): number => {
      if (t.durationDays != null && t.durationDays > 0) return t.durationDays;
      if (t.startDate && t.dueDate) return Math.max(1, Math.ceil((new Date(t.dueDate).getTime() - new Date(t.startDate).getTime()) / 86400000));
      if (t.dueDate) return 1;
      return 1;
    };
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();
    const visit = (id: string): number => {
      if (earliestFinish.has(id)) return earliestFinish.get(id)!;
      const t = byId.get(id);
      if (!t) return 0;
      let es = 0;
      for (const dep of t.dependenciesIn || []) {
        const predId = dep.predecessor?.id;
        if (predId) es = Math.max(es, visit(predId));
      }
      const dur = getDuration(t);
      earliestStart.set(id, es);
      earliestFinish.set(id, es + dur);
      return es + dur;
    };
    tasks.forEach((t) => visit(t.id));
    const projectEnd = Math.max(0, ...Array.from(earliestFinish.values()));
    const latestFinish = new Map<string, number>();
    const latestStart = new Map<string, number>();
    const visitBack = (id: string): number => {
      if (latestStart.has(id)) return latestStart.get(id)!;
      const t = byId.get(id);
      if (!t) return projectEnd;
      const succs = (t.dependenciesOut || []).map((d: any) => d.successor?.id).filter(Boolean);
      let lf = projectEnd;
      if (succs.length > 0) lf = Math.min(...succs.map((sid: string) => visitBack(sid)));
      const dur = getDuration(t);
      latestFinish.set(id, lf);
      latestStart.set(id, lf - dur);
      return lf - dur;
    };
    tasks.forEach((t) => visitBack(t.id));
    const critical: string[] = [];
    tasks.forEach((t) => {
      const es = earliestStart.get(t.id) ?? 0;
      const ls = latestStart.get(t.id) ?? es;
      const slack = ls - es;
      if (slack <= 0.01) critical.push(t.id);
    });
    return critical;
  }

  /** Get accounts for assignment (same as track: assignment accounts or org). */
  async getAssignmentAccounts(accountId: string) {
    const members = await prisma.workProjectMember.findMany({
      where: { accountId },
      select: { projectId: true },
    });
    const projectIds = members.map((m) => m.projectId);
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { id: accountId },
          { workProjectMemberships: { some: { projectId: { in: projectIds } } } },
        ],
      },
      select: { id: true, displayName: true, username: true },
      take: 100,
    });
    return accounts;
  }
}
