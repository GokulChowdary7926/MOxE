import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export class SupportService {
  async createTicket(accountId: string, data: { subject: string; message: string; category?: string }) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionTier: true },
    });
    if (!account) throw new AppError('Account not found', 404);
    const isPriority = account.subscriptionTier === 'STAR';
    const allowed = new Set([
      'general',
      'seller',
      'billing',
      'memorialization',
      'legal_counter_notice',
      'legal_le_inquiry',
      'claim_profile',
      'data_transfer',
    ]);
    const category = data.category && allowed.has(data.category) ? data.category : 'general';
    return prisma.supportTicket.create({
      data: {
        accountId,
        subject: (data.subject || 'Support request').slice(0, 200),
        message: (data.message || '').slice(0, 5000),
        category,
        isPriority,
      },
    });
  }

  async listMyTickets(accountId: string) {
    return prisma.supportTicket.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** For support agents: list all tickets with priority (Star tier) first. */
  async listQueue(_accountId: string) {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: [{ isPriority: 'desc' }, { createdAt: 'desc' }],
    });
    if (tickets.length === 0) return [];
    const accountIds = [...new Set(tickets.map((t) => t.accountId))];
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, username: true, displayName: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    return tickets.map((t) => ({
      ...t,
      account: accountMap.get(t.accountId) ?? null,
    }));
  }

  async getTicketById(accountId: string, ticketId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, accountId },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) return null;
    return ticket;
  }

  async addReply(accountId: string, ticketId: string, message: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, accountId },
    });
    if (!ticket) throw new AppError('Ticket not found', 404);
    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId,
        accountId,
        message: (message || '').slice(0, 5000),
        isStaff: false,
      },
    });
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
    return reply;
  }
}
