import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export class AtlasService {
  async listObjectives(accountId: string) {
    const objectives = await prisma.atlasObjective.findMany({
      where: { accountId },
      orderBy: { startDate: 'desc' },
      include: {
        keyResults: true,
        parent: { select: { id: true, title: true } },
        linkedProject: { select: { id: true, name: true } },
      },
    });

    return objectives.map((obj) => ({
      ...obj,
      progress: this.computeObjectiveProgress(obj.keyResults),
    }));
  }

  async getObjective(accountId: string, objectiveId: string) {
    const objective = await prisma.atlasObjective.findFirst({
      where: { id: objectiveId, accountId },
      include: {
        parent: { select: { id: true, title: true } },
        children: { select: { id: true, title: true, state: true } },
        keyResults: {
          include: {
            links: {
              include: {
                issue: {
                  select: {
                    id: true,
                    summary: true,
                    column: { select: { id: true, name: true } },
                    archivedAt: true,
                  },
                },
              },
            },
            updates: {
              orderBy: { createdAt: 'desc' },
              take: 20,
              include: {
                account: { select: { id: true, displayName: true, username: true } },
              },
            },
          },
        },
        linkedProject: { select: { id: true, name: true } },
      },
    });
    if (!objective) throw new AppError('Objective not found', 404);

    const progress = this.computeObjectiveProgress(objective.keyResults);
    return { objective, progress };
  }

  async createObjective(
    accountId: string,
    data: {
      title: string;
      description?: string;
      periodType: 'QUARTER' | 'HALF_YEAR' | 'YEAR' | 'CUSTOM';
      startDate: string;
      endDate: string;
      parentId?: string | null;
      keyResults?: {
        title: string;
        type?: 'METRIC' | 'MILESTONE' | 'PERCENT' | 'RATIO';
        unit?: string;
        targetValue?: number;
        startValue?: number;
        weight?: number;
      }[];
    }
  ) {
    const title = (data.title || '').trim();
    if (title.length < 10 || title.length > 200) {
      throw new AppError('Objective name must be between 10 and 200 characters', 400);
    }
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
      throw new AppError('Invalid time period', 400);
    }

    if (data.parentId) {
      const parent = await prisma.atlasObjective.findFirst({
        where: { id: data.parentId, accountId },
        select: { id: true },
      });
      if (!parent) throw new AppError('Parent objective not found', 400);
    }

    const keyResultsInput = Array.isArray(data.keyResults) ? data.keyResults : [];
    if (keyResultsInput.length === 0) {
      throw new AppError('At least one key result is required', 400);
    }

    const created = await prisma.atlasObjective.create({
      data: {
        accountId,
        title,
        description: data.description?.slice(0, 1000) || null,
        periodType: data.periodType,
        startDate,
        endDate,
        parentId: data.parentId || null,
        state: 'ACTIVE',
        keyResults: {
          create: keyResultsInput.map((kr) => ({
            title: (kr.title || '').slice(0, 200),
            type: kr.type || 'METRIC',
            unit: kr.unit?.slice(0, 50) || null,
            targetValue: typeof kr.targetValue === 'number' ? kr.targetValue : null,
            startValue: typeof kr.startValue === 'number' ? kr.startValue : 0,
            currentValue: typeof kr.startValue === 'number' ? kr.startValue : 0,
            weight: typeof kr.weight === 'number' && kr.weight > 0 ? Math.round(kr.weight) : 1,
          })),
        },
      },
      include: {
        keyResults: true,
      },
    });

    return {
      ...created,
      progress: this.computeObjectiveProgress(created.keyResults),
    };
  }

  async addProgressUpdate(
    accountId: string,
    keyResultId: string,
    payload: { value: number; note?: string }
  ) {
    const keyResult = await prisma.atlasKeyResult.findFirst({
      where: { id: keyResultId, objective: { accountId } },
      include: { objective: true },
    });
    if (!keyResult) throw new AppError('Key result not found', 404);

    const value = Number(payload.value);
    if (!Number.isFinite(value)) {
      throw new AppError('Invalid value', 400);
    }

    await prisma.atlasKeyResult.update({
      where: { id: keyResultId },
      data: {
        currentValue: value,
        isCompleted: keyResult.targetValue != null && value >= keyResult.targetValue,
      },
    });

    await prisma.atlasProgressUpdate.create({
      data: {
        keyResultId,
        accountId,
        value,
        note: payload.note?.slice(0, 1000) || null,
      },
    });

    const updatedObjective = await prisma.atlasObjective.findUnique({
      where: { id: keyResult.objectiveId },
      include: { keyResults: true },
    });

    return {
      keyResultId,
      objectiveId: keyResult.objectiveId,
      progress: updatedObjective ? this.computeObjectiveProgress(updatedObjective.keyResults) : null,
    };
  }

  async setObjectiveState(
    accountId: string,
    objectiveId: string,
    state: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  ) {
    const obj = await prisma.atlasObjective.findFirst({
      where: { id: objectiveId, accountId },
      select: { id: true },
    });
    if (!obj) throw new AppError('Objective not found', 404);
    await prisma.atlasObjective.update({
      where: { id: objectiveId },
      data: { state },
    });
    return { ok: true };
  }

  async linkObjectiveToProject(accountId: string, objectiveId: string, projectId: string) {
    const objective = await prisma.atlasObjective.findFirst({
      where: { id: objectiveId, accountId },
      select: { id: true, accountId: true },
    });
    if (!objective) throw new AppError('Objective not found', 404);

    const project = await prisma.trackProject.findFirst({
      where: { id: projectId, accountId },
      select: { id: true },
    });
    if (!project) throw new AppError('Track project not found', 404);

    await prisma.atlasObjective.update({
      where: { id: objectiveId },
      data: { linkedProjectId: projectId },
    });
    return { ok: true };
  }

  async unlinkObjectiveFromProject(accountId: string, objectiveId: string) {
    const objective = await prisma.atlasObjective.findFirst({
      where: { id: objectiveId, accountId },
      select: { id: true },
    });
    if (!objective) throw new AppError('Objective not found', 404);
    await prisma.atlasObjective.update({
      where: { id: objectiveId },
      data: { linkedProjectId: null },
    });
    return { ok: true };
  }

  async addKeyResultIssueLink(accountId: string, keyResultId: string, issueId: string) {
    const keyResult = await prisma.atlasKeyResult.findFirst({
      where: { id: keyResultId, objective: { accountId } },
      select: { id: true, objectiveId: true },
    });
    if (!keyResult) throw new AppError('Key result not found', 404);

    const issue = await prisma.trackIssue.findFirst({
      where: { id: issueId, project: { accountId } },
      select: { id: true, projectId: true },
    });
    if (!issue) throw new AppError('Track issue not found', 404);

    await prisma.atlasKeyResultIssueLink.upsert({
      where: { keyResultId_issueId: { keyResultId: keyResultId, issueId: issueId } },
      create: { keyResultId, issueId },
      update: {},
    });

    return { ok: true };
  }

  async removeKeyResultIssueLink(accountId: string, keyResultId: string, issueId: string) {
    const keyResult = await prisma.atlasKeyResult.findFirst({
      where: { id: keyResultId, objective: { accountId } },
      select: { id: true },
    });
    if (!keyResult) throw new AppError('Key result not found', 404);

    await prisma.atlasKeyResultIssueLink.deleteMany({
      where: { keyResultId, issueId },
    });
    return { ok: true };
  }

  private computeObjectiveProgress(keyResults: { targetValue: number | null; startValue: number | null; currentValue: number | null; weight: number }[]) {
    if (!keyResults || keyResults.length === 0) return 0;
    let totalWeighted = 0;
    let totalWeight = 0;

    for (const kr of keyResults) {
      const weight = kr.weight > 0 ? kr.weight : 1;
      totalWeight += weight;
      const target = kr.targetValue;
      const start = kr.startValue ?? 0;
      const current = kr.currentValue ?? start;
      if (!target || target === start) {
        continue;
      }
      const span = target - start;
      const delta = current - start;
      const pct = Math.max(0, Math.min(1, delta / span));
      totalWeighted += pct * weight;
    }

    if (totalWeight === 0) return 0;
    return (totalWeighted / totalWeight) * 100;
  }
}

