/**
 * NotificationService tests – run each function 10+ times.
 */
import { NotificationService } from '../notification.service';

const mockNotifications = [
  { id: 'n1', recipientId: 'acc1', type: 'LIKE', content: 'liked', read: false, createdAt: new Date(), sender: null },
];

jest.mock('../../server', () => ({
  prisma: {
    notification: {
      findMany: jest.fn().mockResolvedValue([{ id: 'n1', recipientId: 'acc1', type: 'LIKE', content: 'liked', read: false, createdAt: new Date(), sender: null }]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({ id: 'n1' }),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('NotificationService', () => {
  const service = new NotificationService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1', recipientId: 'acc1', type: 'LIKE', content: 'liked', read: false, createdAt: new Date(), sender: null }]);
  });

  describe('list', () => {
    it('returns items and nextCursor for tab all (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        const result = await service.list('acc1', 'all');
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('nextCursor');
        expect(Array.isArray(result.items)).toBe(true);
      }
      expect(mockPrisma.notification.findMany).toHaveBeenCalledTimes(RUNS);
    });

    it('filters by mentions tab (run 10 times)', async () => {
      for (let i = 0; i < 10; i++) {
        await service.list('acc1', 'mentions');
        expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { recipientId: 'acc1', type: { in: ['MENTION', 'TAG'] } } })
        );
      }
    });
  });

  describe('markRead', () => {
    it('returns ok true (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        const result = await service.markRead('acc1', 'n1');
        expect(result).toEqual({ ok: true });
      }
    });
  });

  describe('markAllRead', () => {
    it('returns ok true (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        const result = await service.markAllRead('acc1');
        expect(result).toEqual({ ok: true });
      }
    });
  });

  describe('create', () => {
    it('creates notification (run 10 times)', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await service.create('acc1', 'LIKE', 'acc2', 'liked your post');
        expect(result).toBeDefined();
        expect(mockPrisma.notification.create).toHaveBeenCalled();
      }
    });
  });
});
