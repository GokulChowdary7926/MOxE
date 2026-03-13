import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import { AlertService } from '../alert.service';

type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN';
type HealthResultStatus = 'PASS' | 'DEGRADED' | 'FAIL' | 'TIMEOUT' | 'INVALID';

const alertService = new AlertService();

export class CompassService {
  async listServices(accountId: string) {
    return prisma.service.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
      include: {
        owners: {
          include: { account: { select: { id: true, displayName: true, username: true } } },
        },
        _count: {
          select: { dependencies: true, dependents: true, healthChecks: true },
        },
      },
    });
  }

  async registerService(accountId: string, data: {
    name: string;
    descriptionMd?: string;
    docLink?: string;
    apiBaseUrl?: string;
    healthCheckUrl?: string;
    environment?: string;
    tags?: string[];
    notes?: string;
    ownerAccountIds?: string[];
  }) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) {
      throw new AppError('Service name must be between 3 and 100 characters', 400);
    }
    const slugBase = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 120) || 'service';

    // Ensure unique slug per account
    let slug = slugBase;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.service.findUnique({
        where: { accountId_slug: { accountId, slug } },
        select: { id: true },
      }).catch(() => null);
      if (!existing) break;
      counter += 1;
      slug = `${slugBase}-${counter}`;
    }

    const service = await prisma.service.create({
      data: {
        accountId,
        name,
        slug,
        descriptionMd: data.descriptionMd?.slice(0, 2000) || null,
        docLink: data.docLink?.slice(0, 500) || null,
        apiBaseUrl: data.apiBaseUrl?.slice(0, 500) || null,
        healthCheckUrl: data.healthCheckUrl?.slice(0, 500) || null,
        environment: (data.environment || 'production').slice(0, 20),
        tags: data.tags && Array.isArray(data.tags) ? data.tags.slice(0, 20) : undefined,
        healthConfig: undefined,
        notes: data.notes?.slice(0, 1000) || null,
        owners: {
          create: (data.ownerAccountIds && data.ownerAccountIds.length > 0
            ? data.ownerAccountIds
            : [accountId]
          ).map((ownerId, idx) => ({
            accountId: ownerId,
            role: idx === 0 ? 'PRIMARY' : 'SECONDARY',
          })),
        },
      },
      include: {
        owners: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
    });

    return service;
  }

  async updateService(accountId: string, serviceId: string, data: Partial<{
    name: string;
    descriptionMd: string;
    docLink: string;
    apiBaseUrl: string;
    healthCheckUrl: string;
    environment: string;
    tags: string[];
    notes: string;
    status: ServiceStatus;
  }>) {
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
    });
    if (!existing) throw new AppError('Service not found', 404);

    const update: any = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) {
        throw new AppError('Service name must be between 3 and 100 characters', 400);
      }
      update.name = name;
    }
    if (data.descriptionMd !== undefined) update.descriptionMd = data.descriptionMd.slice(0, 2000) || null;
    if (data.docLink !== undefined) update.docLink = data.docLink.slice(0, 500) || null;
    if (data.apiBaseUrl !== undefined) update.apiBaseUrl = data.apiBaseUrl.slice(0, 500) || null;
    if (data.healthCheckUrl !== undefined) update.healthCheckUrl = data.healthCheckUrl.slice(0, 500) || null;
    if (data.environment !== undefined) update.environment = data.environment.slice(0, 20);
    if (data.tags !== undefined) update.tags = Array.isArray(data.tags) ? data.tags.slice(0, 20) : [];
    if (data.notes !== undefined) update.notes = data.notes.slice(0, 1000) || null;
    if (data.status !== undefined) update.status = data.status;

    return prisma.service.update({
      where: { id: serviceId },
      data: update,
    });
  }

  async getHealthConfig(accountId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true, healthConfig: true, healthCheckUrl: true },
    });
    if (!service) throw new AppError('Service not found', 404);
    return {
      healthCheckUrl: service.healthCheckUrl,
      healthConfig: service.healthConfig || null,
    };
  }

  async updateHealthConfig(
    accountId: string,
    serviceId: string,
    config: any
  ) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true },
    });
    if (!service) throw new AppError('Service not found', 404);

    const normalized = config && typeof config === 'object' ? { ...config } : {};

    if (!normalized.url) {
      // allow omitting url so we fall back to healthCheckUrl
      normalized.url = undefined;
    }
    if (normalized.timeout !== undefined) {
      const t = Number(normalized.timeout);
      if (!Number.isFinite(t) || t <= 0 || t > 60000) {
        throw new AppError('timeout must be between 1 and 60000 ms', 400);
      }
      normalized.timeout = t;
    }
    if (normalized.degradedThreshold && typeof normalized.degradedThreshold === 'object') {
      const lat = Number(normalized.degradedThreshold.latencyMs);
      if (Number.isFinite(lat) && lat > 0) {
        normalized.degradedThreshold.latencyMs = lat;
      } else {
        delete normalized.degradedThreshold.latencyMs;
      }
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: { healthConfig: normalized },
    });

    return this.getHealthConfig(accountId, serviceId);
  }

  async setDependencies(accountId: string, serviceId: string, dependencyIds: string[]) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true },
    });
    if (!service) throw new AppError('Service not found', 404);

    const uniqueIds = Array.from(new Set(dependencyIds.filter((id) => id !== serviceId)));
    // Ensure dependencies belong to same account
    const deps = await prisma.service.findMany({
      where: { id: { in: uniqueIds }, accountId },
      select: { id: true },
    });
    const validIds = deps.map((d) => d.id);

    await prisma.serviceDependency.deleteMany({ where: { serviceId } });
    if (validIds.length === 0) return { ok: true };

    await prisma.serviceDependency.createMany({
      data: validIds.map((id) => ({
        serviceId,
        dependsOnId: id,
        kind: 'REQUIRED',
      })),
    });
    return { ok: true };
  }

  async listDocs(accountId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true },
    });
    if (!service) throw new AppError('Service not found', 404);
    return prisma.serviceDocLink.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'asc' },
      include: {
        page: { select: { id: true, title: true, updatedAt: true, slug: true, spaceId: true } },
      },
    });
  }

  async addDoc(
    accountId: string,
    serviceId: string,
    data: { pageId: string; docType: string }
  ) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true, accountId: true },
    });
    if (!service) throw new AppError('Service not found', 404);

    const page = await prisma.knowledgePage.findUnique({
      where: { id: data.pageId },
      select: { id: true, title: true, updatedAt: true, content: true },
    });
    if (!page) throw new AppError('Knowledge page not found', 404);

    const preview =
      page.content && page.content.length > 0
        ? page.content.slice(0, 480)
        : null;

    const docType = (data.docType || 'OTHER').toUpperCase();

    return prisma.serviceDocLink.create({
      data: {
        serviceId,
        pageId: page.id,
        docType,
        title: page.title,
        preview,
        lastSyncedAt: page.updatedAt,
      },
      include: {
        page: { select: { id: true, title: true, updatedAt: true, slug: true, spaceId: true } },
      },
    });
  }

  async removeDoc(accountId: string, serviceId: string, docId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      select: { id: true },
    });
    if (!service) throw new AppError('Service not found', 404);

    const existing = await prisma.serviceDocLink.findFirst({
      where: { id: docId, serviceId },
      select: { id: true },
    });
    if (!existing) throw new AppError('Document link not found', 404);

    await prisma.serviceDocLink.delete({ where: { id: docId } });
    return { ok: true };
  }

  async getServiceDetail(accountId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, accountId },
      include: {
        owners: {
          include: { account: { select: { id: true, displayName: true, username: true } } },
        },
        dependencies: {
          include: { dependsOn: true },
        },
        dependents: {
          include: { service: true },
        },
        docs: {
          include: {
            page: { select: { id: true, title: true, updatedAt: true, slug: true, spaceId: true } },
          },
        },
      },
    });
    if (!service) throw new AppError('Service not found', 404);

    const now = new Date();
    const from24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const from7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromYtd = new Date(new Date(now.getFullYear(), 0, 1).getTime());

    const [recentChecks, last24, last7d, last30d, lastYtd] = await Promise.all([
      prisma.serviceHealthCheck.findMany({
        where: { serviceId },
        orderBy: { checkedAt: 'desc' },
        take: 50,
      }),
      prisma.serviceHealthCheck.groupBy({
        by: ['status'],
        where: { serviceId, checkedAt: { gte: from24h } },
        _count: true,
      }),
      prisma.serviceHealthCheck.groupBy({
        by: ['status'],
        where: { serviceId, checkedAt: { gte: from30d } },
        _count: true,
      }),
      prisma.serviceHealthCheck.groupBy({
        by: ['status'],
        where: { serviceId, checkedAt: { gte: fromYtd } },
        _count: true,
      }),
      prisma.serviceHealthCheck.groupBy({
        by: ['status'],
        where: { serviceId, checkedAt: { gte: from7d } },
        _count: true,
      }),
    ]);

    const uptimeFromCounts = (groups: { status: string; _count: number }[]) => {
      const total = groups.reduce((sum, g) => sum + g._count, 0);
      if (total === 0) return null;
      const healthy = groups
        .filter((g) => g.status === 'PASS')
        .reduce((sum, g) => sum + g._count, 0);
      return (healthy / total) * 100;
    };

    const uptime24h = uptimeFromCounts(last24);
    const uptime7d = uptimeFromCounts(last7d);
    const uptime30d = uptimeFromCounts(last30d);
    const uptimeYtd = uptimeFromCounts(lastYtd);

    return {
      service,
      recentChecks,
      uptime: {
        last24h: uptime24h,
        last7d: uptime7d,
        last30d: uptime30d,
        ytd: uptimeYtd,
      },
    };
  }

  /**
   * Run health checks for all services that have a healthCheckUrl configured.
   * Intended to be called from a background interval in server.ts.
   */
  async runHealthChecks(): Promise<number> {
    let services;
    try {
      services = await prisma.service.findMany({
        where: { healthCheckUrl: { not: null } },
        select: {
          id: true,
          accountId: true,
          name: true,
          environment: true,
          healthCheckUrl: true,
          lastAlertAt: true,
          openAlertEventId: true,
          healthConfig: true,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2021' || (e?.message && String(e.message).includes('does not exist'))) {
        return 0;
      }
      throw e;
    }
    if (!services || (services as any[]).length === 0) return 0;

    let checked = 0;
    for (const svc of services as any[]) {
      if (!svc.healthCheckUrl) continue;
      try {
        const cfg: any = (svc as any).healthConfig || {};
        const method = (cfg.method || 'GET').toUpperCase();
        const timeoutMs = Number.isFinite(cfg.timeout) && cfg.timeout > 0 ? cfg.timeout : 8000;
        const headers: Record<string, string> = { ...(cfg.headers || {}) };

        if (cfg.auth && typeof cfg.auth === 'object') {
          if (cfg.auth.type === 'bearer' && cfg.auth.token) {
            headers.Authorization = `Bearer ${cfg.auth.token}`;
          } else if (cfg.auth.type === 'basic' && cfg.auth.username && cfg.auth.password) {
            const creds = Buffer.from(`${cfg.auth.username}:${cfg.auth.password}`).toString('base64');
            headers.Authorization = `Basic ${creds}`;
          } else if (cfg.auth.type === 'api-key' && cfg.auth.keyValue) {
            if (cfg.auth.in === 'query' && cfg.auth.keyName) {
              // append as query parameter below
            } else if (cfg.auth.in === 'header' && cfg.auth.keyName) {
              headers[cfg.auth.keyName] = String(cfg.auth.keyValue);
            }
          }
        }

        let url = svc.healthCheckUrl!;
        if (cfg.url && typeof cfg.url === 'string') {
          url = cfg.url;
        }

        // If API key should go in query string
        if (
          cfg.auth &&
          cfg.auth.type === 'api-key' &&
          cfg.auth.in === 'query' &&
          cfg.auth.keyName &&
          cfg.auth.keyValue
        ) {
          const u = new URL(url);
          u.searchParams.set(cfg.auth.keyName, String(cfg.auth.keyValue));
          url = u.toString();
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const started = Date.now();
        const res = await fetch(url, {
          method,
          headers,
          signal: controller.signal,
        }).catch((err: any) => {
          if (err?.name === 'AbortError') {
            throw new AppError('Health check timeout', 504);
          }
          throw err;
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - started;
        const httpStatus = res.status;
        const ok = res.ok;

        let status: HealthResultStatus = ok ? 'PASS' : 'FAIL';

        // Apply degraded thresholds if configured
        const degradedCfg = cfg.degradedThreshold || {};
        const degradedLatency =
          typeof degradedCfg.latencyMs === 'number' && degradedCfg.latencyMs > 0
            ? degradedCfg.latencyMs
            : null;
        const degradedStatuses: number[] = Array.isArray(degradedCfg.httpStatuses)
          ? degradedCfg.httpStatuses
          : [];

        if (status === 'PASS') {
          if ((degradedLatency && latencyMs > degradedLatency) || degradedStatuses.includes(httpStatus)) {
            status = 'DEGRADED';
          }
        }
        await prisma.serviceHealthCheck.create({
          data: {
            serviceId: svc.id,
            status,
            httpStatus,
            latencyMs,
            error: ok ? null : `HTTP ${httpStatus}`,
          },
        });

        const newServiceStatus: ServiceStatus =
          status === 'PASS'
            ? 'OPERATIONAL'
            : status === 'DEGRADED'
            ? 'DEGRADED'
            : status === 'FAIL' || status === 'TIMEOUT'
            ? 'DOWN'
            : 'UNKNOWN';

        // Update service status
        await prisma.service.update({
          where: { id: svc.id },
          data: { status: newServiceStatus },
        });

        // If unhealthy, consider triggering MOxE ALERT
        if (status !== 'PASS') {
          await this.maybeTriggerHealthAlert(svc.id, {
            accountId: svc.accountId,
            serviceName: svc.name,
            environment: svc.environment,
            healthCheckUrl: svc.healthCheckUrl!,
            status,
            httpStatus,
            latencyMs,
          });
        } else if (ok && svc.openAlertEventId) {
          // Service recovered – close any open alert link
          await prisma.service.update({
            where: { id: svc.id },
            data: { openAlertEventId: null },
          });
        }

        checked += 1;
      } catch (err: any) {
        const isTimeout = err instanceof AppError && err.statusCode === 504;
        await prisma.serviceHealthCheck.create({
          data: {
            serviceId: svc.id,
            status: isTimeout ? 'TIMEOUT' : 'FAIL',
            httpStatus: null,
            latencyMs: null,
            error: String(err.message || err),
          },
        });
        await prisma.service.update({
          where: { id: svc.id },
          data: { status: 'DOWN' },
        });

        await this.maybeTriggerHealthAlert(svc.id, {
          accountId: svc.accountId,
          serviceName: svc.name,
          environment: svc.environment,
          healthCheckUrl: svc.healthCheckUrl!,
          status: isTimeout ? 'TIMEOUT' : 'FAIL',
          httpStatus: null,
          latencyMs: null,
        });
        checked += 1;
      }
    }
    return checked;
  }

  /**
   * If a service is repeatedly failing health checks, create a MOxE ALERT event to the
   * account's on-call schedule (if one exists). Very simple heuristic:
   * - Require at least 3 consecutive failing checks in the last few minutes.
   * - Only fire if there is an AlertSchedule for the account.
   */
  private async maybeTriggerHealthAlert(
    serviceId: string,
    params: {
      accountId: string;
      serviceName: string;
      environment: string;
      healthCheckUrl: string;
      status: HealthResultStatus;
      httpStatus: number | null;
      latencyMs: number | null;
    }
  ) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 5 * 60 * 1000); // last 5 minutes

    const recent = await prisma.serviceHealthCheck.findMany({
      where: {
        serviceId,
        checkedAt: { gte: windowStart },
      },
      orderBy: { checkedAt: 'desc' },
      take: 5,
    });
    if (recent.length < 3) return;
    const lastThree = recent.slice(0, 3);
    const allBad = lastThree.every((c) => c.status !== 'PASS');
    if (!allBad) return;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, accountId: true, name: true, environment: true, lastAlertAt: true, openAlertEventId: true },
    });
    if (!service) return;

    // Avoid spamming alerts: if we already opened one in the last 15 minutes, skip
    if (service.lastAlertAt) {
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      if (service.lastAlertAt > fifteenMinutesAgo) return;
    }

    const schedule = await prisma.alertSchedule.findFirst({
      where: { accountId: params.accountId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!schedule) return;

    const ruleName = `COMPASS: ${params.serviceName} (${params.environment}) health check failing`;

    const rule = await prisma.alertRule.create({
      data: {
        scheduleId: schedule.id,
        name: ruleName,
        severity: 'CRITICAL',
        condition: {
          source: 'COMPASS_HEALTH',
          serviceId,
        } as object,
        notificationMethods: {
          inApp: true,
          sms: true,
        } as object,
      },
    });

    const payload = {
      source: 'COMPASS_HEALTH',
      serviceId,
      serviceName: params.serviceName,
      environment: params.environment,
      healthCheckUrl: params.healthCheckUrl,
      status: params.status,
      httpStatus: params.httpStatus,
      latencyMs: params.latencyMs,
      failedChecks: lastThree.length,
      triggeredAt: now.toISOString(),
    };

    const result = await alertService.triggerRule(rule.id, payload);

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        lastAlertAt: now,
        openAlertEventId: result.eventId,
      },
    });
  }
}

