import { LiveService, normalizeLiveRecordingUrl } from '../live.service';
import { AppError } from '../../utils/AppError';

jest.mock('../live-purchase.service', () => ({
  isLiveStripePurchasesEnabled: jest.fn(() => false),
  localLedgerPurchaseId: jest.fn(() => 'local_badge_1'),
  assertBadgePaymentIntent: jest.fn(),
  assertGiftPaymentIntent: jest.fn(),
  createBadgePaymentIntent: jest.fn(),
  createGiftPaymentIntent: jest.fn(),
}));

jest.mock('../../server', () => ({
  prisma: {
    live: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    follow: { findUnique: jest.fn().mockResolvedValue(null) },
    closeFriend: { findUnique: jest.fn().mockResolvedValue(null) },
    block: { findUnique: jest.fn().mockResolvedValue(null) },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('LiveService visibility', () => {
  const service = new LiveService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.closeFriend.findUnique.mockResolvedValue(null);
    mockPrisma.block.findUnique.mockResolvedValue(null);
  });

  it('denies follower-only live for non-follower', async () => {
    mockPrisma.live.findUnique.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      privacy: 'FOLLOWERS_ONLY',
      account: { id: 'owner1' },
      liveProducts: [],
    });
    await expect(service.get('l1', 'viewer1')).rejects.toThrow(AppError);
  });

  it('allows follower-only live for follower', async () => {
    mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    mockPrisma.live.findUnique.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      privacy: 'FOLLOWERS_ONLY',
      account: { id: 'owner1' },
      liveProducts: [],
    });
    const live = await service.get('l1', 'viewer1');
    expect(live.id).toBe('l1');
  });

  it('normalizeLiveRecordingUrl accepts https and /uploads/', () => {
    expect(normalizeLiveRecordingUrl('https://cdn.example.com/v.mp4')).toContain('https://');
    expect(normalizeLiveRecordingUrl('/uploads/live/x.webm')).toMatch(/^\/uploads\//);
  });

  it('normalizeLiveRecordingUrl rejects garbage', () => {
    expect(() => normalizeLiveRecordingUrl('javascript:alert(1)')).toThrow(AppError);
    expect(() => normalizeLiveRecordingUrl('')).toThrow(AppError);
  });

  it('getReplay returns 404 when ended live has no recording', async () => {
    mockPrisma.live.findUnique.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      status: 'ENDED',
      deletedAt: null,
      recording: null,
      title: 'T',
      description: null,
      startedAt: null,
      endedAt: new Date(),
      privacy: 'PUBLIC',
      account: { id: 'owner1', username: 'o', displayName: 'O', profilePhoto: null },
      liveProducts: [],
    });
    await expect(service.getReplay('l1', 'owner1')).rejects.toThrow(AppError);
  });

  it('getReplay returns payload when recording exists', async () => {
    mockPrisma.live.findUnique.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      status: 'ENDED',
      deletedAt: null,
      recording: 'https://example.com/a.mp4',
      title: 'T',
      description: null,
      startedAt: null,
      endedAt: new Date(),
      privacy: 'PUBLIC',
      account: { id: 'owner1', username: 'o', displayName: 'O', profilePhoto: null },
      liveProducts: [],
    });
    const r = await service.getReplay('l1', 'viewer1');
    expect(r.recording).toContain('https://');
  });

  it('endLive passes recording into update when provided', async () => {
    mockPrisma.live.findUnique.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      status: 'LIVE',
      deletedAt: null,
    });
    mockPrisma.live.update.mockResolvedValue({
      id: 'l1',
      accountId: 'owner1',
      status: 'ENDED',
      recording: 'https://x.test/v.webm',
      account: { id: 'owner1', username: 'o', displayName: null, profilePhoto: null },
      liveProducts: [],
    });
    await service.endLive('owner1', 'l1', { recording: 'https://x.test/v.webm' });
    expect(mockPrisma.live.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ENDED',
          recording: 'https://x.test/v.webm',
        }),
      }),
    );
  });
});
