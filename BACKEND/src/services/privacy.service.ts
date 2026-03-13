/**
 * Privacy service: block, mute, restrict.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type BlockedItem = { id: string; username: string; displayName: string; profilePhoto: string | null; expiresAt?: string | null };
export type MutedItem = { id: string; username: string; displayName: string; profilePhoto: string | null; mutePosts: boolean; muteStories: boolean };
export type RestrictedItem = { id: string; username: string; displayName: string; profilePhoto: string | null };

export class PrivacyService {
  async listBlocked(accountId: string): Promise<BlockedItem[]> {
    const rows = await prisma.block.findMany({
      where: { blockerId: accountId },
      include: {
        blocked: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => ({
      id: r.blocked.id,
      username: r.blocked.username,
      displayName: r.blocked.displayName,
      profilePhoto: r.blocked.profilePhoto,
      expiresAt: r.expiresAt?.toISOString() ?? null,
    }));
  }

  /**
   * For messaging: can the current user (meId) send DMs to the other account (otherId)?
   * Returns canMessage and, if not, reason: blocked_by_them (they blocked you) or blocked_by_you (you blocked them).
   */
  async canMessage(meId: string, otherId: string): Promise<{ canMessage: boolean; reason?: 'blocked_by_them' | 'blocked_by_you' }> {
    if (meId === otherId) return { canMessage: false, reason: 'blocked_by_them' };
    const iBlockedThem = await this.isBlockActive(meId, otherId);
    if (iBlockedThem) return { canMessage: false, reason: 'blocked_by_you' };
    const theyBlockedMe = await this.isBlockActive(otherId, meId);
    if (theyBlockedMe) return { canMessage: false, reason: 'blocked_by_them' };
    return { canMessage: true };
  }

  /** Returns true if block exists and has not expired. */
  async isBlockActive(blockerId: string, blockedId: string): Promise<boolean> {
    const b = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      select: { expiresAt: true },
    });
    if (!b) return false;
    if (b.expiresAt == null) return true;
    return b.expiresAt > new Date();
  }

  async block(blockerId: string, blockedId: string, blockFutureAccounts = false, durationDays?: number): Promise<{ ok: boolean }> {
    if (blockerId === blockedId) throw new AppError('Cannot block yourself', 400);
    const account = await prisma.account.findUnique({ where: { id: blockedId } });
    if (!account) throw new AppError('Account not found', 404);
    const expiresAt = durationDays != null && durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId, blockFutureAccounts, expiresAt },
      update: { blockFutureAccounts, expiresAt },
    });
    return { ok: true };
  }

  async unblock(blockerId: string, blockedId: string): Promise<{ ok: boolean }> {
    await prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    return { ok: true };
  }

  async listMuted(accountId: string): Promise<MutedItem[]> {
    const rows = await prisma.mute.findMany({
      where: { muterId: accountId },
      include: {
        muted: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => ({
      id: r.muted.id,
      username: r.muted.username,
      displayName: r.muted.displayName,
      profilePhoto: r.muted.profilePhoto,
      mutePosts: r.mutePosts,
      muteStories: r.muteStories,
    }));
  }

  async mute(muterId: string, mutedId: string, options?: { mutePosts?: boolean; muteStories?: boolean }): Promise<{ ok: boolean }> {
    if (muterId === mutedId) throw new AppError('Cannot mute yourself', 400);
    const account = await prisma.account.findUnique({ where: { id: mutedId } });
    if (!account) throw new AppError('Account not found', 404);
    await prisma.mute.upsert({
      where: { muterId_mutedId: { muterId, mutedId } },
      create: {
        muterId,
        mutedId,
        mutePosts: options?.mutePosts ?? true,
        muteStories: options?.muteStories ?? true,
      },
      update: {
        mutePosts: options?.mutePosts ?? true,
        muteStories: options?.muteStories ?? true,
      },
    });
    return { ok: true };
  }

  async unmute(muterId: string, mutedId: string): Promise<{ ok: boolean }> {
    await prisma.mute.deleteMany({
      where: { muterId, mutedId },
    });
    return { ok: true };
  }

  async listRestricted(accountId: string): Promise<RestrictedItem[]> {
    const rows = await prisma.restrict.findMany({
      where: { restrictorId: accountId },
      include: {
        restricted: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => ({
      id: r.restricted.id,
      username: r.restricted.username,
      displayName: r.restricted.displayName,
      profilePhoto: r.restricted.profilePhoto,
    }));
  }

  async restrict(restrictorId: string, restrictedId: string): Promise<{ ok: boolean }> {
    if (restrictorId === restrictedId) throw new AppError('Cannot restrict yourself', 400);
    const account = await prisma.account.findUnique({ where: { id: restrictedId } });
    if (!account) throw new AppError('Account not found', 404);
    await prisma.restrict.upsert({
      where: { restrictorId_restrictedId: { restrictorId, restrictedId } },
      create: { restrictorId, restrictedId },
      update: {},
    });
    return { ok: true };
  }

  async unrestrict(restrictorId: string, restrictedId: string): Promise<{ ok: boolean }> {
    await prisma.restrict.deleteMany({
      where: { restrictorId, restrictedId },
    });
    return { ok: true };
  }

  async listHideStoryFrom(accountId: string): Promise<{ id: string; username: string; displayName: string; profilePhoto: string | null }[]> {
    const rows = await prisma.hideStoryFrom.findMany({
      where: { accountId },
      include: {
        hiddenFrom: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => ({
      id: r.hiddenFrom.id,
      username: r.hiddenFrom.username,
      displayName: r.hiddenFrom.displayName,
      profilePhoto: r.hiddenFrom.profilePhoto,
    }));
  }

  async addHideStoryFrom(accountId: string, hiddenFromId: string): Promise<{ ok: boolean }> {
    if (accountId === hiddenFromId) throw new AppError('Cannot hide from yourself', 400);
    const account = await prisma.account.findUnique({ where: { id: hiddenFromId } });
    if (!account) throw new AppError('Account not found', 404);
    await prisma.hideStoryFrom.upsert({
      where: { accountId_hiddenFromId: { accountId, hiddenFromId } },
      create: { accountId, hiddenFromId },
      update: {},
    });
    return { ok: true };
  }

  async removeHideStoryFrom(accountId: string, hiddenFromId: string): Promise<{ ok: boolean }> {
    await prisma.hideStoryFrom.deleteMany({
      where: { accountId, hiddenFromId },
    });
    return { ok: true };
  }
}
