import { PostService } from '../post.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    post: { create: jest.fn().mockResolvedValue({ id: 'p1' }), findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
    like: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(5) },
    comment: { create: jest.fn().mockResolvedValue({ id: 'c1' }), findMany: jest.fn().mockResolvedValue([]) },
    savedPost: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}) },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('PostService', () => {
  const service = new PostService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.like.count.mockResolvedValue(5);
  });

  it('create returns post (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.create('acc1', { caption: 'Test', media: [] });
      expect(result).toBeDefined();
    }
    expect(mockPrisma.post.create).toHaveBeenCalledTimes(RUNS);
  });

  it('like returns liked and likeCount (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.like('acc1', 'p1');
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(5);
    }
  });

  it('like throws 404 when post not found (run 10 times)', async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) {
      await expect(service.like('acc1', 'missing')).rejects.toThrow(AppError);
    }
  });

  it('unlike returns liked false (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.unlike('acc1', 'p1');
      expect(result.liked).toBe(false);
    }
  });

  it('comment creates when post exists (run 10 times)', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await service.comment('acc1', 'p1', 'Hello');
      expect(result).toBeDefined();
    }
  });

  it('getComments returns items and nextCursor (run 12 times)', async () => {
    mockPrisma.comment.findMany.mockResolvedValue([{ id: 'c1' }]);
    for (let i = 0; i < RUNS; i++) {
      const result = await service.getComments('p1');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('nextCursor');
    }
  });

  it('save returns saved true (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.save('acc1', 'p1');
      expect(result.saved).toBe(true);
    }
  });

  it('unsave returns saved false (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.unsave('acc1', 'p1');
      expect(result.saved).toBe(false);
    }
  });
});
