import { PostService } from '../post.service';
import { AppError } from '../../utils/AppError';

jest.mock('../notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({ id: 'n1' }),
  })),
}));

jest.mock('../limitInteractionEnforcement.service', () => ({
  shouldLimitIncomingInteraction: jest.fn().mockResolvedValue(false),
}));
jest.mock('../activity.service', () => ({
  addAccountActivityLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../server', () => ({
  prisma: {
    post: {
      create: jest.fn().mockResolvedValue({ id: 'p1', accountId: 'acc1' }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'p1',
        accountId: 'acc1',
        privacy: 'PUBLIC',
        isDeleted: false,
        isArchived: false,
        isMature: false,
        isScheduled: false,
        scheduledFor: null,
        isSubscriberOnly: false,
        allowComments: true,
      }),
    },
    like: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(5) },
    comment: {
      create: jest.fn().mockResolvedValue({
        id: 'c1',
        content: 'Hello',
        createdAt: new Date(),
        isHidden: false,
        account: { id: 'acc1', username: 'u1', displayName: 'U1', profilePhoto: null },
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn(),
    },
    savedPost: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}) },
    restrict: { findUnique: jest.fn().mockResolvedValue(null) },
    account: {
      findUnique: jest.fn().mockResolvedValue({ user: { dateOfBirth: new Date('1990-01-01') } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    follow: { findUnique: jest.fn().mockResolvedValue({ id: 'f1' }) },
    closeFriend: { findUnique: jest.fn().mockResolvedValue(null) },
    block: { findUnique: jest.fn().mockResolvedValue(null) },
    product: { findMany: jest.fn().mockResolvedValue([]) },
    productTag: { createMany: jest.fn().mockResolvedValue({}) },
    mention: {
      createMany: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    subscription: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
    limitInteractionSetting: { findUnique: jest.fn().mockResolvedValue(null) },
  },
}));

const { prisma: mockPrisma } = require('../../server');
const mockShouldLimitPost = require('../limitInteractionEnforcement.service')
  .shouldLimitIncomingInteraction as jest.Mock;
const mockAddActivityLogPost = require('../activity.service').addAccountActivityLog as jest.Mock;

describe('PostService', () => {
  const service = new PostService();
  const RUNS = 12;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldLimitPost.mockResolvedValue(false);
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 'p1',
      accountId: 'acc1',
      privacy: 'PUBLIC',
      isDeleted: false,
      isArchived: false,
      isMature: false,
      isScheduled: false,
      scheduledFor: null,
      isSubscriberOnly: false,
      allowComments: true,
      account: { id: 'acc1', username: 'u1', displayName: 'U1', profilePhoto: null },
      ProductTag: [],
    });
    mockPrisma.post.create.mockResolvedValue({ id: 'p1', accountId: 'acc1' });
    mockPrisma.like.count.mockResolvedValue(5);
    mockPrisma.restrict.findUnique.mockResolvedValue(null);
    mockPrisma.account.findUnique.mockImplementation((args: any) => {
      if (args?.select?.hiddenWordsCommentFilter) {
        return Promise.resolve({ hiddenWordsCommentFilter: false, hiddenWords: [] });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    mockPrisma.block.findUnique.mockResolvedValue(null);
    mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    mockPrisma.closeFriend.findUnique.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findMany.mockResolvedValue([]);
  });

  it('create returns post (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.create('acc1', {
        caption: 'Test',
        media: [{ url: 'https://example.com/photo.jpg' }],
      });
      expect(result).toBeDefined();
    }
    expect(mockPrisma.post.create).toHaveBeenCalledTimes(RUNS);
  });

  it('like returns liked and likeCount (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.like('acc1', 'p1');
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(5);
    }
  });

  it('like throws 404 when post not found (run 10 times)', async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) {
      await expect(service.like('acc1', 'missing')).rejects.toThrow(AppError);
    }
  });

  it('unlike returns liked false (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.unlike('acc1', 'p1');
      expect(result.liked).toBe(false);
    }
  });

  it('comment creates when post exists (run 10 times)', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await service.comment('acc1', 'p1', 'Hello');
      expect(result).toBeDefined();
    }
  });

  it('getComments returns items and nextCursor (run 12 times)', async () => {
    mockPrisma.comment.findMany.mockResolvedValue([{ id: 'c1' }]);
    for (let i = 0; i < RUNS; i++) {
      const result = await service.getComments('p1');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('nextCursor');
    }
  });

  it('save returns saved true (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.save('acc1', 'p1');
      expect(result.saved).toBe(true);
    }
  });

  it('unsave returns saved false (run 12 times)', async () => {
    for (let i = 0; i < RUNS; i++) {
      const result = await service.unsave('acc1', 'p1');
      expect(result.saved).toBe(false);
    }
  });

  it('create throws 400 when media is empty', async () => {
    await expect(
      service.create('acc1', {
        caption: 'No media',
        media: [],
      } as any),
    ).rejects.toThrow(AppError);
  });

  it('getById throws 404 for missing/deleted post', async () => {
    mockPrisma.post.findUnique.mockResolvedValueOnce(null);
    await expect(service.getById('missing', 'acc1')).rejects.toThrow(AppError);
  });

  it('comment throws 403 when account comment policy is followers-only and viewer does not follow owner', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 'p1',
      accountId: 'owner1',
      privacy: 'PUBLIC',
      isDeleted: false,
      isArchived: false,
      isMature: false,
      isScheduled: false,
      scheduledFor: null,
      isSubscriberOnly: false,
      allowComments: true,
    });
    mockPrisma.account.findUnique.mockImplementation((args: { where?: { id: string }; select?: Record<string, unknown> }) => {
      const id = args?.where?.id;
      const sel = args?.select ?? {};
      if ('clientSettings' in sel && id === 'owner1') {
        return Promise.resolve({ clientSettings: { comments: { allowFrom: 'followers' } } });
      }
      if ('hiddenWordsCommentFilter' in sel && id === 'owner1') {
        return Promise.resolve({ hiddenWordsCommentFilter: false, hiddenWords: [] });
      }
      if (id === 'commenter1' && 'user' in sel) {
        return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    await expect(service.comment('commenter1', 'p1', 'Hi')).rejects.toThrow(AppError);
  });

  it('comment is hidden and audit logged when limit interactions apply', async () => {
    mockShouldLimitPost.mockResolvedValue(true);
    mockPrisma.comment.create.mockResolvedValue({
      id: 'c-limit',
      content: 'Hi',
      createdAt: new Date(),
      isHidden: true,
      postId: 'p1',
      account: { id: 'commenter1', username: 'c1', displayName: null, profilePhoto: null },
    });
    await service.comment('commenter1', 'p1', 'Hi');
    expect(mockPrisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isHidden: true }),
      }),
    );
    expect(mockAddActivityLogPost).toHaveBeenCalledWith(
      'acc1',
      expect.objectContaining({
        type: 'limit_interaction_comment',
        metadata: expect.objectContaining({
          commentId: 'c-limit',
          fromAccountId: 'commenter1',
          postId: 'p1',
        }),
      }),
    );
  });
});
