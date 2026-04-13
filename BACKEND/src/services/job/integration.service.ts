import { Prisma } from '@prisma/client';
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import {
  buildIntegrationAuthorizeUrl,
  exchangeIntegrationOAuthCode,
  signIntegrationOAuthState,
  verifyIntegrationOAuthState,
} from './integration-oauth';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

const KNOWN_PROVIDERS: { key: string; displayName: string; description: string }[] = [
  { key: 'GITHUB', displayName: 'GitHub', description: 'Sync repositories and pull requests with MOxE CODE.' },
  { key: 'GITLAB', displayName: 'GitLab', description: 'Connect GitLab repos and pipelines.' },
  { key: 'JIRA', displayName: 'External issues', description: 'Link MOxE TRACK with your team Atlassian / Jira Cloud project.' },
  { key: 'LINEAR', displayName: 'Linear', description: 'Mirror Linear issues with MOxE TRACK.' },
  { key: 'SLACK', displayName: 'Slack', description: 'Notifications and updates into Slack channels.' },
  { key: 'NOTION', displayName: 'Notion', description: 'Sync docs and roadmaps from Notion.' },
];

function hasCredential(config: unknown): boolean {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return typeof c.accessToken === 'string' && c.accessToken.length > 0;
}

export class JobIntegrationService {
  async list(accountId: string) {
    const existing = await prisma.jobIntegration.findMany({
      where: { accountId },
      orderBy: { provider: 'asc' },
    });

    const map = new Map(existing.map((e) => [e.provider, e]));

    return KNOWN_PROVIDERS.map((p) => {
      const row = map.get(p.key);
      const cred = row && hasCredential(row.config);
      const connected = row?.status === 'CONNECTED' && cred;
      return {
        provider: p.key,
        displayName: p.displayName,
        description: p.description,
        status: (connected ? 'CONNECTED' : 'DISCONNECTED') as IntegrationStatus,
        id: row?.id ?? null,
        connectedAt: connected ? row?.updatedAt?.toISOString() ?? row?.createdAt?.toISOString() ?? null : null,
      };
    });
  }

  /**
   * @deprecated Stub connect. Use `getOAuthAuthorizationUrl` + provider redirect.
   */
  async connect(_accountId: string, _provider: string, _config?: Record<string, unknown>) {
    throw new AppError(
      'Use POST /api/job/integrations/:provider/auth to start OAuth, then complete the provider consent screen.',
      400,
    );
  }

  async getOAuthAuthorizationUrl(accountId: string, provider: string): Promise<string> {
    const normalized = provider.toUpperCase();
    const meta = KNOWN_PROVIDERS.find((p) => p.key === normalized);
    if (!meta) throw new AppError('Unknown integration provider', 400);

    const secret = process.env.JWT_SECRET || 'secret';
    const state = signIntegrationOAuthState(accountId, normalized, secret);
    const url = buildIntegrationAuthorizeUrl(normalized, state);
    if (!url) {
      throw new AppError(
        `OAuth is not configured for ${meta.displayName}. Add the provider OAuth client ID and secret to the server environment (see BACKEND .env.example: INTEGRATION_* / SLACK_* / ATLASSIAN_*).`,
        503,
      );
    }
    return url;
  }

  async completeOAuthCallback(code: string, state: string) {
    const secret = process.env.JWT_SECRET || 'secret';
    const { accountId, provider } = verifyIntegrationOAuthState(state, secret);
    const meta = KNOWN_PROVIDERS.find((p) => p.key === provider);
    if (!meta) throw new AppError('Unknown integration provider', 400);

    const tokens = await exchangeIntegrationOAuthCode(provider, code);

    const data = {
      accountId,
      provider,
      displayName: meta.displayName,
      status: 'CONNECTED' as IntegrationStatus,
      config: tokens as Prisma.InputJsonValue,
    };

    await prisma.jobIntegration.upsert({
      where: { accountId_provider: { accountId, provider } },
      create: data,
      update: {
        status: data.status,
        config: data.config,
        displayName: meta.displayName,
      },
    });

    return { ok: true as const };
  }

  async disconnect(accountId: string, provider: string) {
    const normalized = provider.toUpperCase();
    const existing = await prisma.jobIntegration.findUnique({
      where: { accountId_provider: { accountId, provider: normalized } },
    });
    if (!existing) {
      return { ok: true as const };
    }
    await prisma.jobIntegration.update({
      where: { id: existing.id },
      data: {
        status: 'DISCONNECTED' as IntegrationStatus,
        config: Prisma.JsonNull,
      },
    });
    return { ok: true as const };
  }
}
