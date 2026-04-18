import { AppError } from '../../utils/AppError';
import { ProximityService } from '../proximity.service';

const mockEmitNotification = jest.fn();

jest.mock('../../sockets', () => ({
  emitNotification: (...args: any[]) => mockEmitNotification(...args),
}));

jest.mock('../../server', () => ({
  prisma: {
    proximityAlert: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    locationHistory: {
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('ProximityService', () => {
  const service = new ProximityService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create rejects self target', async () => {
    await expect(service.create('a1', { targetAccountId: 'a1' })).rejects.toBeInstanceOf(AppError);
  });

  it('create rejects duplicate alert', async () => {
    mockPrisma.proximityAlert.findUnique.mockResolvedValue({ id: 'al1' });
    await expect(service.create('a1', { targetAccountId: 'a2' })).rejects.toBeInstanceOf(AppError);
  });

  it('delete rejects when alert missing', async () => {
    mockPrisma.proximityAlert.findFirst.mockResolvedValue(null);
    await expect(service.delete('a1', 'al1')).rejects.toBeInstanceOf(AppError);
  });

  it('checkAndTrigger emits notification when in range', async () => {
    const old = new Date(Date.now() - 1000 * 60 * 60);
    mockPrisma.proximityAlert.findMany.mockResolvedValue([
      { id: 'al1', accountId: 'owner1', targetAccountId: 'target1', radiusMeters: 500, cooldownMinutes: 30, lastTriggeredAt: old },
    ]);
    mockPrisma.locationHistory.findMany.mockResolvedValue([
      { accountId: 'owner1', latitude: 12.9716, longitude: 77.5946 },
    ]);
    mockPrisma.proximityAlert.update.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'n1',
      type: 'PROXIMITY',
      content: 'x',
      createdAt: new Date(),
      read: false,
      sender: null,
    });

    await service.checkAndTrigger('target1', 12.9720, 77.5950);
    expect(mockPrisma.notification.create).toHaveBeenCalled();
    expect(mockEmitNotification).toHaveBeenCalled();
  });
});
