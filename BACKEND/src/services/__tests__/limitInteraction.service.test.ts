import { LimitInteractionService } from '../limitInteraction.service';

jest.mock('../../server', () => ({
  prisma: {
    limitInteractionSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('LimitInteractionService.save', () => {
  const accountId = 'acc1';
  const service = new LimitInteractionService();
  const future = new Date(Date.now() + 60 * 60 * 1000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.limitInteractionSetting.upsert.mockImplementation(async ({ create, update }: { create: object; update: object }) => {
      const merged = { accountId, ...create, ...update };
      mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue(merged);
      return merged;
    });
  });

  it('partial PATCH commentsFrom keeps expiresAt when active is omitted', async () => {
    mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue({
      accountId,
      commentsFrom: 'everyone',
      dmsFrom: 'who:0,1,1',
      duration: '7d',
      expiresAt: future,
    });
    await service.save(accountId, { commentsFrom: 'most' });
    const upsertArg = mockPrisma.limitInteractionSetting.upsert.mock.calls[0][0];
    expect(upsertArg.update.expiresAt).toEqual(future);
    expect(upsertArg.update.commentsFrom).toBe('most');
  });

  it('active false clears expiresAt', async () => {
    mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue({
      accountId,
      commentsFrom: 'most',
      dmsFrom: 'who:0,1,1',
      duration: '7d',
      expiresAt: future,
    });
    await service.save(accountId, { active: false });
    const upsertArg = mockPrisma.limitInteractionSetting.upsert.mock.calls[0][0];
    expect(upsertArg.update.expiresAt).toBeNull();
  });
});
