import { NoteService } from '../note.service';

jest.mock('../../server', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
    },
    note: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'n1',
        account: { id: 'acc1', username: 'u1', profilePhoto: null },
        likes: [],
        pollVotes: [],
      }),
    },
    follow: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    closeFriend: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    noteAnalytics: {
      create: jest.fn().mockResolvedValue({ id: 'na1' }),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('NoteService hidden-word enforcement', () => {
  const service = new NoteService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.account.findUnique.mockResolvedValue({
      hiddenWordsCommentFilter: false,
      hiddenWords: [],
      clientSettings: {},
    });
  });

  it('blocks note creation when regex pattern matches text', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      hiddenWordsCommentFilter: true,
      hiddenWords: [],
      clientSettings: { hiddenWordsConfig: { regexPatterns: ['buy\\s+now'], allowListAccountIds: [] } },
    });
    await expect(
      service.createNote({
        accountId: 'acc1',
        accountType: 'PERSONAL',
        tier: 'FREE',
        type: 'TEXT',
        content: { text: 'Buy now and save' },
      }),
    ).rejects.toThrow('Note content contains hidden words');
  });

  it('blocks note creation when hidden word matches poll options', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      hiddenWordsCommentFilter: true,
      hiddenWords: ['spam'],
      clientSettings: {},
    });
    await expect(
      service.createNote({
        accountId: 'acc1',
        accountType: 'PERSONAL',
        tier: 'STAR',
        type: 'POLL',
        content: { text: 'Vote', poll: { options: ['Option A', 'spam option'] } },
      }),
    ).rejects.toThrow('Note content contains hidden words');
  });

  it('creates note when content is clean', async () => {
    const created = await service.createNote({
      accountId: 'acc1',
      accountType: 'PERSONAL',
      tier: 'FREE',
      type: 'TEXT',
      content: { text: 'clean content' },
    });
    expect(created).toBeDefined();
    expect(mockPrisma.note.create).toHaveBeenCalled();
  });

  it('listVisibleNotes allows close-friends notes when viewer is in author close-friends list', async () => {
    mockPrisma.follow.findMany
      .mockResolvedValueOnce([]) // following
      .mockResolvedValueOnce([]); // followers
    mockPrisma.closeFriend.findMany.mockResolvedValue([{ accountId: 'author1' }]);
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: 'n-cf',
        accountId: 'author1',
        audienceJson: { type: 'closeFriends' },
        contentJson: { text: 'cf note' },
        account: { id: 'author1', username: 'author', profilePhoto: null },
        likes: [],
        pollVotes: [],
        status: 'ACTIVE',
        deletedAt: null,
        publishAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 3600_000),
        createdAt: new Date(),
      },
    ]);

    const out = await service.listVisibleNotes('viewer1');
    expect(out.map((n: any) => n.id)).toEqual(['n-cf']);
    expect(mockPrisma.closeFriend.findMany).toHaveBeenCalledWith({
      where: { friendId: 'viewer1' },
      select: { accountId: true },
    });
  });
});
