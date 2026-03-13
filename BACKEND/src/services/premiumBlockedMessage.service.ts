/**
 * Premium: messaging blocked users.
 * Premium (Star/Thick) users can send limited messages to users who blocked them.
 * 2 grants per 28-day period; 14-day window per grant; 150 chars (optional paid extension).
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const PERIOD_DAYS = 28;
const MESSAGING_WINDOW_DAYS = 14;
const MAX_GRANTS_PER_PERIOD = 2;
const BASE_CHAR_LIMIT = 150;
const EXTENSION_CHAR_LIMIT = 150;
const REBLOCK_COOLDOWN_DAYS = 30;
const PREMIUM_TIERS = ['STAR', 'THICK'];

function getPeriodStart(date: Date): Date {
  const epoch = new Date('2020-01-01T00:00:00Z').getTime();
  const ms = date.getTime() - epoch;
  const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const periodIndex = Math.floor(ms / periodMs);
  return new Date(epoch + periodIndex * periodMs);
}

function getPeriodEnd(periodStart: Date): Date {
  return new Date(periodStart.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export class PremiumBlockedMessageService {
  private async isPremium(accountId: string): Promise<boolean> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true },
    });
    return account ? PREMIUM_TIERS.includes(account.subscriptionTier) : false;
  }

  private async isBlocked(senderId: string, recipientId: string): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: recipientId, blockedId: senderId } },
      select: { expiresAt: true },
    });
    if (!block) return false;
    if (block.expiresAt != null && block.expiresAt <= new Date()) return false;
    return true;
  }

  private async getActiveGrantsInPeriod(senderId: string, periodStart: Date, periodEnd: Date) {
    return prisma.premiumMessageGrant.findMany({
      where: {
        senderAccountId: senderId,
        status: 'active',
        grantedAt: { gte: periodStart, lt: periodEnd },
      },
      include: { messages: { orderBy: { sentAt: 'desc' } } },
    });
  }

  /** Check if recipient re-blocked sender within cooldown (recipient blocked sender again after viewing a premium message). */
  private async isInReblockCooldown(recipientId: string, senderId: string): Promise<boolean> {
    const lastReblock = await prisma.premiumMessageRecipientAction.findFirst({
      where: { action: 'reblocked', message: { recipientId, senderId } },
      orderBy: { actionedAt: 'desc' },
      include: { message: true },
    });
    if (!lastReblock) return false;
    const cooldownEnd = new Date(lastReblock.actionedAt.getTime() + REBLOCK_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    return new Date() < cooldownEnd;
  }

  async check(senderId: string, recipientId: string): Promise<{
    canSend: boolean;
    reason?: string;
    remainingGrants: number;
    remainingDays: number;
    characterLimit: number;
  }> {
    if (!(await this.isPremium(senderId))) {
      return { canSend: false, reason: 'Premium required', remainingGrants: 0, remainingDays: 0, characterLimit: BASE_CHAR_LIMIT };
    }
    if (!(await this.isBlocked(senderId, recipientId))) {
      return { canSend: false, reason: 'User has not blocked you', remainingGrants: 0, remainingDays: 0, characterLimit: BASE_CHAR_LIMIT };
    }
    if (await this.isInReblockCooldown(recipientId, senderId)) {
      return { canSend: false, reason: 'Recipient re-blocked; cooldown active', remainingGrants: 0, remainingDays: 0, characterLimit: BASE_CHAR_LIMIT };
    }

    const now = new Date();
    const periodStart = getPeriodStart(now);
    const periodEnd = getPeriodEnd(periodStart);
    const activeGrants = await this.getActiveGrantsInPeriod(senderId, periodStart, periodEnd);

    const existingGrant = activeGrants.find((g) => g.recipientAccountId === recipientId);
    let remainingDays = 0;
    if (existingGrant) {
      const windowEnd = new Date(existingGrant.grantedAt.getTime() + MESSAGING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      if (now >= windowEnd) {
        return { canSend: false, reason: 'Messaging window expired for this user', remainingGrants: activeGrants.length, remainingDays: 0, characterLimit: BASE_CHAR_LIMIT };
      }
      remainingDays = Math.max(0, daysBetween(now, windowEnd));
    }

    const remainingGrants = Math.max(0, MAX_GRANTS_PER_PERIOD - activeGrants.length);
    if (remainingGrants === 0 && !existingGrant) {
      return { canSend: false, reason: 'No grants left this period', remainingGrants: 0, remainingDays: 0, characterLimit: BASE_CHAR_LIMIT };
    }

    if (existingGrant) {
      return { canSend: true, remainingGrants: activeGrants.length, remainingDays, characterLimit: BASE_CHAR_LIMIT };
    }
    return { canSend: true, remainingGrants, remainingDays: MESSAGING_WINDOW_DAYS, characterLimit: BASE_CHAR_LIMIT };
  }

  async send(senderId: string, recipientId: string, content: string, paidExtension = false): Promise<{ messageId: string; status: string; expiresAt: Date }> {
    const check = await this.check(senderId, recipientId);
    if (!check.canSend) throw new AppError(check.reason ?? 'Cannot send', 403);

    const contentTrimmed = content.trim().slice(0, paidExtension ? BASE_CHAR_LIMIT + EXTENSION_CHAR_LIMIT : BASE_CHAR_LIMIT);
    if (contentTrimmed.length === 0) throw new AppError('Content required', 400);

    const now = new Date();
    const periodStart = getPeriodStart(now);
    const periodEnd = getPeriodEnd(periodStart);
    const activeGrants = await this.getActiveGrantsInPeriod(senderId, periodStart, periodEnd);
    const existingGrant = activeGrants.find((g) => g.recipientAccountId === recipientId);

    let grantId: string;
    let grantExpiresAt: Date;
    if (existingGrant) {
      grantId = existingGrant.id;
      grantExpiresAt = existingGrant.expiresAt;
    } else {
      if (activeGrants.length >= MAX_GRANTS_PER_PERIOD) throw new AppError('No grants left this period', 403);
      const newGrant = await prisma.premiumMessageGrant.create({
        data: {
          senderAccountId: senderId,
          recipientAccountId: recipientId,
          grantedAt: now,
          expiresAt: periodEnd,
          remainingDays: MESSAGING_WINDOW_DAYS,
          status: 'active',
        },
      });
      grantId = newGrant.id;
      grantExpiresAt = newGrant.expiresAt;
    }

    const message = await prisma.premiumBlockedMessage.create({
      data: {
        grantId,
        senderId,
        recipientId,
        content: contentTrimmed,
        characterCount: contentTrimmed.length,
        paidExtension,
        dailyMessageCount: 1,
      },
    });

    return { messageId: message.id, status: 'sent', expiresAt: grantExpiresAt };
  }

  async recordAction(messageId: string, recipientId: string, action: string, reportReason?: string, reportDetails?: string): Promise<{ success: boolean; cooldownUntil?: Date }> {
    const message = await prisma.premiumBlockedMessage.findFirst({
      where: { id: messageId, recipientId },
    });
    if (!message) throw new AppError('Message not found', 404);

    await prisma.premiumMessageRecipientAction.create({
      data: { messageId, action, reportReason, reportDetails },
    });

    let cooldownUntil: Date | undefined;
    if (action === 'reblocked') {
      cooldownUntil = new Date(Date.now() + REBLOCK_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    }

    return { success: true, cooldownUntil };
  }

  async getGrants(senderId: string): Promise<{
    grants: Array<{
      recipientId: string;
      recipientName: string;
      usedDays: number;
      remainingDays: number;
      messages: Array<{ id: string; preview: string; sentAt: Date; status: string }>;
    }>;
  }> {
    const now = new Date();
    const periodStart = getPeriodStart(now);
    const periodEnd = getPeriodEnd(periodStart);
    const activeGrants = await prisma.premiumMessageGrant.findMany({
      where: { senderAccountId: senderId, status: 'active', grantedAt: { gte: periodStart, lt: periodEnd } },
      include: {
        recipientAccount: { select: { id: true, username: true, displayName: true } },
        messages: { orderBy: { sentAt: 'desc' }, include: { actions: { orderBy: { actionedAt: 'desc' }, take: 1 } } },
      },
    });

    const grants = activeGrants.map((g) => {
      const windowEnd = new Date(g.grantedAt.getTime() + MESSAGING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const usedDays = daysBetween(g.grantedAt, now);
      const remainingDays = Math.max(0, daysBetween(now, windowEnd));
      const messages = g.messages.map((m) => {
        const lastAction = m.actions[0];
        const status = lastAction ? lastAction.action : 'sent';
        return { id: m.id, preview: m.content.slice(0, 80), sentAt: m.sentAt, status };
      });
      return {
        recipientId: g.recipientAccountId,
        recipientName: g.recipientAccount.displayName || g.recipientAccount.username,
        usedDays,
        remainingDays,
        messages,
      };
    });

    return { grants };
  }
}
