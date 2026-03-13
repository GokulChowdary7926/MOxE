import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';

export class JobTeamsService {
  async listMembers(accountId: string) {
    const members = await prisma.jobTeam.findMany({
      where: { accountId },
      include: {
        member: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return members;
  }

  async addMember(
    accountId: string,
    currentAccountId: string,
    input: { memberAccountId: string; role?: string },
  ) {
    const memberAccountId = (input.memberAccountId || '').trim();
    if (!memberAccountId) throw new AppError('memberAccountId required', 400);
    if (memberAccountId === accountId) throw new AppError('Cannot add self as team member', 400);

    const existing = await prisma.jobTeam.findUnique({
      where: { accountId_memberId: { accountId, memberId: memberAccountId } },
    });
    if (existing) throw new AppError('Already a team member', 400);

    const memberAccount = await prisma.account.findUnique({
      where: { id: memberAccountId },
      select: { id: true, accountType: true, displayName: true, username: true, profilePhoto: true },
    });
    if (!memberAccount) throw new AppError('Member account not found', 404);

    const role = (input.role || 'MEMBER').toUpperCase();
    const allowedRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    const finalRole = allowedRoles.includes(role) ? role : 'MEMBER';

    const created = await prisma.jobTeam.create({
      data: {
        accountId,
        memberId: memberAccountId,
        role: finalRole,
        invitedById: currentAccountId,
      },
      include: {
        member: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    return created;
  }

  async updateMemberRole(accountId: string, memberId: string, role: string) {
    const existing = await prisma.jobTeam.findFirst({
      where: { id: memberId, accountId },
    });
    if (!existing) throw new AppError('Team member not found', 404);

    const normalized = (role || '').toUpperCase();
    const allowedRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    if (!allowedRoles.includes(normalized)) throw new AppError('Invalid role', 400);

    const updated = await prisma.jobTeam.update({
      where: { id: memberId },
      data: { role: normalized },
      include: {
        member: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });

    return updated;
  }

  async removeMember(accountId: string, memberId: string) {
    const existing = await prisma.jobTeam.findFirst({
      where: { id: memberId, accountId },
    });
    if (!existing) throw new AppError('Team member not found', 404);
    await prisma.jobTeam.delete({ where: { id: memberId } });
    return { ok: true };
  }
}

