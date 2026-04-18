import { AppError } from '../../utils/AppError';
import { AdService } from '../ad.service';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    adCampaign: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    adCampaignInsight: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AdService', () => {
  const service = new AdService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createCampaign rejects non-business/creator accounts', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'a1', accountType: 'PERSONAL' });
    await expect(service.createCampaign('a1', { name: 'C1' })).rejects.toBeInstanceOf(AppError);
  });

  it('createCampaign validates destinationUrl', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'a1', accountType: 'BUSINESS' });
    await expect(
      service.createCampaign('a1', { name: 'C1', destinationUrl: 'not-a-url' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('getCampaign throws 404 when campaign missing', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'a1', accountType: 'BUSINESS' });
    mockPrisma.adCampaign.findFirst.mockResolvedValue(null);
    await expect(service.getCampaign('a1', 'c1')).rejects.toBeInstanceOf(AppError);
  });
});
