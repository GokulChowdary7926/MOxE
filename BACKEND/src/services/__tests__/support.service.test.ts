import { AppError } from '../../utils/AppError';
import { SupportService } from '../support.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    supportTicketReply: {
      create: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('SupportService', () => {
  const service = new SupportService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createTicket marks STAR accounts as priority', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ subscriptionTier: 'STAR' });
    mockPrisma.supportTicket.create.mockResolvedValue({ id: 't1', isPriority: true });
    const ticket = await service.createTicket('a1', { subject: 'Need help', message: 'Issue details' });
    expect(ticket.isPriority).toBe(true);
  });

  it('createTicket rejects unknown account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.createTicket('missing', { subject: 'x', message: 'y' })).rejects.toBeInstanceOf(AppError);
  });

  it('listQueue enriches tickets with account info', async () => {
    mockPrisma.supportTicket.findMany.mockResolvedValue([{ id: 't1', accountId: 'a1' }]);
    mockPrisma.account.findMany.mockResolvedValue([{ id: 'a1', username: 'bob', displayName: 'Bob' }]);
    const rows = await service.listQueue('agent1');
    expect(rows[0].account?.username).toBe('bob');
  });

  it('addReply throws when ticket does not belong to account', async () => {
    mockPrisma.supportTicket.findFirst.mockResolvedValue(null);
    await expect(service.addReply('a1', 't1', 'hello')).rejects.toBeInstanceOf(AppError);
  });
});
