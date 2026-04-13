import {
  listHiddenWordModerationLogs,
  HIDDEN_WORD_MODERATION_TYPES,
} from '../activity.service';

jest.mock('../../server', () => ({
  prisma: {
    accountActivityLog: {
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'log1' }),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('activity.service hidden-word moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty when type filter has no allowed values', async () => {
    const out = await listHiddenWordModerationLogs('acc1', { types: ['not_a_real_type'] });
    expect(out).toEqual({ items: [], nextCursor: null });
    expect(mockPrisma.accountActivityLog.findMany).not.toHaveBeenCalled();
  });

  it('paginates with nextCursor when more than limit', async () => {
    const createdAt = new Date('2026-01-01');
    mockPrisma.accountActivityLog.findMany.mockResolvedValue(
      Array.from({ length: 4 }, (_, i) => ({
        id: `id-${i}`,
        type: HIDDEN_WORD_MODERATION_TYPES[0],
        title: 't',
        description: 'd',
        createdAt,
        metadata: {},
      })),
    );
    const out = await listHiddenWordModerationLogs('acc1', { limit: 3 });
    expect(out.items).toHaveLength(3);
    expect(out.nextCursor).toBe('id-2');
    expect(mockPrisma.accountActivityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          accountId: 'acc1',
          type: { in: [...HIDDEN_WORD_MODERATION_TYPES] },
        }),
        take: 4,
      }),
    );
  });

  it('respects type subset filter', async () => {
    mockPrisma.accountActivityLog.findMany.mockResolvedValue([]);
    await listHiddenWordModerationLogs('acc1', {
      types: ['hidden_word_filter_dm', 'hidden_word_filter_comment'],
    });
    expect(mockPrisma.accountActivityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['hidden_word_filter_dm', 'hidden_word_filter_comment'] },
        }),
      }),
    );
  });

  it('allows limit_interaction types in filter', async () => {
    mockPrisma.accountActivityLog.findMany.mockResolvedValue([]);
    await listHiddenWordModerationLogs('acc1', { types: ['limit_interaction_dm', 'limit_interaction_comment'] });
    expect(mockPrisma.accountActivityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['limit_interaction_dm', 'limit_interaction_comment'] },
        }),
      }),
    );
  });
});
