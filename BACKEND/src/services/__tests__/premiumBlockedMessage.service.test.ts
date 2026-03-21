/**
 * PremiumBlockedMessageService tests – run check/send/action 10+ times.
 */
import { PremiumBlockedMessageService } from '../premiumBlockedMessage.service';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn().mockResolvedValue({ subscriptionTier: 'STAR' }) },
    block: {
      findUnique: jest.fn().mockResolvedValue({ id: 'b1' }),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    premiumMessageRecipientAction: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    lifestyleStrike: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}) },
    premiumMessageGrant: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'g1', expiresAt: new Date() }),
    },
    premiumBlockedMessage: {
      create: jest.fn().mockResolvedValue({ id: 'm1' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'm1', recipientId: 'rec1', senderId: 'send1' }),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('PremiumBlockedMessageService', () => {
  const service = new PremiumBlockedMessageService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({ subscriptionTier: 'STAR' });
    mockPrisma.block.findUnique.mockResolvedValue({ id: 'b1' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.premiumMessageGrant.findMany.mockResolvedValue([]);
    mockPrisma.premiumBlockedMessage.findFirst.mockResolvedValue({ id: 'm1', recipientId: 'rec1', senderId: 'send1' });
    mockPrisma.lifestyleStrike.count.mockResolvedValue(0);
  });

  describe('check', () => {
    it('returns canSend and characterLimit when premium and blocked (run 12 times)', async () => {
      for (let i = 0; i < RUNS; i++) {
        const result = await service.check('sender1', 'recipient1');
        expect(result).toHaveProperty('canSend');
        expect(result).toHaveProperty('characterLimit');
        expect(result.characterLimit).toBe(150);
      }
    });

    it('returns canSend false when not premium (run 10 times)', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({ subscriptionTier: 'FREE' });
      for (let i = 0; i < 10; i++) {
        const result = await service.check('sender1', 'recipient1');
        expect(result.canSend).toBe(false);
        expect(result.reason).toContain('Premium');
      }
    });

    it('returns canSend false when not blocked (run 10 times)', async () => {
      mockPrisma.block.findUnique.mockResolvedValue(null);
      for (let i = 0; i < 10; i++) {
        const result = await service.check('sender1', 'recipient1');
        expect(result.canSend).toBe(false);
      }
    });
  });

  describe('recordAction', () => {
    it('returns success and cooldownUntil for reblocked (run 10 times)', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await service.recordAction('m1', 'rec1', 'reblocked');
        expect(result.success).toBe(true);
        expect(result.cooldownUntil).toBeDefined();
      }
    });
  });
});
