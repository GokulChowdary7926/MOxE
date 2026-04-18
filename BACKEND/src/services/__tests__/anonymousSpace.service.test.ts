import { AppError } from '../../utils/AppError';
import { AnonymousSpaceService } from '../anonymousSpace.service';

jest.mock('../../server', () => ({
  prisma: {
    anonymousSpace: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    anonymousPost: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    anonymousVote: {
      groupBy: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    report: { create: jest.fn() },
    anonymousComment: { findMany: jest.fn(), create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AnonymousSpaceService', () => {
  const service = new AnonymousSpaceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createPost rejects when space is missing', async () => {
    mockPrisma.anonymousSpace.findFirst.mockResolvedValue(null);
    await expect(service.createPost('a1', 's1', { content: 'hello' })).rejects.toBeInstanceOf(AppError);
  });

  it('createPost rejects empty content', async () => {
    mockPrisma.anonymousSpace.findFirst.mockResolvedValue({ id: 's1', isPublic: true });
    await expect(service.createPost('a1', 's1', { content: '   ' })).rejects.toBeInstanceOf(AppError);
  });

  it('removeVote returns score payload', async () => {
    mockPrisma.anonymousVote.aggregate.mockResolvedValue({ _sum: { direction: 2 } });
    const out = await service.removeVote('a1', 'p1');
    expect(out).toEqual({ score: 2, myVote: null });
  });
});
