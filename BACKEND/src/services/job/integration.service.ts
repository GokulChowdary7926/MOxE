import { Prisma } from '@prisma/client';
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

const KNOWN_PROVIDERS: { key: string; displayName: string; description: string }[] = [
  { key: 'GITHUB', displayName: 'GitHub', description: 'Sync repositories and pull requests with MOxE CODE.' },
  { key: 'GITLAB', displayName: 'GitLab', description: 'Connect GitLab repos and pipelines.' },
  { key: 'JIRA', displayName: 'Jira', description: 'Link MOxE TRACK projects to Jira issues.' },
  { key: 'LINEAR', displayName: 'Linear', description: 'Mirror Linear issues with MOxE TRACK.' },
  { key: 'SLACK', displayName: 'Slack', description: 'Notifications and updates into Slack channels.' },
  { key: 'NOTION', displayName: 'Notion', description: 'Sync docs and roadmaps from Notion.' },
];

export class JobIntegrationService {
  async list(accountId: string) {
    const existing = await prisma.jobIntegration.findMany({
      where: { accountId },
      orderBy: { provider: 'asc' },
    });

    const map = new Map(existing.map((e) => [e.provider, e]));

    return KNOWN_PROVIDERS.map((p) => {
      const row = map.get(p.key);
      return {
        provider: p.key,
        displayName: p.displayName,
        description: p.description,
        status: (row?.status as IntegrationStatus) || 'DISCONNECTED',
        id: row?.id ?? null,
        connectedAt: row?.createdAt ?? null,
      };
    });
  }

  async connect(
    accountId: string,
    provider: string,
    config?: Record<string, unknown>,
  ) {
    const normalized = provider.toUpperCase();
    const meta = KNOWN_PROVIDERS.find((p) => p.key === normalized);
    if (!meta) throw new AppError('Unknown integration provider', 400);

    const existing = await prisma.jobIntegration.findUnique({
      where: { accountId_provider: { accountId, provider: normalized } },
    });

    const data = {
      accountId,
      provider: normalized,
      displayName: meta.displayName,
      status: 'CONNECTED' as IntegrationStatus,
      config: (config ?? existing?.config ?? {}) as Prisma.InputJsonValue,
    };

    const upserted = await prisma.jobIntegration.upsert({
      where: { accountId_provider: { accountId, provider: normalized } },
      create: data,
      update: data,
    });

    return upserted;
  }

  async disconnect(accountId: string, provider: string) {
    const normalized = provider.toUpperCase();
    const existing = await prisma.jobIntegration.findUnique({
      where: { accountId_provider: { accountId, provider: normalized } },
    });
    if (!existing) {
      // idempotent
      return { ok: true };
    }
    await prisma.jobIntegration.update({
      where: { id: existing.id },
      data: { status: 'DISCONNECTED' as IntegrationStatus },
    });
    return { ok: true };
  }
}

