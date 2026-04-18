import { FraudService } from '../fraud.service';

jest.mock('../../server', () => ({
  prisma: {
    adFraudSignal: {
      create: jest.fn(),
      count: jest.fn(),
    },
    adFraudBlock: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('FraudService', () => {
  const service = new FraudService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordAdEventSignal stores base fraud signal', async () => {
    mockPrisma.adFraudSignal.count.mockResolvedValue(0);
    await service.recordAdEventSignal({
      campaignId: 'c1',
      advertiserAccountId: 'a1',
      viewerAccountId: 'v1',
      eventType: 'IMPRESSION',
    });
    expect(mockPrisma.adFraudSignal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'IMPRESSION', score: 1 }),
      }),
    );
  });

  it('recordAdEventSignal creates block on abusive click threshold', async () => {
    mockPrisma.adFraudSignal.count
      .mockResolvedValueOnce(11) // viewer clicks
      .mockResolvedValueOnce(0); // ip clicks

    await service.recordAdEventSignal({
      campaignId: 'c1',
      advertiserAccountId: 'a1',
      viewerAccountId: 'v1',
      ip: '1.1.1.1',
      eventType: 'CLICK',
    });
    expect(mockPrisma.adFraudBlock.upsert).toHaveBeenCalled();
  });

  it('isCampaignBlocked returns true when active block exists', async () => {
    mockPrisma.adFraudBlock.findFirst.mockResolvedValue({ id: 'b1' });
    const blocked = await service.isCampaignBlocked('c1', 'a1');
    expect(blocked).toBe(true);
  });
});
