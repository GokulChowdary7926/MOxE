import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export class BuildService {
  async listPipelines(accountId: string) {
    return prisma.buildPipeline.findMany({
      where: { accountId },
      include: {
        repo: { select: { id: true, name: true, slug: true } },
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPipeline(
    accountId: string,
    data: {
      repoId: string;
      name: string;
      branchFilter: string;
      triggers: any;
      stages: any;
      externalKey?: string | null;
    }
  ) {
    const name = (data.name || '').trim();
    if (!name) throw new AppError('Pipeline name is required', 400);

    // Ensure user can access the repo (owned or collaborator)
    const repo = await prisma.codeRepository.findUnique({
      where: { id: data.repoId },
      select: { id: true, accountId: true },
    });
    if (!repo) throw new AppError('Repository not found', 404);

    const isOwner = repo.accountId === accountId;
    if (!isOwner) {
      const collab = await prisma.codeRepoCollaborator.findUnique({
        where: { repoId_accountId: { repoId: data.repoId, accountId } },
      });
      if (!collab) throw new AppError('You do not have access to this repository', 403);
    }

    const pipeline = await prisma.buildPipeline.create({
      data: {
        accountId,
        repoId: data.repoId,
        name,
        branchFilter: (data.branchFilter || '').trim() || 'main',
        triggers: data.triggers || { push: true, manual: true },
        stages: data.stages || [],
        externalKey: data.externalKey || null,
      },
      include: {
        repo: { select: { id: true, name: true, slug: true } },
      },
    });
    return pipeline;
  }

  async getPipeline(accountId: string, pipelineId: string) {
    const pipeline = await prisma.buildPipeline.findFirst({
      where: { id: pipelineId, accountId },
      include: {
        repo: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!pipeline) throw new AppError('Pipeline not found', 404);
    return pipeline;
  }

  async listRuns(accountId: string, pipelineId: string) {
    await this.getPipeline(accountId, pipelineId);
    return prisma.buildRun.findMany({
      where: { pipelineId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Called by external CI via webhook to upsert a run record.
   * You can map your external provider payload into this shape.
   */
  async recordRunFromWebhook(payload: {
    externalKey?: string | null;
    pipelineId?: string | null;
    externalRunId?: string | null;
    status: string;
    triggerType?: string;
    commitSha?: string | null;
    branch?: string | null;
    logsUrl?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
  }) {
    const normalizedStatus = (payload.status || 'PENDING').toUpperCase();
    const triggerType = (payload.triggerType || 'WEBHOOK').toUpperCase();

    let pipeline = null;
    if (payload.pipelineId) {
      pipeline = await prisma.buildPipeline.findUnique({ where: { id: payload.pipelineId } });
    } else if (payload.externalKey) {
      pipeline = await prisma.buildPipeline.findFirst({ where: { externalKey: payload.externalKey } });
    }
    if (!pipeline) throw new AppError('Pipeline not found for webhook payload', 404);

    const existing = payload.externalRunId
      ? await prisma.buildRun.findFirst({
          where: { pipelineId: pipeline.id, externalRunId: payload.externalRunId },
        })
      : null;

    const data = {
      status: normalizedStatus,
      triggerType,
      commitSha: payload.commitSha || null,
      branch: payload.branch || null,
      logsUrl: payload.logsUrl || null,
      startedAt: payload.startedAt ? new Date(payload.startedAt) : existing?.startedAt ?? null,
      finishedAt: payload.finishedAt ? new Date(payload.finishedAt) : existing?.finishedAt ?? null,
    };

    if (existing) {
      return prisma.buildRun.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.buildRun.create({
      data: {
        pipelineId: pipeline.id,
        externalRunId: payload.externalRunId || null,
        ...data,
      },
    });
  }
}

