/**
 * Privacy service: block, mute, restrict.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type BlockedItem = { id: string; username: string; displayName: string; profilePhoto: string | null; expiresAt?: string | null };
export type BlockHistoryItem = BlockedItem & { blockedAt: string; active: boolean };
export type MutedItem = { id: string; username: string; displayName: string; profilePhoto: string | null; mutePosts: boolean; muteStories: boolean };
export type RestrictedItem = { id: string; username: string; displayName: string; profilePhoto: string | null };
export type SnoozedItem = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
  snoozedUntil: string;
};
export type HiddenWordsConfig = {
  words: string[];
  regexPatterns: string[];
  allowListAccountIds: string[];
  commentFilterEnabled: boolean;
  dmFilterEnabled: boolean;
};

export class PrivacyService {
  async listBlocked(accountId: string): Promise<BlockedItem[]> {
    const now = new Date();
    const rows = await prisma.block.findMany({
      where: { blockerId: accountId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
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

  async listBlockHistory(accountId: string): Promise<BlockHistoryItem[]> {
    const now = new Date();
    const rows = await prisma.block.findMany({
      where: { blockerId: accountId },
      include: {
        blocked: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.blocked.id,
      username: r.blocked.username,
      displayName: r.blocked.displayName,
      profilePhoto: r.blocked.profilePhoto,
      blockedAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      active: r.expiresAt == null || r.expiresAt > now,
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
    // Keep row as history and mark inactive instead of deleting.
    await prisma.block.updateMany({
      where: { blockerId, blockedId },
      data: { expiresAt: new Date(), blockFutureAccounts: false },
    });
    return { ok: true };
  }

  async extendTemporaryBlock(blockerId: string, blockedId: string, durationDays: number): Promise<{ ok: boolean; expiresAt: string }> {
    const days = Math.min(365, Math.max(1, Math.floor(durationDays) || 7));
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await prisma.block.updateMany({
      where: { blockerId, blockedId },
      data: { expiresAt: until },
    });
    return { ok: true, expiresAt: until.toISOString() };
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

  async snoozeFeed(viewerId: string, snoozedId: string, durationDays: number): Promise<{ ok: boolean; until: string }> {
    if (viewerId === snoozedId) throw new AppError('Cannot snooze yourself', 400);
    const acc = await prisma.account.findUnique({ where: { id: snoozedId } });
    if (!acc) throw new AppError('Account not found', 404);
    const days = Math.min(90, Math.max(1, Math.floor(durationDays) || 30));
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await prisma.feedSnooze.upsert({
      where: { viewerId_snoozedId: { viewerId, snoozedId } },
      create: { viewerId, snoozedId, until },
      update: { until },
    });
    return { ok: true, until: until.toISOString() };
  }

  async unsnoozeFeed(viewerId: string, snoozedId: string): Promise<{ ok: boolean }> {
    await prisma.feedSnooze.deleteMany({
      where: { viewerId, snoozedId },
    });
    return { ok: true };
  }

  async listSnoozedAccounts(viewerId: string): Promise<SnoozedItem[]> {
    const now = new Date();
    const rows = await prisma.feedSnooze.findMany({
      where: { viewerId, until: { gt: now } },
      orderBy: { until: 'asc' },
      include: {
        snoozed: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
    });
    return rows.map((r) => ({
      id: r.snoozed.id,
      username: r.snoozed.username,
      displayName: r.snoozed.displayName,
      profilePhoto: r.snoozed.profilePhoto,
      snoozedUntil: r.until.toISOString(),
    }));
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

  private normalizeHiddenWordsConfig(raw: unknown): HiddenWordsConfig {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const words = Array.isArray(obj.words) ? obj.words.filter((x): x is string => typeof x === 'string') : [];
    const regexPatterns = Array.isArray(obj.regexPatterns) ? obj.regexPatterns.filter((x): x is string => typeof x === 'string') : [];
    const allowListAccountIds = Array.isArray(obj.allowListAccountIds) ? obj.allowListAccountIds.filter((x): x is string => typeof x === 'string') : [];
    const commentFilterEnabled = !!obj.commentFilterEnabled;
    const dmFilterEnabled = !!obj.dmFilterEnabled;
    return { words, regexPatterns, allowListAccountIds, commentFilterEnabled, dmFilterEnabled };
  }

  private validateRegexPatterns(patterns: string[]) {
    for (const p of patterns) {
      try {
        // Validate pattern at write time to avoid runtime crashes in moderation checks.
        // We intentionally do not persist flags to keep rule shape simple.
        // eslint-disable-next-line no-new
        new RegExp(p);
      } catch {
        throw new AppError(`Invalid regex pattern: ${p}`, 400);
      }
    }
  }

  async getHiddenWordsConfig(accountId: string): Promise<HiddenWordsConfig> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        hiddenWords: true,
        hiddenWordsCommentFilter: true,
        hiddenWordsDMFilter: true,
        clientSettings: true,
      },
    });
    if (!account) throw new AppError('Account not found', 404);
    const legacyWords = Array.isArray(account.hiddenWords) ? account.hiddenWords.filter((x): x is string => typeof x === 'string') : [];
    const fromClientSettings = this.normalizeHiddenWordsConfig(
      (account.clientSettings as Record<string, unknown> | null)?.hiddenWordsConfig,
    );
    const words = fromClientSettings.words.length ? fromClientSettings.words : legacyWords;
    return {
      words,
      regexPatterns: fromClientSettings.regexPatterns,
      allowListAccountIds: fromClientSettings.allowListAccountIds,
      commentFilterEnabled: fromClientSettings.commentFilterEnabled || account.hiddenWordsCommentFilter,
      dmFilterEnabled: fromClientSettings.dmFilterEnabled || account.hiddenWordsDMFilter,
    };
  }

  async saveHiddenWordsConfig(accountId: string, data: Partial<HiddenWordsConfig>): Promise<HiddenWordsConfig> {
    const current = await this.getHiddenWordsConfig(accountId);
    const next: HiddenWordsConfig = {
      words: data.words?.map((w) => w.trim()).filter(Boolean) ?? current.words,
      regexPatterns: data.regexPatterns?.map((w) => w.trim()).filter(Boolean) ?? current.regexPatterns,
      allowListAccountIds: data.allowListAccountIds?.map((w) => w.trim()).filter(Boolean) ?? current.allowListAccountIds,
      commentFilterEnabled: typeof data.commentFilterEnabled === 'boolean' ? data.commentFilterEnabled : current.commentFilterEnabled,
      dmFilterEnabled: typeof data.dmFilterEnabled === 'boolean' ? data.dmFilterEnabled : current.dmFilterEnabled,
    };
    this.validateRegexPatterns(next.regexPatterns);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { clientSettings: true },
    });
    const existingClientSettings = (account?.clientSettings as Record<string, unknown> | null) ?? {};
    await prisma.account.update({
      where: { id: accountId },
      data: {
        hiddenWords: next.words,
        hiddenWordsCommentFilter: next.commentFilterEnabled,
        hiddenWordsDMFilter: next.dmFilterEnabled,
        clientSettings: {
          ...existingClientSettings,
          hiddenWordsConfig: {
            words: next.words,
            regexPatterns: next.regexPatterns,
            allowListAccountIds: next.allowListAccountIds,
            commentFilterEnabled: next.commentFilterEnabled,
            dmFilterEnabled: next.dmFilterEnabled,
          },
        } as any,
      },
    });
    return next;
  }

  async importHiddenWords(accountId: string, payload: { words?: string[]; regexPatterns?: string[] }): Promise<HiddenWordsConfig> {
    const current = await this.getHiddenWordsConfig(accountId);
    const mergedWords = [...new Set([...(current.words || []), ...((payload.words || []).map((w) => w.trim()).filter(Boolean))])];
    const mergedRegex = [...new Set([...(current.regexPatterns || []), ...((payload.regexPatterns || []).map((w) => w.trim()).filter(Boolean))])];
    return this.saveHiddenWordsConfig(accountId, { words: mergedWords, regexPatterns: mergedRegex });
  }

  async exportHiddenWords(accountId: string): Promise<{ words: string[]; regexPatterns: string[] }> {
    const current = await this.getHiddenWordsConfig(accountId);
    return { words: current.words, regexPatterns: current.regexPatterns };
  }

  async getAnonymousReportingDefault(accountId: string): Promise<{ anonymousReportingDefault: boolean }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { clientSettings: true },
    });
    const cs = (account?.clientSettings as Record<string, unknown> | null) ?? {};
    return { anonymousReportingDefault: !!cs.anonymousReportingDefault };
  }

  async setAnonymousReportingDefault(accountId: string, anonymousReportingDefault: boolean): Promise<{ anonymousReportingDefault: boolean }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { clientSettings: true },
    });
    const cs = (account?.clientSettings as Record<string, unknown> | null) ?? {};
    await prisma.account.update({
      where: { id: accountId },
      data: {
        clientSettings: {
          ...cs,
          anonymousReportingDefault: !!anonymousReportingDefault,
        } as any,
      },
    });
    return { anonymousReportingDefault: !!anonymousReportingDefault };
  }
}
