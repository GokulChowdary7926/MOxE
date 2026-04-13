import { StoryService } from '../story.service';
import { AppError } from '../../utils/AppError';

jest.mock('../limitInteractionEnforcement.service', () => ({
  assertNotLimitedIncomingInteraction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../server', () => ({
  prisma: {
    story: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    block: { findUnique: jest.fn().mockResolvedValue(null) },
    account: { findUnique: jest.fn().mockResolvedValue({ user: { dateOfBirth: new Date('1990-01-01') } }) },
    subscription: { findFirst: jest.fn().mockResolvedValue(null) },
    closeFriend: { findUnique: jest.fn().mockResolvedValue(null) },
    follow: { findUnique: jest.fn().mockResolvedValue(null) },
    storyReply: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    storyQuestion: { create: jest.fn() },
    limitInteractionSetting: { findUnique: jest.fn().mockResolvedValue(null) },
  },
}));

jest.mock('../tagMentionPrivacy.service', () => ({
  assertActorMayMention: jest.fn().mockResolvedValue(undefined),
  assertCommentMentionsAllowed: jest.fn().mockResolvedValue(undefined),
}));

const { prisma: mockPrisma } = require('../../server');
const mockAssertNotLimited = require('../limitInteractionEnforcement.service')
  .assertNotLimitedIncomingInteraction as jest.Mock;

describe('StoryService visibility', () => {
  const service = new StoryService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAssertNotLimited.mockResolvedValue(undefined);
    mockPrisma.block.findUnique.mockResolvedValue(null);
    mockPrisma.account.findUnique.mockResolvedValue({ user: { dateOfBirth: new Date('1990-01-01') } });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.closeFriend.findUnique.mockResolvedValue(null);
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.storyReply.findMany.mockResolvedValue([]);
  });

  it('denies private story replies for non-follower', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's1',
      accountId: 'owner1',
      privacy: 'FOLLOWERS_ONLY',
      isCloseFriendsOnly: false,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [],
      allowReplies: true,
      allowReshares: true,
    });
    await expect(service.listStoryReplies('viewer1', 's1')).rejects.toThrow(AppError);
  });

  it('allows close-friends story replies for close friend', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's2',
      accountId: 'owner1',
      privacy: 'CLOSE_FRIENDS_ONLY',
      isCloseFriendsOnly: true,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [],
      allowReplies: true,
      allowReshares: true,
    });
    mockPrisma.closeFriend.findUnique.mockResolvedValue({ accountId: 'owner1', friendId: 'viewer1' });
    const result = await service.listStoryReplies('viewer1', 's2');
    expect(result).toEqual({ items: [] });
  });

  it('blocks story reply by hidden-word regex for non-allowlisted account', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's3',
      accountId: 'owner1',
      privacy: 'PUBLIC',
      isCloseFriendsOnly: false,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [],
      allowReplies: true,
      allowReshares: true,
    });
    mockPrisma.account.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id === 'owner1' && args?.select?.hiddenWordsCommentFilter) {
        return Promise.resolve({
          hiddenWordsCommentFilter: true,
          hiddenWords: ['spam'],
          clientSettings: { hiddenWordsConfig: { regexPatterns: ['buy\\s+now'], allowListAccountIds: [] } },
        });
      }
      if (args?.where?.id === 'owner1' && args?.select?.clientSettings) {
        return Promise.resolve({ clientSettings: { story: { repliesAudience: 'everyone' } } });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    await expect(service.submitStoryReply('viewer1', 's3', 'BUY now this offer')).rejects.toThrow(AppError);
  });

  it('allows story question from allowlisted account despite regex', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's4',
      accountId: 'owner1',
      privacy: 'PUBLIC',
      isCloseFriendsOnly: false,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [{ type: 'questions' }],
      allowReplies: true,
      allowReshares: true,
    });
    mockPrisma.account.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id === 'owner1' && args?.select?.hiddenWordsCommentFilter) {
        return Promise.resolve({
          hiddenWordsCommentFilter: true,
          hiddenWords: ['spam'],
          clientSettings: { hiddenWordsConfig: { regexPatterns: ['buy\\s+now'], allowListAccountIds: ['viewer1'] } },
        });
      }
      if (args?.where?.id === 'owner1' && args?.select?.clientSettings) {
        return Promise.resolve({ clientSettings: { story: { repliesAudience: 'everyone' } } });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    mockPrisma.storyQuestion.create.mockResolvedValue({ id: 'q1' });
    await expect(service.submitQuestion('viewer1', 's4', 0, 'buy now offer')).resolves.toEqual({ ok: true, questionId: 'q1' });
  });

  it('blocks story reply when limit interactions apply', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's5',
      accountId: 'owner1',
      deletedAt: null,
      privacy: 'PUBLIC',
      isCloseFriendsOnly: false,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [],
      allowReplies: true,
      allowReshares: true,
    });
    mockPrisma.account.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id === 'owner1' && args?.select?.hiddenWordsCommentFilter) {
        return Promise.resolve({ hiddenWordsCommentFilter: false, hiddenWords: [], clientSettings: {} });
      }
      if (args?.where?.id === 'owner1' && args?.select?.clientSettings) {
        return Promise.resolve({ clientSettings: { story: { repliesAudience: 'everyone' } } });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    mockAssertNotLimited.mockRejectedValueOnce(new AppError('This person is limiting interactions from accounts like yours right now.', 403));
    await expect(service.submitStoryReply('viewer1', 's5', 'hello')).rejects.toThrow(AppError);
    expect(mockPrisma.storyReply.create).not.toHaveBeenCalled();
  });

  it('blocks story question when limit interactions apply', async () => {
    mockPrisma.story.findUnique.mockResolvedValue({
      id: 's6',
      accountId: 'owner1',
      deletedAt: null,
      privacy: 'PUBLIC',
      isCloseFriendsOnly: false,
      isSubscriberOnly: false,
      expiresAt: new Date(Date.now() + 60_000),
      isMature: false,
      stickers: [{ type: 'questions' }],
      allowReplies: true,
      allowReshares: true,
    });
    mockPrisma.account.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id === 'owner1' && args?.select?.hiddenWordsCommentFilter) {
        return Promise.resolve({ hiddenWordsCommentFilter: false, hiddenWords: [], clientSettings: {} });
      }
      if (args?.where?.id === 'owner1' && args?.select?.clientSettings) {
        return Promise.resolve({ clientSettings: { story: { repliesAudience: 'everyone' } } });
      }
      return Promise.resolve({ user: { dateOfBirth: new Date('1990-01-01') } });
    });
    mockAssertNotLimited.mockRejectedValueOnce(new AppError('This person is limiting interactions from accounts like yours right now.', 403));
    await expect(service.submitQuestion('viewer1', 's6', 0, 'any question?')).rejects.toThrow(AppError);
    expect(mockPrisma.storyQuestion.create).not.toHaveBeenCalled();
  });
});
