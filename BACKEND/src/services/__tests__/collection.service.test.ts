import { AppError } from '../../utils/AppError';
import { CollectionService } from '../collection.service';

jest.mock('../../server', () => ({
  prisma: {
    collection: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    savedPost: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('CollectionService', () => {
  const service = new CollectionService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list maps _count.savedPosts to savedCount', async () => {
    mockPrisma.collection.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Favs',
        coverImage: null,
        order: 0,
        createdAt: new Date(),
        _count: { savedPosts: 3 },
      },
    ]);
    const result = await service.list('a1');
    expect(result[0].savedCount).toBe(3);
  });

  it('create sets order based on max existing order', async () => {
    mockPrisma.collection.aggregate.mockResolvedValue({ _max: { order: 2 } });
    mockPrisma.collection.create.mockResolvedValue({ id: 'c1', order: 3 });
    const created = await service.create('a1', ' New ');
    expect(created.order).toBe(3);
  });

  it('update throws 404 when collection not found', async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);
    await expect(service.update('a1', 'missing', { name: 'X' })).rejects.toBeInstanceOf(AppError);
  });

  it('delete soft-deletes and unassigns saved posts', async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: 'c1' });
    await service.delete('a1', 'c1');
    expect(mockPrisma.savedPost.updateMany).toHaveBeenCalledWith({
      where: { collectionId: 'c1' },
      data: { collectionId: null },
    });
    expect(mockPrisma.collection.update).toHaveBeenCalled();
  });
});
