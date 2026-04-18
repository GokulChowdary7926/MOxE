import { AppError } from '../../utils/AppError';
import { CreatorToolsService } from '../creatorTools.service';

jest.mock('../../server', () => ({
  prisma: {
    messageTemplate: { findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    autoResponseRule: { findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    account: { findUnique: jest.fn() },
    trendingAudio: { findMany: jest.fn() },
    creatorConnection: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    brandCampaign: { findMany: jest.fn(), findUnique: jest.fn() },
    brandCampaignApplication: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    reelBonus: { findMany: jest.fn() },
    post: { findMany: jest.fn() },
    reel: { findMany: jest.fn() },
    draft: { findMany: jest.fn() },
    analyticsEvent: { findMany: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('CreatorToolsService', () => {
  const service = new CreatorToolsService();

  beforeEach(() => jest.clearAllMocks());

  it('updateMessageTemplate throws when template missing', async () => {
    mockPrisma.messageTemplate.findFirst.mockResolvedValue(null);
    await expect(service.updateMessageTemplate('a1', 't1', { body: 'x' })).rejects.toBeInstanceOf(AppError);
  });

  it('sendCreatorConnectionRequest rejects self connect', async () => {
    await expect(service.sendCreatorConnectionRequest('a1', 'a1')).rejects.toBeInstanceOf(AppError);
  });

  it('applyToBrandCampaign rejects closed campaign', async () => {
    mockPrisma.brandCampaign.findUnique.mockResolvedValue({ id: 'c1', status: 'CLOSED' });
    await expect(service.applyToBrandCampaign('a1', 'c1')).rejects.toBeInstanceOf(AppError);
  });
});
