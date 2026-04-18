import { AppError } from '../../utils/AppError';
import { HighlightService } from '../highlight.service';

jest.mock('../../server', () => ({
  prisma: {
    highlight: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    archivedStory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    highlightItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    story: {
      findFirst: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('HighlightService', () => {
  const service = new HighlightService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list returns normalized cover/image media', async () => {
    mockPrisma.highlight.findMany.mockResolvedValue([
      {
        id: 'h1',
        coverImage: 'cover.jpg',
        items: [
          { story: { id: 's1', media: 'story.jpg', type: 'IMAGE' }, archivedStory: null },
        ],
      },
    ]);

    const result = await service.list('a1');
    expect(result[0].coverImage).toBe('/uploads/cover.jpg');
    expect(result[0].items[0].story?.media).toBe('/uploads/story.jpg');
  });

  it('getById throws 404 when highlight missing', async () => {
    mockPrisma.highlight.findFirst.mockResolvedValue(null);
    await expect(service.getById('a1', 'missing')).rejects.toBeInstanceOf(AppError);
  });

  it('create makes highlight and items from archived stories', async () => {
    mockPrisma.highlight.count.mockResolvedValue(0);
    mockPrisma.archivedStory.findMany.mockResolvedValue([
      { id: 'ar1', media: 'ar1.jpg' },
      { id: 'ar2', media: 'ar2.jpg' },
    ]);
    mockPrisma.highlight.create.mockResolvedValue({ id: 'h1' });
    mockPrisma.highlight.findFirst.mockResolvedValue({
      id: 'h1',
      coverImage: 'ar1.jpg',
      items: [],
    });

    const result = await service.create('a1', { name: 'Trip', archivedStoryIds: ['ar1', 'ar2'] });
    expect(mockPrisma.highlight.create).toHaveBeenCalled();
    expect(mockPrisma.highlightItem.create).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('h1');
  });

  it('addItem rejects when no story id provided', async () => {
    mockPrisma.highlight.findFirst.mockResolvedValue({ id: 'h1' });
    await expect(service.addItem('a1', 'h1', {})).rejects.toBeInstanceOf(AppError);
  });

  it('removeItem throws 404 when item missing', async () => {
    mockPrisma.highlightItem.findFirst.mockResolvedValue(null);
    await expect(service.removeItem('a1', 'h1', 'i1')).rejects.toBeInstanceOf(AppError);
  });
});
