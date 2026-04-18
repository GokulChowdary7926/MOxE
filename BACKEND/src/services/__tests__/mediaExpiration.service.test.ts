import { MediaExpirationService } from '../mediaExpiration.service';

jest.mock('../../server', () => ({
  prisma: {
    mediaExpiration: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      updateMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('MediaExpirationService', () => {
  const service = new MediaExpirationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedule creates expiration record', async () => {
    mockPrisma.mediaExpiration.create.mockResolvedValue({ id: 'e1' });
    await service.schedule('m1', '/uploads/a.jpg', new Date());
    expect(mockPrisma.mediaExpiration.create).toHaveBeenCalled();
  });

  it('processDue returns 0 when no rows due', async () => {
    mockPrisma.mediaExpiration.findMany.mockResolvedValue([]);
    const count = await service.processDue(new Date(), 10);
    expect(count).toBe(0);
  });

  it('processDue updates message and deletes expiration row', async () => {
    mockPrisma.mediaExpiration.findMany.mockResolvedValue([
      { id: 'e1', messageId: 'm1', mediaKey: 'https://cdn.example.com/a.jpg' },
    ]);
    mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.mediaExpiration.delete.mockResolvedValue({});

    const count = await service.processDue(new Date(), 10);
    expect(count).toBe(1);
    expect(mockPrisma.message.updateMany).toHaveBeenCalled();
    expect(mockPrisma.mediaExpiration.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });
});
