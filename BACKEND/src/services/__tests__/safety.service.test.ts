import { AppError } from '../../utils/AppError';

const mockCreateNotification = jest.fn();

jest.mock('../notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    create: mockCreateNotification,
  })),
}));

jest.mock('../../server', () => ({
  prisma: {
    emergencyContact: {
      findMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    hangoutSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { SafetyService } from '../safety.service';

const { prisma: mockPrisma } = require('../../server');

describe('SafetyService', () => {
  const service = new SafetyService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({ displayName: 'Alice', username: 'alice' });
  });

  it('throws when no emergency contacts configured', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

    await expect(service.triggerSOS('acc1', {})).rejects.toBeInstanceOf(AppError);
    await expect(service.triggerSOS('acc1', {})).rejects.toMatchObject({ statusCode: 400 });
  });

  it('sends SOS notifications with quiet-mode bypass and location details', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([
      { contactId: 'c1', contact: { id: 'c1', displayName: 'Bob' } },
      { contactId: 'c2', contact: { id: 'c2', displayName: 'Carol' } },
    ]);
    mockCreateNotification.mockResolvedValue({ id: 'n1' });

    const result = await service.triggerSOS('acc1', { latitude: 12.34567, longitude: 77.12345 });

    expect(result).toMatchObject({
      ok: true,
      notifiedCount: 2,
      contacts: [
        { id: 'c1', displayName: 'Bob' },
        { id: 'c2', displayName: 'Carol' },
      ],
    });
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      'c1',
      'SOS_ALERT',
      'acc1',
      expect.stringContaining('Google Maps:'),
      expect.objectContaining({
        type: 'SOS_ALERT',
        latitude: 12.34567,
        longitude: 77.12345,
        mapsUrl: expect.stringContaining('google.com/maps/search'),
      }),
      { bypassQuietMode: true },
    );
  });

  it('counts only successful notifications when create fails/returns null', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([
      { contactId: 'c1', contact: { id: 'c1', displayName: 'Bob' } },
      { contactId: 'c2', contact: { id: 'c2', displayName: 'Carol' } },
      { contactId: 'c3', contact: { id: 'c3', displayName: 'Dan' } },
    ]);
    mockCreateNotification
      .mockResolvedValueOnce({ id: 'n1' })
      .mockRejectedValueOnce(new Error('send failed'))
      .mockResolvedValueOnce(null);

    const result = await service.triggerSOS('acc1', {});

    expect(result.ok).toBe(true);
    expect(result.notifiedCount).toBe(1);
    expect(mockCreateNotification).toHaveBeenCalledTimes(3);
  });
});
