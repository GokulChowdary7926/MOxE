import { AppError } from '../../utils/AppError';

const mockGetStripe = jest.fn();

jest.mock('../../utils/stripeClient', () => ({
  getStripe: () => mockGetStripe(),
}));

const {
  localLedgerPurchaseId,
  createBadgePaymentIntent,
  createGiftPaymentIntent,
  assertBadgePaymentIntent,
  assertGiftPaymentIntent,
} = require('../live-purchase.service');

describe('live-purchase.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStripe.mockReturnValue(null);
  });

  it('localLedgerPurchaseId returns namespaced ids', () => {
    expect(localLedgerPurchaseId('badge')).toMatch(/^local_badge_/);
    expect(localLedgerPurchaseId('gift')).toMatch(/^local_gift_/);
  });

  it('createBadgePaymentIntent throws when stripe is not configured', async () => {
    await expect(
      createBadgePaymentIntent({ buyerId: 'b1', liveId: 'l1', tier: 'gold', amount: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('createGiftPaymentIntent throws when stripe is not configured', async () => {
    await expect(
      createGiftPaymentIntent({ giverId: 'g1', liveId: 'l1', giftType: 'rose', amount: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('assertBadgePaymentIntent throws when stripe is not configured', async () => {
    await expect(
      assertBadgePaymentIntent({ paymentIntentId: 'pi', buyerId: 'b1', liveId: 'l1', tier: 'gold', amount: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('assertGiftPaymentIntent throws when stripe is not configured', async () => {
    await expect(
      assertGiftPaymentIntent({ paymentIntentId: 'pi', giverId: 'g1', liveId: 'l1', giftType: 'rose', amount: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
