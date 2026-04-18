import { AppError } from '../../utils/AppError';
import { DraftService } from '../draft.service';

jest.mock('../../server', () => ({
  prisma: {
    draft: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('DraftService', () => {
  const service = new DraftService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list returns mapped drafts with ISO dates', async () => {
    const now = new Date();
    mockPrisma.draft.findMany.mockResolvedValue([
      { id: 'd1', type: 'POST', content: {}, media: null, expiresAt: now, createdAt: now, updatedAt: now },
    ]);
    const rows = await service.list('a1');
    expect(rows[0].id).toBe('d1');
    expect(rows[0].createdAt).toBe(now.toISOString());
  });

  it('get throws 404 when draft missing', async () => {
    mockPrisma.draft.findFirst.mockResolvedValue(null);
    await expect(service.get('a1', 'missing')).rejects.toBeInstanceOf(AppError);
  });

  it('delete removes owned draft', async () => {
    mockPrisma.draft.findFirst.mockResolvedValue({ id: 'd1' });
    mockPrisma.draft.delete.mockResolvedValue({});
    const out = await service.delete('a1', 'd1');
    expect(out).toEqual({ ok: true });
  });
});
