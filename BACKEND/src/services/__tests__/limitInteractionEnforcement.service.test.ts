import {
  parseLimitWhoFlags,
  shouldLimitIncomingInteraction,
} from '../limitInteractionEnforcement.service';

jest.mock('../../server', () => ({
  prisma: {
    limitInteractionSetting: { findUnique: jest.fn() },
    closeFriend: { findUnique: jest.fn() },
    follow: { findUnique: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('limitInteractionEnforcement.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parseLimitWhoFlags reads who: triplet', () => {
    expect(parseLimitWhoFlags('who:1,0,1')).toEqual({
      everyoneButClose: true,
      recentFollowers: false,
      accountsDontFollow: true,
    });
  });

  it('returns false when limit is inactive', async () => {
    mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue(null);
    const hit = await shouldLimitIncomingInteraction('owner', 'actor', 'comment');
    expect(hit).toBe(false);
  });

  it('returns false for story_reply when setting is some only', async () => {
    const future = new Date(Date.now() + 3600_000);
    mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue({
      commentsFrom: 'some',
      dmsFrom: 'who:0,1,1',
      expiresAt: future,
    });
    expect(await shouldLimitIncomingInteraction('owner', 'actor', 'story_reply')).toBe(false);
  });

  it('returns true for comment when active, some, and who matches', async () => {
    const future = new Date(Date.now() + 3600_000);
    mockPrisma.limitInteractionSetting.findUnique.mockResolvedValue({
      commentsFrom: 'some',
      dmsFrom: 'who:0,0,1',
      expiresAt: future,
    });
    mockPrisma.closeFriend.findUnique.mockResolvedValue(null);
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    const hit = await shouldLimitIncomingInteraction('owner', 'actor', 'comment');
    expect(hit).toBe(true);
  });
});
