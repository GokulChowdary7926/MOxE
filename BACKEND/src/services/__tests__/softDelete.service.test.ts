import { AppError } from '../../utils/AppError';
import { listRecentlyDeleted, permanentDelete, restore, softDelete } from '../softDelete.service';

jest.mock('../../server', () => {
  const mk = () => ({
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
  });
  return {
    prisma: {
      post: mk(),
      reel: mk(),
      story: mk(),
      comment: mk(),
      note: mk(),
      highlight: mk(),
      collection: mk(),
      anonymousPost: mk(),
      live: mk(),
      message: mk(),
    },
  };
});

const { prisma: mockPrisma } = require('../../server');

describe('softDelete.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('softDelete rejects when ownership check fails', async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);
    await expect(softDelete('post', 'p1', 'a1')).rejects.toBeInstanceOf(AppError);
  });

  it('restore updates deleted fields for owned row', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ accountId: 'a1' });
    mockPrisma.post.update.mockResolvedValue({ id: 'p1' });
    const out = await restore('post', 'p1', 'a1');
    expect(out.id).toBe('p1');
  });

  it('permanentDelete deletes owned row', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ accountId: 'a1' });
    mockPrisma.post.delete.mockResolvedValue({ id: 'p1' });
    const out = await permanentDelete('post', 'p1', 'a1');
    expect(out.id).toBe('p1');
  });

  it('listRecentlyDeleted returns capped merged items payload', async () => {
    const res = await listRecentlyDeleted('a1', 20);
    expect(Array.isArray(res.items)).toBe(true);
  });
});
