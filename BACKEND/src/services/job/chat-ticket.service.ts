import { prisma } from '../../server';

export type CreateTicketInput = {
  messageId?: string;
  peerId: string;
  subject: string;
  description?: string;
  priority?: string;
};

export class ChatTicketService {
  async listTickets(
    accountId: string,
    opts: { status?: string; assignedToMe?: boolean } = {}
  ) {
    const where: any = { accountId };
    if (opts.status) where.status = opts.status;
    if (opts.assignedToMe === true) where.assignedToAccountId = accountId;

    const tickets = await prisma.chatTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        peer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        assignedTo: { select: { id: true, username: true, displayName: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
    });
    return tickets;
  }

  async getTicket(accountId: string, ticketId: string) {
    const ticket = await prisma.chatTicket.findFirst({
      where: { id: ticketId, accountId },
      include: {
        peer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        assignedTo: { select: { id: true, username: true, displayName: true } },
        message: { select: { id: true, content: true, createdAt: true, senderId: true } },
      },
    });
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  async createTicket(accountId: string, input: CreateTicketInput) {
    const { messageId, peerId, subject, description, priority } = input;
    if (!peerId || !subject.trim()) throw new Error('peerId and subject are required');

    const ticket = await prisma.chatTicket.create({
      data: {
        accountId,
        messageId: messageId || null,
        peerId,
        subject: subject.trim().slice(0, 500),
        description: description?.trim() || null,
        priority: priority === 'LOW' || priority === 'HIGH' ? priority : 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        peer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        assignedTo: { select: { id: true, username: true, displayName: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
    });
    return ticket;
  }

  async updateTicket(
    accountId: string,
    ticketId: string,
    updates: { status?: string; priority?: string; assignedToAccountId?: string | null }
  ) {
    const ticket = await prisma.chatTicket.findFirst({
      where: { id: ticketId, accountId },
    });
    if (!ticket) throw new Error('Ticket not found');

    const data: any = {};
    if (updates.status !== undefined) {
      data.status = updates.status;
      if (updates.status === 'RESOLVED' || updates.status === 'CLOSED') {
        data.resolvedAt = new Date();
      }
    }
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.assignedToAccountId !== undefined) data.assignedToAccountId = updates.assignedToAccountId || null;

    const updated = await prisma.chatTicket.update({
      where: { id: ticketId },
      data,
      include: {
        peer: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
        assignedTo: { select: { id: true, username: true, displayName: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
    });
    return updated;
  }

  async assignTicket(accountId: string, ticketId: string, assignToAccountId: string | null) {
    return this.updateTicket(accountId, ticketId, { assignedToAccountId: assignToAccountId });
  }

  async setStatus(accountId: string, ticketId: string, status: string) {
    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!allowed.includes(status)) throw new Error('Invalid status');
    return this.updateTicket(accountId, ticketId, { status });
  }
}
