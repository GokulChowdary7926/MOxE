import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Resolve accountId from request (job account context). */
function accountId(req: any): string {
  const id = req?.user?.accountId || req?.user?.userId;
  if (!id) throw new AppError('Unauthorized', 401);
  return id;
}

/** Check if account can access space: owner or has permission. */
async function canAccessSpace(spaceId: string, accountId: string, minRole?: 'VIEWER' | 'CONTRIBUTOR' | 'EDITOR' | 'ADMIN'): Promise<boolean> {
  const space = await prisma.knowledgeSpace.findUnique({
    where: { id: spaceId },
    include: { permissions: true },
  });
  if (!space) return false;
  if (space.accountId === accountId) return true;
  const perm = space.permissions.find((p) => p.accountId === accountId);
  if (!perm) return false;
  const order = ['VIEWER', 'CONTRIBUTOR', 'EDITOR', 'ADMIN'];
  return minRole ? order.indexOf(perm.role) >= order.indexOf(minRole) : true;
}

/** Get spaces the account can access (owned or shared). */
async function getAccessibleSpaceIds(accountId: string): Promise<string[]> {
  const [owned, permitted] = await Promise.all([
    prisma.knowledgeSpace.findMany({ where: { accountId }, select: { id: true } }),
    prisma.knowledgeSpacePermission.findMany({ where: { accountId }, select: { spaceId: true } }),
  ]);
  const ids = new Set<string>([...owned.map((s) => s.id), ...permitted.map((p) => p.spaceId)]);
  return Array.from(ids);
}

/** Check if account can access page: respects page-level restrictions when set. */
async function canAccessPage(accountId: string, page: { spaceId: string; space: { accountId: string }; pageRestrictions?: { accountId: string; role: string }[] }, minRole?: 'VIEWER' | 'CONTRIBUTOR' | 'EDITOR'): Promise<boolean> {
  const space = page.space as { accountId: string };
  if (space.accountId === accountId) return true; // Space owner always has access
  const restrictions = (page as any).pageRestrictions || [];
  if (restrictions.length > 0) {
    const perm = restrictions.find((p: any) => p.accountId === accountId);
    if (!perm) return false;
    if (perm.role === 'NONE') return false;
    const order = ['VIEWER', 'CONTRIBUTOR', 'EDITOR'];
    return minRole ? order.indexOf(perm.role) >= order.indexOf(minRole) : true;
  }
  return canAccessSpace(page.spaceId, accountId, minRole);
}

