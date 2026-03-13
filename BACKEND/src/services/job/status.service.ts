import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

async function canAccessPage(accountId: string, pageId: string): Promise<{ page: any }> {
  const page = await prisma.statusPage.findUnique({
    where: { id: pageId },
    include: {
      account: { select: { id: true, displayName: true, username: true } },
      components: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!page) throw new AppError('Status page not found', 404);
  if (page.accountId !== accountId) throw new AppError('Access denied', 403);
  return { page };
}

const COMPONENT_TYPES = ['API', 'Website', 'Database', 'Authentication', 'Payment', 'CDN', 'Internal Tool'];
const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'];
const INCIDENT_STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];

export class StatusService {
  async listPages(accountId: string) {
    return prisma.statusPage.findMany({
      where: { accountId },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        _count: { select: { components: true, incidents: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPage(accountId: string, pageIdOrSlug: string, isPublic = false) {
    let page: any = null;
    if (pageIdOrSlug.length < 30) {
      const account = await prisma.account.findFirst({ where: { username: pageIdOrSlug }, select: { id: true } });
      if (account)
        page = await prisma.statusPage.findUnique({
          where: { accountId_slug: { accountId: account.id, slug: pageIdOrSlug } },
          include: {
            account: { select: { id: true, displayName: true, username: true } },
            components: { orderBy: { sortOrder: 'asc' } },
            incidents: {
              where: { status: { not: 'RESOLVED' } },
              orderBy: { createdAt: 'desc' },
              include: { updates: { orderBy: { createdAt: 'asc' }, take: 1 }, affectedComponents: { include: { component: true } } },
            },
          },
        });
    }
    if (!page)
      page = await prisma.statusPage.findUnique({
        where: { id: pageIdOrSlug },
        include: {
          account: { select: { id: true, displayName: true, username: true } },
          components: { orderBy: { sortOrder: 'asc' } },
          incidents: {
            where: { status: { not: 'RESOLVED' } },
            orderBy: { createdAt: 'desc' },
            include: { updates: { orderBy: { createdAt: 'asc' } }, affectedComponents: { include: { component: true } } },
          },
        },
      });
    if (!page) throw new AppError('Status page not found', 404);
    if (!isPublic && page.accountId !== accountId) throw new AppError('Access denied', 403);
    if (isPublic && page.visibility === 'PRIVATE') throw new AppError('Access denied', 403);
    return page;
  }

  async createPage(
    accountId: string,
    data: {
      name: string;
      description?: string;
      customDomain?: string;
      visibility?: 'PUBLIC' | 'PRIVATE';
      components?: { name: string; description?: string; type?: string }[];
    }
  ) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
    const slug = slugify(name).slice(0, 120) || 'status';
    const existing = await prisma.statusPage.findUnique({
      where: { accountId_slug: { accountId, slug } },
    });
    if (existing) throw new AppError('A status page with this name already exists', 400);

    const visibility = data.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    const page = await prisma.statusPage.create({
      data: {
        accountId,
        name,
        slug,
        description: (data.description || '').slice(0, 500) || undefined,
        customDomain: (data.customDomain || '').trim().slice(0, 255) || undefined,
        visibility,
      },
      include: { account: { select: { id: true, displayName: true, username: true } } },
    });

    const components = data.components && data.components.length > 0
      ? data.components
      : [{ name: 'All Systems', type: 'API' }];
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      const type = COMPONENT_TYPES.includes(c.type || '') ? c.type : 'API';
      await prisma.statusPageComponent.create({
        data: {
          pageId: page.id,
          name: (c.name || `Component ${i + 1}`).slice(0, 120),
          description: (c.description || '').slice(0, 500) || undefined,
          type,
          sortOrder: i,
        },
      });
    }

    return this.getPage(accountId, page.id);
  }

  async updatePage(
    accountId: string,
    pageId: string,
    data: { name?: string; description?: string; customDomain?: string; visibility?: string }
  ) {
    await canAccessPage(accountId, pageId);
    const update: any = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
      update.name = name;
      update.slug = slugify(name).slice(0, 120);
    }
    if (data.description !== undefined) update.description = data.description.slice(0, 500) || null;
    if (data.customDomain !== undefined) update.customDomain = data.customDomain?.trim().slice(0, 255) || null;
    if (data.visibility === 'PUBLIC' || data.visibility === 'PRIVATE') update.visibility = data.visibility;
    await prisma.statusPage.update({ where: { id: pageId }, data: update });
    return this.getPage(accountId, pageId);
  }

  async deletePage(accountId: string, pageId: string) {
    const { page } = await canAccessPage(accountId, pageId);
    await prisma.statusPage.delete({ where: { id: page.id } });
    return { ok: true };
  }

  async addComponent(
    accountId: string,
    pageId: string,
    data: { name: string; description?: string; type?: string }
  ) {
    const { page } = await canAccessPage(accountId, pageId);
    const name = (data.name || '').trim().slice(0, 120);
    if (!name) throw new AppError('Component name required', 400);
    const type = COMPONENT_TYPES.includes(data.type || '') ? data.type : 'API';
    const maxOrder = await prisma.statusPageComponent.aggregate({
      where: { pageId },
      _max: { sortOrder: true },
    });
    return prisma.statusPageComponent.create({
      data: {
        pageId,
        name,
        description: (data.description || '').slice(0, 500) || undefined,
        type,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateComponent(
    accountId: string,
    pageId: string,
    componentId: string,
    data: { name?: string; description?: string; type?: string; status?: string }
  ) {
    await canAccessPage(accountId, pageId);
    const comp = await prisma.statusPageComponent.findFirst({
      where: { id: componentId, pageId },
    });
    if (!comp) throw new AppError('Component not found', 404);
    const update: any = {};
    if (data.name !== undefined) update.name = data.name.slice(0, 120);
    if (data.description !== undefined) update.description = data.description?.slice(0, 500) || null;
    if (data.type !== undefined && COMPONENT_TYPES.includes(data.type)) update.type = data.type;
    if (data.status !== undefined && ['OPERATIONAL', 'DEGRADED', 'OUTAGE'].includes(data.status)) update.status = data.status;
    return prisma.statusPageComponent.update({ where: { id: componentId }, data: update });
  }

  async deleteComponent(accountId: string, pageId: string, componentId: string) {
    await canAccessPage(accountId, pageId);
    const comp = await prisma.statusPageComponent.findFirst({ where: { id: componentId, pageId } });
    if (!comp) throw new AppError('Component not found', 404);
    await prisma.statusPageComponent.delete({ where: { id: componentId } });
    return { ok: true };
  }

  async createIncident(
    accountId: string,
    pageId: string,
    data: {
      name: string;
      severity: string;
      componentIds: string[];
      status?: string;
    }
  ) {
    await canAccessPage(accountId, pageId);
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 200) throw new AppError('Incident name must be 3–200 characters', 400);
    if (!SEVERITIES.includes(data.severity)) throw new AppError('Invalid severity', 400);
    const componentIds = Array.isArray(data.componentIds) ? data.componentIds : [];
    const components = await prisma.statusPageComponent.findMany({
      where: { pageId, id: { in: componentIds } },
    });
    const status = INCIDENT_STATUSES.includes(data.status || '') ? data.status : 'INVESTIGATING';

    const incident = await prisma.statusIncident.create({
      data: {
        pageId,
        name,
        severity: data.severity,
        status,
        authorId: accountId,
      },
      include: { author: { select: { id: true, displayName: true } } },
    });

    if (components.length > 0) {
      await prisma.statusIncidentComponent.createMany({
        data: components.map((c) => ({ incidentId: incident.id, componentId: c.id })),
      });
      const newStatus = data.severity === 'CRITICAL' ? 'OUTAGE' : 'DEGRADED';
      await prisma.statusPageComponent.updateMany({
        where: { id: { in: components.map((c) => c.id) } },
        data: { status: newStatus },
      });
    }

    return this.getIncident(accountId, pageId, incident.id);
  }

  async listIncidents(accountId: string, pageId: string, resolved?: boolean) {
    await canAccessPage(accountId, pageId);
    const where: any = { pageId };
    if (resolved === true) where.status = 'RESOLVED';
    else if (resolved === false) where.status = { not: 'RESOLVED' };
    return prisma.statusIncident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true } },
        affectedComponents: { include: { component: true } },
        _count: { select: { updates: true } },
      },
    });
  }

  async getIncident(accountId: string, pageId: string, incidentId: string) {
    await canAccessPage(accountId, pageId);
    const incident = await prisma.statusIncident.findFirst({
      where: { id: incidentId, pageId },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        updates: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, displayName: true } } } },
        affectedComponents: { include: { component: true } },
      },
    });
    if (!incident) throw new AppError('Incident not found', 404);
    return incident;
  }

  async updateIncident(
    accountId: string,
    pageId: string,
    incidentId: string,
    data: { name?: string; severity?: string; status?: string; componentIds?: string[] }
  ) {
    await canAccessPage(accountId, pageId);
    const incident = await prisma.statusIncident.findFirst({
      where: { id: incidentId, pageId },
      include: { affectedComponents: true },
    });
    if (!incident) throw new AppError('Incident not found', 404);
    if (incident.status === 'RESOLVED') throw new AppError('Cannot update resolved incident', 400);

    const update: any = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 200) throw new AppError('Incident name must be 3–200 characters', 400);
      update.name = name;
    }
    if (data.severity !== undefined && SEVERITIES.includes(data.severity)) update.severity = data.severity;
    if (data.status !== undefined && INCIDENT_STATUSES.includes(data.status)) {
      update.status = data.status;
      if (data.status === 'RESOLVED') update.resolvedAt = new Date();
    }

    if (data.componentIds !== undefined) {
      const prevIds = incident.affectedComponents.map((a) => a.componentId);
      const nextIds = Array.isArray(data.componentIds) ? data.componentIds : [];
      await prisma.statusIncidentComponent.deleteMany({ where: { incidentId } });
      if (nextIds.length > 0) {
        const components = await prisma.statusPageComponent.findMany({
          where: { pageId, id: { in: nextIds } },
        });
        await prisma.statusIncidentComponent.createMany({
          data: components.map((c) => ({ incidentId, componentId: c.id })),
        });
        const newStatus = incident.severity === 'CRITICAL' ? 'OUTAGE' : 'DEGRADED';
        await prisma.statusPageComponent.updateMany({
          where: { id: { in: components.map((c) => c.id) } },
          data: { status: newStatus },
        });
      }
      const restoredIds = prevIds.filter((id) => !nextIds.includes(id));
      if (restoredIds.length > 0) {
        const stillAffected = await prisma.statusIncident.findMany({
          where: { pageId, status: { not: 'RESOLVED' }, id: { not: incidentId } },
          include: { affectedComponents: true },
        });
        const stillAffectedComponentIds = new Set(
          stillAffected.flatMap((i) => i.affectedComponents.map((a) => a.componentId))
        );
        const toRestore = restoredIds.filter((id) => !stillAffectedComponentIds.has(id));
        if (toRestore.length > 0)
          await prisma.statusPageComponent.updateMany({
            where: { id: { in: toRestore } },
            data: { status: 'OPERATIONAL' },
          });
      }
    }

    await prisma.statusIncident.update({ where: { id: incidentId }, data: update });
    if (update.status === 'RESOLVED') {
      const inc = await prisma.statusIncident.findFirst({
        where: { id: incidentId },
        include: { affectedComponents: true },
      });
      if (inc?.affectedComponents.length) {
        const compIds = inc.affectedComponents.map((a) => a.componentId);
        await prisma.statusPageComponent.updateMany({
          where: { id: { in: compIds } },
          data: { status: 'OPERATIONAL' },
        });
      }
    }
    return this.getIncident(accountId, pageId, incidentId);
  }

  async addIncidentUpdate(
    accountId: string,
    pageId: string,
    incidentId: string,
    data: { body: string }
  ) {
    await canAccessPage(accountId, pageId);
    const incident = await prisma.statusIncident.findFirst({
      where: { id: incidentId, pageId },
    });
    if (!incident) throw new AppError('Incident not found', 404);
    const body = (data.body || '').trim();
    if (!body) throw new AppError('Update body required', 400);
    return prisma.statusIncidentUpdate.create({
      data: { incidentId, body, authorId: accountId },
      include: { author: { select: { id: true, displayName: true } } },
    });
  }

  async resolveIncident(accountId: string, pageId: string, incidentId: string, resolutionSummary?: string) {
    await canAccessPage(accountId, pageId);
    const incident = await prisma.statusIncident.findFirst({
      where: { id: incidentId, pageId },
      include: { affectedComponents: true },
    });
    if (!incident) throw new AppError('Incident not found', 404);
    if (incident.status === 'RESOLVED') throw new AppError('Incident already resolved', 400);

    if (resolutionSummary?.trim()) {
      await prisma.statusIncidentUpdate.create({
        data: { incidentId, body: resolutionSummary.trim(), authorId: accountId },
      });
    }

    await prisma.statusIncident.update({
      where: { id: incidentId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });

    const compIds = incident.affectedComponents.map((a) => a.componentId);
    if (compIds.length > 0) {
      await prisma.statusPageComponent.updateMany({
        where: { id: { in: compIds } },
        data: { status: 'OPERATIONAL' },
      });
    }

    return this.getIncident(accountId, pageId, incidentId);
  }
}
