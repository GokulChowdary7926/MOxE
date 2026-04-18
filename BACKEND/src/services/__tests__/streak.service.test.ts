import { StreakService } from '../streak.service';

jest.mock('../../server', () => ({
  prisma: {
    streak: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('StreakService', () => {
  const service = new StreakService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkIn creates a new streak when none exists', async () => {
    mockPrisma.streak.findUnique.mockResolvedValue(null);
    const result = await service.checkIn('a1', 'gym');
    expect(result).toEqual({ currentCount: 1, longestCount: 1 });
    expect(mockPrisma.streak.create).toHaveBeenCalled();
  });

  it('checkIn is idempotent for same-day check-in', async () => {
    mockPrisma.streak.findUnique.mockResolvedValue({
      currentCount: 4,
      longestCount: 7,
      lastCheckIn: new Date(),
    });
    const result = await service.checkIn('a1', 'gym');
    expect(result).toEqual({ currentCount: 4, longestCount: 7 });
    expect(mockPrisma.streak.upsert).not.toHaveBeenCalled();
  });

  it('checkIn increments streak on next day', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockPrisma.streak.findUnique.mockResolvedValue({
      currentCount: 2,
      longestCount: 3,
      lastCheckIn: yesterday,
    });
    const result = await service.checkIn('a1', 'reading');
    expect(result).toEqual({ currentCount: 3, longestCount: 3 });
    expect(mockPrisma.streak.upsert).toHaveBeenCalled();
  });

  it('list maps lastCheckIn as ISO string', async () => {
    const now = new Date();
    mockPrisma.streak.findMany.mockResolvedValue([
      { type: 'GYM', currentCount: 5, longestCount: 9, lastCheckIn: now },
    ]);
    const result = await service.list('a1');
    expect(result[0].lastCheckIn).toBe(now.toISOString());
  });
});
