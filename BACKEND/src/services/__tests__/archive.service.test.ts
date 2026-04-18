import { ArchiveService } from '../archive.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
    },
    story: {
      findMany: jest.fn(),
    },
    archivedStory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ArchiveService', () => {
  const service = new ArchiveService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runArchiveJob archives only missing expired stories', async () => {
    mockPrisma.account.findMany.mockResolvedValue([{ id: 'a1' }]);
    mockPrisma.story.findMany.mockResolvedValue([
      {
        id: 's1',
        accountId: 'a1',
        media: 'image1.jpg',
        type: 'IMAGE',
        stickers: null,
        textOverlay: null,
        allowReplies: true,
        allowReshares: true,
      },
      {
        id: 's2',
        accountId: 'a1',
        media: 'image2.jpg',
        type: 'IMAGE',
        stickers: null,
        textOverlay: null,
        allowReplies: true,
        allowReshares: true,
      },
    ]);
    mockPrisma.archivedStory.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'already-archived' });

    const result = await service.runArchiveJob();
    expect(result).toEqual({ archived: 1 });
    expect(mockPrisma.archivedStory.create).toHaveBeenCalledTimes(1);
  });

  it('getArchive normalizes media URLs', async () => {
    mockPrisma.archivedStory.findMany.mockResolvedValue([
      { id: 'x1', media: 'photo.jpg', archivedAt: new Date() },
      { id: 'x2', media: '/uploads/already.jpg', archivedAt: new Date() },
    ]);

    const result = await service.getArchive('a1');
    expect(result.items[0].media).toBe('/uploads/photo.jpg');
    expect(result.items[1].media).toBe('/uploads/already.jpg');
  });
});
