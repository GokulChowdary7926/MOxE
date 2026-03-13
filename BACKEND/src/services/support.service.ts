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
    const category = (data.category && ['general', 'seller', 'billing'].includes(data.category)) ? data.category : 'general';
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
