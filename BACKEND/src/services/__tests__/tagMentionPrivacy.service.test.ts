import { assertActorMayMention, canActorTag } from '../tagMentionPrivacy.service';
import { AppError } from '../../utils/AppError';

jest.mock('../limitInteractionEnforcement.service', () => ({
  assertNotLimitedIncomingInteraction: jest.fn().mockResolvedValue(undefined),
  shouldLimitIncomingInteraction: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    follow: { findUnique: jest.fn() },
  },
}));

const mockAssertNotLimited = require('../limitInteractionEnforcement.service')
  .assertNotLimitedIncomingInteraction as jest.Mock;
const mockShouldLimit = require('../limitInteractionEnforcement.service')
  .shouldLimitIncomingInteraction as jest.Mock;
const { prisma: mockPrisma } = require('../../server');

describe('tagMentionPrivacy.service limit interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssertNotLimited.mockResolvedValue(undefined);
    mockShouldLimit.mockResolvedValue(false);
  });

  it('assertActorMayMention rejects when limit interactions apply', async () => {
    mockAssertNotLimited.mockRejectedValueOnce(new AppError('limited', 403));
    await expect(assertActorMayMention('actor1', 'target1')).rejects.toThrow(AppError);
    expect(mockPrisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('canActorTag returns false when limit interactions apply', async () => {
    mockShouldLimit.mockResolvedValueOnce(true);
    const ok = await canActorTag('actor1', 'target1');
    expect(ok).toBe(false);
    expect(mockPrisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('canActorTag returns true when tags allow everyone and limit off', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ clientSettings: {} });
    const ok = await canActorTag('actor1', 'target1');
    expect(ok).toBe(true);
  });
});
