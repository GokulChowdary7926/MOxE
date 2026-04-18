import { DataExportService } from '../dataExport.service';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    post: { findMany: jest.fn() },
    follow: { findMany: jest.fn() },
    like: { findMany: jest.fn() },
    savedPost: { findMany: jest.fn() },
    collection: { findMany: jest.fn() },
    comment: { findMany: jest.fn() },
    message: { findMany: jest.fn() },
    messageRecipient: { findMany: jest.fn() },
    notification: { findMany: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('DataExportService', () => {
  const service = new DataExportService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when account not found', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.exportAccountData('missing')).rejects.toThrow('Account not found');
  });

  it('builds export payload with mapped metadata', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 'a1',
      username: 'user1',
      displayName: 'User One',
      accountType: 'PERSONAL',
      subscriptionTier: 'FREE',
      bio: null,
      profilePhoto: null,
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
      user: { id: 'u1', phoneNumber: '123', email: 'u@x.com', dateOfBirth: null, createdAt: now },
    });
    mockPrisma.post.findMany.mockResolvedValue([{ id: 'p1', caption: 'hi', createdAt: now, media: [{ url: 'x' }] }]);
    mockPrisma.follow.findMany.mockResolvedValueOnce([{ id: 'f1', createdAt: now, following: { username: 'bob' } }]);
    mockPrisma.follow.findMany.mockResolvedValueOnce([{ id: 'f2', createdAt: now, follower: { username: 'alice' } }]);
    mockPrisma.like.findMany.mockResolvedValue([{ id: 'l1', postId: 'p1', commentId: null, reelId: null, createdAt: now }]);
    mockPrisma.savedPost.findMany.mockResolvedValue([{ postId: 'p1', collectionId: null, savedAt: now }]);
    mockPrisma.collection.findMany.mockResolvedValue([{ id: 'c1', name: 'fav', createdAt: now }]);
    mockPrisma.comment.findMany.mockResolvedValue([{ id: 'cm1', postId: 'p1', reelId: null, content: 'ok', createdAt: now }]);
    mockPrisma.message.findMany.mockResolvedValue([{ id: 'm1', messageType: 'TEXT', createdAt: now }]);
    mockPrisma.messageRecipient.findMany.mockResolvedValue([{ message: { id: 'm2', messageType: 'TEXT', createdAt: now } }]);
    mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1', type: 'LIKE', read: false, createdAt: now }]);

    const result = await service.exportAccountData('a1');
    expect(result.accountId).toBe('a1');
    expect(result.posts[0].mediaCount).toBe(1);
    expect(result.follows).toHaveLength(2);
    expect(result.messagesMetadata).toHaveLength(2);
    expect(result.notificationsMetadata[0].id).toBe('n1');
  });
});
