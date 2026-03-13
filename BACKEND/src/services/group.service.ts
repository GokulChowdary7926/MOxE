import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const MAX_MEMBERS = 50;

export class GroupService {
  async list(accountId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { accountId },
      include: {
        group: {
          include: {
            members: { include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } } },
            admins: { select: { accountId: true } },
          },
        },
      },
    });
    return memberships.filter((m) => m.group.isActive).map((m) => ({ ...m.group, members: m.group.members.map((mb) => ({ ...mb.account, role: m.group.admins.some((a) => a.accountId === mb.accountId) ? 'ADMIN' : 'MEMBER' })) }));
  }

  async getById(accountId: string, groupId: string) {
    const member = await prisma.groupMember.findUnique({ where: { groupId_accountId: { groupId, accountId } } });
    if (!member) throw new AppError('Not a member of this group', 403);
    const group = await prisma.group.findFirst({
      where: { id: groupId, isActive: true },
      include: {
        members: { include: { account: { select: { id: true, username: true, displayName: true, profilePhoto: true } } } },
        admins: { select: { accountId: true } },
        creator: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    if (!group) throw new AppError('Group not found', 404);
    return { ...group, members: group.members.map((m) => ({ ...m.account, role: group.admins.some((a) => a.accountId === m.accountId) ? 'ADMIN' : 'MEMBER' })) };
  }

  async create(accountId: string, data: { name: string; photo?: string; participantIds: string[] }) {
    const name = (data.name || 'Group').trim().slice(0, 100);
    const ids = [...new Set([accountId, ...(data.participantIds || [])])].slice(0, MAX_MEMBERS);
    if (ids.length < 2) throw new AppError('At least 2 participants including you', 400);
    const group = await prisma.group.create({ data: { name, photo: data.photo ?? null, createdBy: accountId } });
    await prisma.groupAdmin.create({ data: { groupId: group.id, accountId } });
    for (const id of ids) {
      await prisma.groupMember.upsert({ where: { groupId_accountId: { groupId: group.id, accountId: id } }, create: { groupId: group.id, accountId: id }, update: {} });
    }
    return this.getById(accountId, group.id);
  }

  async update(accountId: string, groupId: string, data: { name?: string; photo?: string }) {
    await this.requireAdmin(accountId, groupId);
    await prisma.group.update({ where: { id: groupId }, data: { ...(data.name != null && { name: data.name.slice(0, 100) }), ...(data.photo !== undefined && { photo: data.photo }) } });
    return this.getById(accountId, groupId);
  }

  async delete(accountId: string, groupId: string) {
    await this.requireAdmin(accountId, groupId);
    await prisma.group.update({ where: { id: groupId }, data: { isActive: false } });
    return { ok: true };
  }

  async addMembers(accountId: string, groupId: string, participantIds: string[]) {
    await this.requireAdmin(accountId, groupId);
    const group = await prisma.group.findFirst({ where: { id: groupId }, include: { members: { select: { accountId: true } } } });
    if (!group) throw new AppError('Group not found', 404);
    const toAdd = participantIds.filter((id) => !group.members.some((m) => m.accountId === id)).slice(0, MAX_MEMBERS - group.members.length);
    for (const id of toAdd) {
      await prisma.groupMember.upsert({ where: { groupId_accountId: { groupId, accountId: id } }, create: { groupId, accountId: id }, update: {} });
    }
    return this.getById(accountId, groupId);
  }

  async removeMember(accountId: string, groupId: string, userId: string) {
    const isAdmin = await this.requireAdmin(accountId, groupId, false);
    if (userId !== accountId && !isAdmin) throw new AppError('Only admins can remove other members', 403);
    await prisma.groupMember.deleteMany({ where: { groupId, accountId: userId } });
    return { ok: true };
  }

  async setAdmin(accountId: string, groupId: string, userId: string, isAdmin: boolean) {
    await this.requireAdmin(accountId, groupId);
    if (isAdmin) await prisma.groupAdmin.upsert({ where: { groupId_accountId: { groupId, accountId: userId } }, create: { groupId, accountId: userId }, update: {} });
    else await prisma.groupAdmin.deleteMany({ where: { groupId, accountId: userId } });
    return this.getById(accountId, groupId);
  }

  async leave(accountId: string, groupId: string) {
    await prisma.groupMember.deleteMany({ where: { groupId, accountId } });
    await prisma.groupAdmin.deleteMany({ where: { groupId, accountId } });
    return { ok: true };
  }

  private async requireAdmin(accountId: string, groupId: string, throwIfNot = true): Promise<boolean> {
    const admin = await prisma.groupAdmin.findUnique({ where: { groupId_accountId: { groupId, accountId } } });
    if (!admin && throwIfNot) throw new AppError('Only admins can perform this action', 403);
    return !!admin;
  }
}