export class KnowKnowledgeService {
  // ---------- Spaces ----------
  async listSpaces(accountId: string) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    if (spaceIds.length === 0) return [];
    return prisma.knowledgeSpace.findMany({
      where: { id: { in: spaceIds } },
      orderBy: { updatedAt: 'desc' },
      include: {
        account: { select: { id: true, displayName: true } },
        _count: { select: { pages: true } },
      },
    });
  }

  async getSpace(accountId: string, spaceIdOrSlug: string) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    const isCuid = spaceIdOrSlug.length >= 20 && !spaceIdOrSlug.includes('/');
    const space = await prisma.knowledgeSpace.findFirst({
      where: isCuid
        ? { id: spaceIdOrSlug }
        : { slug: spaceIdOrSlug },
      include: {
        account: { select: { id: true, displayName: true } },
        permissions: { include: { account: { select: { id: true, displayName: true } } } },
        labels: true,
        _count: { select: { pages: true } },
      },
    });
    if (!space) throw new AppError('Space not found', 404);
    if (!spaceIds.includes(space.id)) throw new AppError('Access denied', 403);
    return space;
  }

  async createSpace(accountId: string, data: {
    name: string;
    description?: string;
    type?: string;
    slug?: string;
  }) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
    const slug = (data.slug || slugify(name)).slice(0, 120) || slugify(name);
    const type = ['TEAM', 'PROJECT', 'PERSONAL', 'COMPANY', 'CLIENT'].includes(data.type || '') ? data.type : 'TEAM';
    const existing = await prisma.knowledgeSpace.findUnique({
      where: { accountId_slug: { accountId, slug } },
    });
    if (existing) throw new AppError('A space with this name/slug already exists', 400);
    return prisma.knowledgeSpace.create({
      data: {
        accountId,
        name,
        slug,
        description: (data.description || '').slice(0, 500) || undefined,
        type,
      },
      include: { account: { select: { id: true, displayName: true } } },
    });
  }

  async updateSpace(accountId: string, spaceId: string, data: { name?: string; description?: string; type?: string }) {
    const space = await prisma.knowledgeSpace.findUnique({ where: { id: spaceId } });
    if (!space) throw new AppError('Space not found', 404);
    if (space.accountId !== accountId) throw new AppError('Only the owner can update the space', 403);
    const update: { name?: string; description?: string | null; type?: string } = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) throw new AppError('Name must be 3–100 characters', 400);
      update.name = name;
    }
    if (data.description !== undefined) update.description = data.description?.slice(0, 500) || null;
    if (data.type !== undefined && ['TEAM', 'PROJECT', 'PERSONAL', 'COMPANY', 'CLIENT'].includes(data.type))
      update.type = data.type;
    return prisma.knowledgeSpace.update({
      where: { id: spaceId },
      data: update,
      include: { account: { select: { id: true, displayName: true } } },
    });
  }

  async deleteSpace(accountId: string, spaceId: string) {
    const space = await prisma.knowledgeSpace.findUnique({ where: { id: spaceId } });
    if (!space) throw new AppError('Space not found', 404);
    if (space.accountId !== accountId) throw new AppError('Only the owner can delete the space', 403);
    await prisma.knowledgeSpace.delete({ where: { id: spaceId } });
    return { ok: true };
  }

  async setSpacePermissions(accountId: string, spaceId: string, permissions: { accountId: string; role: string }[]) {
    const space = await prisma.knowledgeSpace.findUnique({ where: { id: spaceId } });
    if (!space) throw new AppError('Space not found', 404);
    if (space.accountId !== accountId) throw new AppError('Only the owner can manage permissions', 403);
    const validRoles = ['ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'];
    await prisma.knowledgeSpacePermission.deleteMany({ where: { spaceId } });
    if (permissions.length > 0) {
      const toCreate = permissions
        .filter((p) => validRoles.includes(p.role))
        .map((p) => ({ spaceId, accountId: p.accountId, role: p.role }));
      await prisma.knowledgeSpacePermission.createMany({ data: toCreate });
    }
    return this.getSpace(accountId, spaceId);
  }

  // ---------- Labels (space-scoped) ----------
  async getLabels(accountId: string, spaceId: string) {
    await canAccessSpace(spaceId, accountId);
    return prisma.knowledgeLabel.findMany({
      where: { spaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(accountId: string, spaceId: string, data: { name: string; color?: string }) {
    const canEdit = await canAccessSpace(spaceId, accountId, 'EDITOR');
    if (!canEdit) throw new AppError('You need Editor access to create labels', 403);
    const name = (data.name || '').trim().slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, '-');
    if (!name) throw new AppError('Label name required', 400);
    const existing = await prisma.knowledgeLabel.findUnique({
      where: { spaceId_name: { spaceId, name } },
    });
    if (existing) throw new AppError('Label already exists', 400);
    return prisma.knowledgeLabel.create({
      data: { spaceId, name, color: (data.color || '#6B7280').slice(0, 20) },
    });
  }

  // ---------- Pages ----------
  async listPages(accountId: string, spaceId: string, options?: { parentId?: string | null; status?: string }) {
    await canAccessSpace(spaceId, accountId);
    const where: { spaceId: string; parentId?: string | null; status?: string } = { spaceId };
    if (options?.parentId !== undefined) where.parentId = options.parentId;
    if (options?.status) where.status = options.status;
    return prisma.knowledgePage.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, displayName: true } },
        updatedBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
        _count: { select: { children: true } },
      },
    });
  }

  async getPage(accountId: string, pageIdOrSlug: string, spaceId?: string) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    const isCuid = pageIdOrSlug.length >= 20 && !pageIdOrSlug.includes('/');
    if (!isCuid && (!spaceId || !spaceIds.includes(spaceId))) throw new AppError('Space required for slug lookup or access denied', 400);
    const page = await prisma.knowledgePage.findFirst({
      where: isCuid
        ? { id: pageIdOrSlug, spaceId: { in: spaceIds } }
        : { spaceId: spaceId!, slug: pageIdOrSlug },
      include: {
        space: { include: { labels: true } },
        parent: { select: { id: true, title: true, slug: true } },
        createdBy: { select: { id: true, displayName: true } },
        updatedBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
        attachments: true,
        pageRestrictions: { include: { account: { select: { id: true, displayName: true } } } },
        _count: { select: { children: true } },
      },
    });
    if (!page) throw new AppError('Page not found', 404);
    const canAccess = await canAccessPage(accountId, page as any);
    if (!canAccess) throw new AppError('Access denied', 403);
    // Increment view count (fire-and-forget)
    prisma.knowledgePage.update({ where: { id: page.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return page;
  }

  async createPage(accountId: string, spaceId: string, data: {
    title: string;
    content?: string;
    parentId?: string | null;
    status?: string;
    labelIds?: string[];
  }) {
    const canEdit = await canAccessSpace(spaceId, accountId, 'CONTRIBUTOR');
    if (!canEdit) throw new AppError('You need at least Contributor access to create pages', 403);
    const title = (data.title || '').trim();
    if (title.length < 3 || title.length > 200) throw new AppError('Title must be 3–200 characters', 400);
    let slug = slugify(title).slice(0, 250);
    if (!slug) slug = 'page';
    let slugBase = slug;
    let n = 0;
    while (true) {
      const existing = await prisma.knowledgePage.findUnique({
        where: { spaceId_slug: { spaceId, slug } },
      });
      if (!existing) break;
      slug = `${slugBase}-${++n}`;
    }
    if (data.parentId) {
      const parent = await prisma.knowledgePage.findFirst({
        where: { id: data.parentId, spaceId },
      });
      if (!parent) throw new AppError('Parent page not found', 400);
    }
    const status = data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const page = await prisma.knowledgePage.create({
      data: {
        spaceId,
        parentId: data.parentId || null,
        title,
        slug,
        content: (data.content || '').slice(0, 500_000),
        status,
        createdById: accountId,
        updatedById: accountId,
      },
      include: {
        space: true,
        parent: { select: { id: true, title: true, slug: true } },
        createdBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
      },
    });
    if (data.labelIds?.length) {
      await prisma.knowledgePageLabel.createMany({
        data: data.labelIds.map((labelId) => ({ pageId: page.id, labelId })),
        skipDuplicates: true,
      });
    }
    return this.getPage(accountId, page.id);
  }

  async updatePage(accountId: string, pageId: string, data: {
    title?: string;
    content?: string;
    parentId?: string | null;
    status?: string;
    labelIds?: string[];
  }) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const canEdit = await canAccessPage(accountId, page as any, 'CONTRIBUTOR');
    if (!canEdit) throw new AppError('You need at least Contributor access to edit', 403);
    const update: { title?: string; content?: string; parentId?: string | null; status?: string; updatedById?: string } = {};
    if (data.title !== undefined) {
      const title = data.title.trim();
      if (title.length < 3 || title.length > 200) throw new AppError('Title must be 3–200 characters', 400);
      update.title = title;
    }
    if (data.content !== undefined) update.content = data.content.slice(0, 500_000);
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.knowledgePage.findFirst({
          where: { id: data.parentId, spaceId: page.spaceId },
        });
        if (!parent) throw new AppError('Parent page not found', 400);
        if (parent.id === pageId) throw new AppError('Page cannot be its own parent', 400);
      }
      update.parentId = data.parentId || null;
    }
    if (data.status === 'PUBLISHED' || data.status === 'DRAFT') update.status = data.status;
    update.updatedById = accountId;

    const updated = await prisma.knowledgePage.update({
      where: { id: pageId },
      data: update,
      include: {
        space: true,
        parent: { select: { id: true, title: true, slug: true } },
        createdBy: { select: { id: true, displayName: true } },
        updatedBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
        attachments: true,
      },
    });
    if (data.labelIds !== undefined) {
      await prisma.knowledgePageLabel.deleteMany({ where: { pageId: pageId } });
      if (data.labelIds.length > 0) {
        await prisma.knowledgePageLabel.createMany({
          data: data.labelIds.map((labelId) => ({ pageId, labelId })),
          skipDuplicates: true,
        });
      }
    }
    return data.labelIds !== undefined ? this.getPage(accountId, pageId) : updated;
  }

  async deletePage(accountId: string, pageId: string) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const canEdit = await canAccessPage(accountId, page as any, 'EDITOR');
    if (!canEdit) throw new AppError('You need Editor access to delete', 403);
    await prisma.knowledgePage.delete({ where: { id: pageId } });
    return { ok: true };
  }

  // ---------- Publish & version history ----------
  async publishPage(accountId: string, pageId: string) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const canEdit = await canAccessPage(accountId, page as any, 'CONTRIBUTOR');
    if (!canEdit) throw new AppError('Access denied', 403);
    const lastVersion = await prisma.knowledgePageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;
    await prisma.knowledgePageVersion.create({
      data: {
        pageId,
        title: page.title,
        content: page.content,
        versionNumber,
        createdById: accountId,
      },
    });
    return prisma.knowledgePage.update({
      where: { id: pageId },
      data: { status: 'PUBLISHED', updatedById: accountId },
      include: {
        space: true,
        createdBy: { select: { id: true, displayName: true } },
        updatedBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
        attachments: true,
      },
    });
  }

  async getVersionHistory(accountId: string, pageId: string) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const can = await canAccessPage(accountId, page as any);
    if (!can) throw new AppError('Access denied', 403);
    return prisma.knowledgePageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      include: { createdBy: { select: { id: true, displayName: true } } },
    });
  }

  async getVersion(accountId: string, pageId: string, versionNumber: number) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const can = await canAccessPage(accountId, page as any);
    if (!can) throw new AppError('Access denied', 403);
    const v = await prisma.knowledgePageVersion.findFirst({
      where: { pageId, versionNumber: Number(versionNumber) },
      include: { createdBy: { select: { id: true, displayName: true } } },
    });
    if (!v) throw new AppError('Version not found', 404);
    return v;
  }

  async restoreVersion(accountId: string, pageId: string, versionNumber: number) {
    const v = await this.getVersion(accountId, pageId, versionNumber);
    return this.updatePage(accountId, pageId, { title: v.title, content: v.content });
  }

  // ---------- Comments ----------
  async getComments(accountId: string, pageId: string) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const can = await canAccessPage(accountId, page as any);
    if (!can) throw new AppError('Access denied', 403);
    return prisma.knowledgePageComment.findMany({
      where: { pageId },
      orderBy: { createdAt: 'asc' },
      include: {
        account: { select: { id: true, displayName: true } },
        replies: { include: { account: { select: { id: true, displayName: true } } } },
      },
    });
  }

  async addComment(accountId: string, pageId: string, data: { content: string; parentId?: string | null }) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const can = await canAccessPage(accountId, page as any);
    if (!can) throw new AppError('Access denied', 403);
    const content = (data.content || '').trim();
    if (!content) throw new AppError('Comment content required', 400);
    return prisma.knowledgePageComment.create({
      data: {
        pageId,
        accountId,
        parentId: data.parentId || null,
        content,
      },
      include: { account: { select: { id: true, displayName: true } } },
    });
  }

  // ---------- Attachments ----------
  async addAttachment(accountId: string, pageId: string, data: { fileUrl: string; fileName: string }) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const canEdit = await canAccessPage(accountId, page as any, 'CONTRIBUTOR');
    if (!canEdit) throw new AppError('Access denied', 403);
    if (!data.fileUrl?.trim() || !data.fileName?.trim()) throw new AppError('fileUrl and fileName required', 400);
    return prisma.knowledgePageAttachment.create({
      data: {
        pageId,
        fileUrl: data.fileUrl.trim().slice(0, 1000),
        fileName: data.fileName.trim().slice(0, 255),
        uploadedById: accountId,
      },
      include: { uploadedBy: { select: { id: true, displayName: true } } },
    });
  }

  async deleteAttachment(accountId: string, attachmentId: string) {
    const att = await prisma.knowledgePageAttachment.findUnique({
      where: { id: attachmentId },
      include: { page: { include: { space: true, pageRestrictions: true } } },
    });
    if (!att) throw new AppError('Attachment not found', 404);
    const canEdit = await canAccessPage(accountId, att.page as any, 'EDITOR');
    if (!canEdit) throw new AppError('Access denied', 403);
    await prisma.knowledgePageAttachment.delete({ where: { id: attachmentId } });
    return { ok: true };
  }

  // ---------- Page restrictions (setRestrictions) ----------
  async getPageRestrictions(accountId: string, pageId: string) {
    const page = await prisma.knowledgePage.findUnique({
      where: { id: pageId },
      include: { space: true, pageRestrictions: { include: { account: { select: { id: true, displayName: true } } } } },
    });
    if (!page) throw new AppError('Page not found', 404);
    const can = await canAccessPage(accountId, { ...page, space: page.space, pageRestrictions: page.pageRestrictions } as any);
    if (!can) throw new AppError('Access denied', 403);
    return page.pageRestrictions;
  }

  async setPageRestrictions(accountId: string, pageId: string, permissions: { accountId: string; role: string }[]) {
    const page = await prisma.knowledgePage.findUnique({ where: { id: pageId }, include: { space: true, pageRestrictions: true } });
    if (!page) throw new AppError('Page not found', 404);
    const canEdit = await canAccessPage(accountId, page as any, 'EDITOR');
    if (!canEdit) throw new AppError('You need Editor access to set page restrictions', 403);
    const validRoles = ['VIEWER', 'CONTRIBUTOR', 'EDITOR', 'NONE'];
    await prisma.knowledgePagePermission.deleteMany({ where: { pageId } });
    if (permissions.length > 0) {
      const toCreate = permissions
        .filter((p) => p.accountId && validRoles.includes(p.role))
        .map((p) => ({ pageId, accountId: p.accountId, role: p.role }));
      await prisma.knowledgePagePermission.createMany({ data: toCreate });
    }
    return this.getPageRestrictions(accountId, pageId);
  }

  // ---------- Search & discovery ----------
  async searchKnowledge(accountId: string, params: {
    q?: string;
    spaceId?: string;
    labelIds?: string[];
    authorId?: string;
    recentlyUpdated?: boolean;
    popular?: boolean;
    limit?: number;
  }) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    if (spaceIds.length === 0) return { pages: [], spaces: [] };

    const limit = Math.min(params.limit ?? 50, 100);
    const where: any = { spaceId: { in: spaceIds }, status: 'PUBLISHED' };

    if (params.spaceId && spaceIds.includes(params.spaceId)) where.spaceId = params.spaceId;
    if (params.authorId) where.createdById = params.authorId;
    if (params.labelIds?.length) {
      where.pageLabels = { some: { labelId: { in: params.labelIds } } };
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (params.popular) orderBy = { viewCount: 'desc' };
    if (params.recentlyUpdated) orderBy = { updatedAt: 'desc' };

    const pages = await prisma.knowledgePage.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        space: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, displayName: true } },
        updatedBy: { select: { id: true, displayName: true } },
        pageLabels: { include: { label: true } },
      },
    });

    if (params.q && params.q.trim().length >= 2) {
      const q = params.q.trim();
      const searchWhere = {
        ...where,
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { content: { contains: q, mode: 'insensitive' as const } },
        ],
      };
      const searched = await prisma.knowledgePage.findMany({
        where: searchWhere,
        orderBy: [{ updatedAt: 'desc' }],
        take: limit,
        include: {
          space: { select: { id: true, name: true, slug: true } },
          createdBy: { select: { id: true, displayName: true } },
          updatedBy: { select: { id: true, displayName: true } },
          pageLabels: { include: { label: true } },
        },
      });
      return { pages: searched, spaces: [] };
    }

    return { pages, spaces: [] };
  }

  async recentlyUpdated(accountId: string, spaceId?: string, limit = 20) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    if (spaceIds.length === 0) return [];
    const where: any = { spaceId: { in: spaceIds }, status: 'PUBLISHED' };
    if (spaceId && spaceIds.includes(spaceId)) where.spaceId = spaceId;
    return prisma.knowledgePage.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 50),
      include: {
        space: { select: { id: true, name: true, slug: true } },
        updatedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async popularPages(accountId: string, spaceId?: string, limit = 20) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    if (spaceIds.length === 0) return [];
    const where: any = { spaceId: { in: spaceIds }, status: 'PUBLISHED' };
    if (spaceId && spaceIds.includes(spaceId)) where.spaceId = spaceId;
    return prisma.knowledgePage.findMany({
      where,
      orderBy: { viewCount: 'desc' },
      take: Math.min(limit, 50),
      include: {
        space: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });
  }

  /** For search UI: spaces (with labels), and authors who have created/updated pages. */
  async getSearchFilters(accountId: string) {
    const spaceIds = await getAccessibleSpaceIds(accountId);
    if (spaceIds.length === 0) return { spaces: [], labels: [], authors: [] };
    const [spaces, labels, pageRows] = await Promise.all([
      prisma.knowledgeSpace.findMany({
        where: { id: { in: spaceIds } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.knowledgeLabel.findMany({
        where: { spaceId: { in: spaceIds } },
        orderBy: [{ spaceId: 'asc' }, { name: 'asc' }],
      }),
      prisma.knowledgePage.findMany({
        where: { spaceId: { in: spaceIds } },
        select: { createdById: true, updatedById: true },
      }),
    ]);
    const accountIds = new Set<string>();
    pageRows.forEach((r) => {
      if (r.createdById) accountIds.add(r.createdById);
      if (r.updatedById) accountIds.add(r.updatedById);
    });
    const accounts = accountIds.size > 0
      ? await prisma.account.findMany({
          where: { id: { in: Array.from(accountIds) } },
          select: { id: true, displayName: true },
        })
      : [];
    return { spaces, labels, authors: accounts };
  }
}
