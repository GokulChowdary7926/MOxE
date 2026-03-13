import { randomBytes } from 'crypto';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class AccessService {
  async listOrgs() {
    return prisma.org.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createOrg(name: string, domain?: string | null) {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new AppError('Organization name is required', 400);
    const org = await prisma.org.create({
      data: {
        name: trimmed.slice(0, 200),
        domain: domain?.trim().slice(0, 253) || null,
      },
    });
    return org;
  }

  async listDepartments(orgId: string) {
    return prisma.orgDepartment.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(orgId: string, name: string, parentId?: string | null) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('Organization not found', 404);
    const trimmed = (name || '').trim();
    if (!trimmed) throw new AppError('Department name is required', 400);
    const dept = await prisma.orgDepartment.create({
      data: {
        orgId,
        name: trimmed.slice(0, 200),
        parentId: parentId || null,
      },
    });
    return dept;
  }

  async listRoles(orgId: string) {
    return prisma.orgRole.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(orgId: string, name: string) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('Organization not found', 404);
    const trimmed = (name || '').trim();
    if (!trimmed) throw new AppError('Role name is required', 400);
    const role = await prisma.orgRole.create({
      data: {
        orgId,
        name: trimmed.slice(0, 100),
      },
    });
    return role;
  }

  async listGroups(orgId: string) {
    return prisma.orgGroup.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(orgId: string, name: string) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('Organization not found', 404);
    const trimmed = (name || '').trim();
    if (!trimmed) throw new AppError('Group name is required', 400);
    const group = await prisma.orgGroup.create({
      data: {
        orgId,
        name: trimmed.slice(0, 200),
      },
    });
    return group;
  }

  async addUser(
    adminAccountId: string,
    data: {
      orgId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      departmentId?: string;
      roleId?: string;
      groupIds?: string[];
    }
  ) {
    const org = await prisma.org.findUnique({ where: { id: data.orgId } });
    if (!org) throw new AppError('Organization not found', 404);

    const emailRaw = (data.email || '').trim().toLowerCase();
    if (!emailRaw || !emailRaw.includes('@')) throw new AppError('Invalid email', 400);

    const existing = await prisma.orgUser.findFirst({
      where: { orgId: data.orgId, email: emailRaw },
    });
    if (existing) throw new AppError('User with this email already exists in org', 400);

    const account = await prisma.account.findFirst({
      where: { user: { email: emailRaw } },
    });

    const orgUser = await prisma.orgUser.create({
      data: {
        orgId: data.orgId,
        accountId: account?.id || adminAccountId,
        email: emailRaw,
        firstName: data.firstName?.slice(0, 100) || null,
        lastName: data.lastName?.slice(0, 100) || null,
        displayName: [data.firstName, data.lastName].filter(Boolean).join(' ').slice(0, 200) || null,
        departmentId: data.departmentId || null,
        roleId: data.roleId || null,
      },
    });

    const groupIds = Array.isArray(data.groupIds) ? data.groupIds : [];
    if (groupIds.length > 0) {
      await prisma.orgUserGroup.createMany({
        data: groupIds.map((gid) => ({ orgUserId: orgUser.id, groupId: gid })),
        skipDuplicates: true,
      });
    }

    return orgUser;
  }

  async updateUser(
    _adminAccountId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      departmentId?: string | null;
      roleId?: string | null;
      groupIds?: string[];
      isActive?: boolean;
    }
  ) {
    const orgUser = await prisma.orgUser.findUnique({ where: { id } });
    if (!orgUser) throw new AppError('User not found', 404);
    const update: any = {};
    if (data.firstName !== undefined) update.firstName = data.firstName?.slice(0, 100) || null;
    if (data.lastName !== undefined) update.lastName = data.lastName?.slice(0, 100) || null;
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const fn = data.firstName ?? orgUser.firstName ?? '';
      const ln = data.lastName ?? orgUser.lastName ?? '';
      const display = [fn, ln].filter(Boolean).join(' ').slice(0, 200) || null;
      update.displayName = display;
    }
    if (data.departmentId !== undefined) update.departmentId = data.departmentId || null;
    if (data.roleId !== undefined) update.roleId = data.roleId || null;
    if (data.isActive !== undefined) update.isActive = !!data.isActive;

    const updated = await prisma.orgUser.update({
      where: { id },
      data: update,
    });

    if (data.groupIds !== undefined) {
      await prisma.orgUserGroup.deleteMany({ where: { orgUserId: id } });
      const groupIds = Array.isArray(data.groupIds) ? data.groupIds : [];
      if (groupIds.length > 0) {
        await prisma.orgUserGroup.createMany({
          data: groupIds.map((gid) => ({ orgUserId: id, groupId: gid })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  }

  async listUsers(orgId: string) {
    return prisma.orgUser.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      include: {
        department: true,
        role: true,
        groups: { include: { group: true } },
      },
    });
  }

  // ----- SSO (8.1.2) -----

  async getSsoConfig(orgId: string) {
    return prisma.orgSsoConfig.findFirst({
      where: { orgId },
    });
  }

  async configureSso(
    orgId: string,
    data: {
      provider: string;
      protocol: 'SAML' | 'OIDC';
      metadataXml?: string;
      entityId?: string;
      ssoUrl?: string;
      logoutUrl?: string;
      certificate?: string;
      domains?: string[];
      enforcementLevel?: string;
    }
  ) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('Organization not found', 404);
    const domains = Array.isArray(data.domains) ? data.domains.filter(Boolean) : [];
    const payload: any = {
      provider: (data.provider || 'SAML').slice(0, 50),
      protocol: data.protocol || 'SAML',
      metadataXml: data.metadataXml || null,
      entityId: data.entityId?.slice(0, 500) || null,
      ssoUrl: data.ssoUrl?.slice(0, 500) || null,
      logoutUrl: data.logoutUrl?.slice(0, 500) || null,
      certificate: data.certificate || null,
      domains: domains.length ? domains : null,
      enforcementLevel: (data.enforcementLevel || 'optional').slice(0, 30),
    };
    const existing = await prisma.orgSsoConfig.findFirst({ where: { orgId } });
    if (existing) {
      return prisma.orgSsoConfig.update({
        where: { id: existing.id },
        data: payload,
      });
    }
    return prisma.orgSsoConfig.create({
      data: {
        orgId,
        ...payload,
      },
    });
  }

  async setSsoDomains(orgId: string, domains: string[]) {
    const cfg = await prisma.orgSsoConfig.findFirst({ where: { orgId } });
    if (!cfg) throw new AppError('SSO not configured', 404);
    return prisma.orgSsoConfig.update({
      where: { id: cfg.id },
      data: { domains: (domains || []).filter(Boolean) } as any,
    });
  }

  async setSsoEnforcement(orgId: string, enforcementLevel: string) {
    const cfg = await prisma.orgSsoConfig.findFirst({ where: { orgId } });
    if (!cfg) throw new AppError('SSO not configured', 404);
    return prisma.orgSsoConfig.update({
      where: { id: cfg.id },
      data: { enforcementLevel: enforcementLevel.slice(0, 30) },
    });
  }

  async testSsoConnection(orgId: string) {
    const cfg = await prisma.orgSsoConfig.findFirst({ where: { orgId } });
    if (!cfg) throw new AppError('SSO not configured', 404);
    let status: 'ok' | 'error' = 'ok';
    let error: string | null = null;
    if (!cfg.ssoUrl) {
      status = 'error';
      error = 'SSO URL not set';
    } else {
      try {
        const res = await fetch(cfg.ssoUrl, { method: 'GET' });
        if (!res.ok) {
          status = 'error';
          error = `IdP responded with ${res.status}`;
        }
      } catch (e) {
        status = 'error';
        error = (e as Error).message;
      }
    }
    await prisma.orgSsoConfig.update({
      where: { id: cfg.id },
      data: {
        lastTestAt: new Date(),
        lastTestStatus: status,
        lastTestError: error,
      },
    });
    if (status === 'error') throw new AppError(error || 'SSO test failed', 400);
    return { ok: true };
  }

  async activateSso(orgId: string, isActive: boolean) {
    const cfg = await prisma.orgSsoConfig.findFirst({ where: { orgId } });
    if (!cfg) throw new AppError('SSO not configured', 404);
    return prisma.orgSsoConfig.update({
      where: { id: cfg.id },
      data: { isActive },
    });
  }

  // ----- MFA (8.1.3) -----

  async getMfaPolicy(orgId: string) {
    return prisma.orgMfaPolicy.findFirst({
      where: { orgId },
    });
  }

  async setMfaPolicy(
    orgId: string,
    data: {
      methods: Record<string, boolean>;
      gracePeriodDays?: number;
      enforcementLevel?: string;
      exclusions?: { userIds?: string[]; groupIds?: string[] };
    }
  ) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('Organization not found', 404);
    const grace = Math.min(Math.max(data.gracePeriodDays ?? 14, 0), 90);
    const payload: any = {
      methods: data.methods || {},
      gracePeriodDays: grace,
      enforcementLevel: (data.enforcementLevel || 'optional').slice(0, 30),
      exclusions: data.exclusions || null,
    };
    const existing = await prisma.orgMfaPolicy.findFirst({ where: { orgId } });
    if (existing) {
      return prisma.orgMfaPolicy.update({
        where: { id: existing.id },
        data: payload,
      });
    }
    return prisma.orgMfaPolicy.create({
      data: {
        orgId,
        ...payload,
      },
    });
  }

  async listMfaEnrollments(orgId: string) {
    return prisma.orgMfaEnrollment.findMany({
      where: { user: { orgId } },
      include: { user: true },
    });
  }

  async getMfaCompliance(orgId: string) {
    const users = await prisma.orgUser.findMany({ where: { orgId } });
    const enrollments = await this.listMfaEnrollments(orgId);
    const enrolledUserIds = new Set(enrollments.map((e) => e.orgUserId));
    const total = users.length;
    const enrolled = users.filter((u) => enrolledUserIds.has(u.id)).length;
    return {
      totalUsers: total,
      enrolledUsers: enrolled,
      enrollmentRate: total > 0 ? enrolled / total : 0,
    };
  }

  async createInvitation(
    adminAccountId: string,
    data: {
      orgId: string;
      email: string;
      expiresInDays?: number;
    }
  ) {
    const org = await prisma.org.findUnique({ where: { id: data.orgId } });
    if (!org) throw new AppError('Organization not found', 404);

    const email = (data.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) throw new AppError('Invalid email', 400);

    const days = Math.min(Math.max(data.expiresInDays ?? 7, 1), 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const token = randomBytes(32).toString('hex');

    const invite = await prisma.orgInvitation.create({
      data: {
        orgId: org.id,
        email,
        token,
        expiresAt,
        invitedById: adminAccountId,
      },
    });

    return invite;
  }

  async acceptInvitation(token: string, accountId: string) {
    const invite = await prisma.orgInvitation.findUnique({
      where: { token },
    });
    if (!invite || invite.expiresAt < new Date()) throw new AppError('Invitation is invalid or expired', 400);

    const existingUser = await prisma.orgUser.findFirst({
      where: { orgId: invite.orgId, email: invite.email },
    });
    let orgUser = existingUser;
    if (!orgUser) {
      orgUser = await prisma.orgUser.create({
        data: {
          orgId: invite.orgId,
          accountId,
          email: invite.email,
        },
      });
    } else {
      await prisma.orgUser.update({
        where: { id: orgUser.id },
        data: { accountId },
      });
    }

    await prisma.orgInvitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), invitedForId: accountId },
    });

    return orgUser;
  }

  async importUsers(
    adminAccountId: string,
    orgId: string,
    rows: { email: string; firstName?: string; lastName?: string; departmentId?: string; roleId?: string; groupIds?: string[] }[]
  ) {
    const created: string[] = [];
    for (const row of rows.slice(0, 500)) {
      try {
        const user = await this.addUser(adminAccountId, { orgId, ...row });
        created.push(user.id);
      } catch {
      }
    }
    return { imported: created.length, userIds: created };
  }

  async listInvitations(orgId: string) {
    return prisma.orgInvitation.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
}


