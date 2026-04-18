import { AppError } from '../../utils/AppError';

const mockRecordEvent = jest.fn();

jest.mock('../analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    recordEvent: mockRecordEvent,
  })),
}));

jest.mock('../proximity.service', () => ({
  ProximityService: jest.fn().mockImplementation(() => ({
    checkAndTrigger: jest.fn(),
  })),
}));

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    nearbyPostCharge: {
      count: jest.fn(),
    },
    analyticsEvent: {
      count: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');
const {
  LocationService,
  NEARBY_PHOTO_POSTS_FREE_PER_DAY,
  NEARBY_TEXT_MESSAGES_FREE_PER_DAY,
} = require('../location.service');

describe('LocationService nearby messaging limits', () => {
  const service = new LocationService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordEvent.mockResolvedValue(undefined);
  });

  it('recordNearbyMessaging(text) increments text count when within free limit', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      nearbyPostCountToday: 0,
      nearbyTextMessageCountToday: 2,
      nearbyPostResetAt: new Date(),
    });

    const result = await service.recordNearbyMessaging('a1', 'text');
    expect(result.ok).toBe(true);
    expect(result.textUsed).toBe(3);
    expect(mockPrisma.account.update).toHaveBeenCalled();
    expect(mockRecordEvent).toHaveBeenCalledWith('a1', 'nearby_message_sent', {
      kind: 'text',
      channel: 'nearby',
    });
  });

  it('recordNearbyMessaging(text) throws 429 when free text limit exceeded', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      nearbyPostCountToday: 0,
      nearbyTextMessageCountToday: NEARBY_TEXT_MESSAGES_FREE_PER_DAY,
      nearbyPostResetAt: new Date(),
    });

    await expect(service.recordNearbyMessaging('a1', 'text')).rejects.toBeInstanceOf(AppError);
  });

  it('recordNearbyMessaging(media) throws 429 when free media limit exceeded', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      nearbyPostCountToday: NEARBY_PHOTO_POSTS_FREE_PER_DAY,
      nearbyTextMessageCountToday: 0,
      nearbyPostResetAt: new Date(),
    });

    await expect(service.recordNearbyMessaging('a1', 'media')).rejects.toBeInstanceOf(AppError);
  });

  it('getNearbyPostUsage returns reset counts when resetAt is before midnight', async () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    mockPrisma.account.findUnique.mockResolvedValue({
      nearbyPostCountToday: 4,
      nearbyTextMessageCountToday: 9,
      nearbyPostResetAt: yesterday,
    });
    mockPrisma.nearbyPostCharge.count.mockResolvedValue(2);

    const usage = await service.getNearbyPostUsage('a1');
    expect(usage.textUsedToday).toBe(0);
    expect(usage.mediaUsedToday).toBe(0);
    expect(usage.textRemaining).toBe(NEARBY_TEXT_MESSAGES_FREE_PER_DAY);
    expect(usage.mediaRemaining).toBe(NEARBY_PHOTO_POSTS_FREE_PER_DAY);
    expect(usage.chargesThisMonth).toBe(1);
  });
});
