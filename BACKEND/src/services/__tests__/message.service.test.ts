import { MessageService } from '../message.service';

jest.mock('../limitInteractionEnforcement.service', () => ({
  shouldLimitIncomingInteraction: jest.fn().mockResolvedValue(false),
}));
jest.mock('../activity.service', () => ({
  addAccountActivityLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../server', () => ({
  prisma: {
    message: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: 'm-new' }),
    },
    messageRecipient: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(0),
    },
    reaction: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    follow: { findMany: jest.fn().mockResolvedValue([]) },
    block: { findUnique: jest.fn().mockResolvedValue(null) },
    restrict: { findMany: jest.fn().mockResolvedValue([]) },
    pinnedChat: { findMany: jest.fn().mockResolvedValue([]) },
    conversationMute: { findMany: jest.fn().mockResolvedValue([]) },
    conversationLabel: { findMany: jest.fn().mockResolvedValue([]) },
    account: { findUnique: jest.fn().mockResolvedValue(null) },
    groupMember: { findUnique: jest.fn().mockResolvedValue(null) },
    group: { findFirst: jest.fn().mockResolvedValue(null) },
    pollVote: { upsert: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('../../sockets', () => ({
  getIo: jest.fn(() => null),
}));

const { prisma: mockPrisma } = require('../../server');
const mockShouldLimit = require('../limitInteractionEnforcement.service')
  .shouldLimitIncomingInteraction as jest.Mock;
const mockAddActivityLog = require('../activity.service').addAccountActivityLog as jest.Mock;

describe('MessageService delete timeline behavior', () => {
  const service = new MessageService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldLimit.mockResolvedValue(false);
    mockPrisma.message.findMany.mockResolvedValue([]);
    mockPrisma.message.findFirst.mockResolvedValue(null);
    mockPrisma.messageRecipient.count.mockResolvedValue(0);
    mockPrisma.block.findUnique = jest.fn().mockResolvedValue(null);
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 'acc1',
      user: { dateOfBirth: new Date('1990-01-01') },
    });
    mockPrisma.follow.findUnique = jest.fn().mockResolvedValue({ id: 'f1' });
  });

  it('sender delete-for-me sets deletedBySenderAt', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      senderId: 'acc1',
      groupId: null,
      recipients: [{ recipientId: 'acc2' }],
    });
    const result = await service.deleteMessage('acc1', 'm1', true);
    expect(result).toEqual({ ok: true, deletedForMe: true });
    expect(mockPrisma.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({ deletedBySenderAt: expect.any(Date) }),
      }),
    );
    expect(mockPrisma.message.delete).not.toHaveBeenCalled();
  });

  it('receiver delete-for-me sets deletedByReceiverAt and hides recipient row', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({
      id: 'm2',
      senderId: 'acc1',
      groupId: null,
      recipients: [{ recipientId: 'acc2' }],
    });
    const result = await service.deleteMessage('acc2', 'm2', true);
    expect(result).toEqual({ ok: true, deletedForMe: true });
    expect(mockPrisma.messageRecipient.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { messageId: 'm2', recipientId: 'acc2' },
        data: { isHidden: true },
      }),
    );
    expect(mockPrisma.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm2' },
        data: expect.objectContaining({ deletedByReceiverAt: expect.any(Date) }),
      }),
    );
    expect(mockPrisma.message.delete).not.toHaveBeenCalled();
  });

  it('sender delete-for-everyone hard deletes message', async () => {
    mockPrisma.message.findUnique.mockResolvedValue({
      id: 'm3',
      senderId: 'acc1',
      groupId: null,
      recipients: [{ recipientId: 'acc2' }],
    });
    const result = await service.deleteMessage('acc1', 'm3', false);
    expect(result).toEqual({ ok: true, deletedForEveryone: true });
    expect(mockPrisma.reaction.deleteMany).toHaveBeenCalledWith({ where: { messageId: 'm3' } });
    expect(mockPrisma.messageRecipient.deleteMany).toHaveBeenCalledWith({ where: { messageId: 'm3' } });
    expect(mockPrisma.message.delete).toHaveBeenCalledWith({ where: { id: 'm3' } });
  });

  it('thread query excludes sender and receiver deleted-for-me rows', async () => {
    await service.getThread('acc1', 'acc2');
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ senderId: 'acc1', deletedBySenderAt: null }),
            expect.objectContaining({ senderId: 'acc2', deletedByReceiverAt: null }),
          ]),
        }),
      }),
    );
  });

  it('send throws 400 when content and media are missing', async () => {
    await expect(service.send('acc1', 'acc2', '', 'TEXT')).rejects.toThrow('Content or media required');
  });

  it('send throws 400 when media URL is invalid', async () => {
    await expect(
      service.send('acc1', 'acc2', '', 'IMAGE', { media: { url: 'file://local' } as any }),
    ).rejects.toThrow('Invalid media URL');
  });

  it('send hides DM for recipient and logs when limit interactions apply', async () => {
    mockShouldLimit.mockResolvedValue(true);
    mockPrisma.message.create.mockResolvedValue({
      id: 'm-limit-1',
      senderId: 'sender1',
      content: 'hello',
      messageType: 'TEXT',
      recipients: [{ recipientId: 'recv1', isHidden: true }],
      sender: { id: 'sender1', username: 's1', displayName: null, profilePhoto: null },
    });
    mockPrisma.account.findUnique.mockImplementation((args: { where?: { id?: string } }) => {
      const id = args?.where?.id;
      if (id === 'sender1') {
        return Promise.resolve({ id: 'sender1', user: { dateOfBirth: new Date('1990-01-01') } });
      }
      if (id === 'recv1') {
        return Promise.resolve({
          id: 'recv1',
          user: { dateOfBirth: new Date('1990-01-01') },
          hiddenWordsDMFilter: false,
          hiddenWords: [],
          clientSettings: {},
        });
      }
      return Promise.resolve(null);
    });
    await service.send('sender1', 'recv1', 'hello', 'TEXT');
    expect(mockPrisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipients: { create: [{ recipientId: 'recv1', isHidden: true }] },
        }),
      }),
    );
    expect(mockAddActivityLog).toHaveBeenCalledWith(
      'recv1',
      expect.objectContaining({
        type: 'limit_interaction_dm',
        metadata: expect.objectContaining({ messageId: 'm-limit-1', senderId: 'sender1' }),
      }),
    );
  });

  it('markThreadRead updates recipients', async () => {
    const result = await service.markThreadRead('acc1', 'acc2');
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.messageRecipient.updateMany).toHaveBeenCalled();
  });

  it('getThreadByGroup throws 403 when not group member', async () => {
    mockPrisma.groupMember.findUnique.mockResolvedValue(null);
    await expect(service.getThreadByGroup('acc1', 'g1')).rejects.toThrow('Not a member of this group');
  });

  it('getThreads does not collapse sent threads by senderId', async () => {
    mockPrisma.message.findMany
      .mockResolvedValueOnce([
        {
          id: 'm1',
          senderId: 'acc1',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
          content: 'to acc2',
          recipients: [{ recipientId: 'acc2', recipient: { id: 'acc2', username: 'u2', displayName: 'U2', profilePhoto: null } }],
        },
        {
          id: 'm2',
          senderId: 'acc1',
          createdAt: new Date('2026-01-01T11:00:00.000Z'),
          content: 'to acc3',
          recipients: [{ recipientId: 'acc3', recipient: { id: 'acc3', username: 'u3', displayName: 'U3', profilePhoto: null } }],
        },
      ])
      .mockResolvedValueOnce([]);
    mockPrisma.message.findFirst
      .mockResolvedValueOnce({
        id: 'm2',
        senderId: 'acc1',
        content: 'latest to acc3',
        createdAt: new Date('2026-01-01T11:00:00.000Z'),
        sender: { id: 'acc1', username: 'me', displayName: 'Me', profilePhoto: null },
      })
      .mockResolvedValueOnce({
        id: 'm1',
        senderId: 'acc1',
        content: 'latest to acc2',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        sender: { id: 'acc1', username: 'me', displayName: 'Me', profilePhoto: null },
      });
    mockPrisma.account.findUnique
      .mockResolvedValueOnce({ id: 'acc3', username: 'u3', displayName: 'U3', profilePhoto: null })
      .mockResolvedValueOnce({ id: 'acc2', username: 'u2', displayName: 'U2', profilePhoto: null });
    mockPrisma.messageRecipient.count.mockResolvedValue(0);
    mockPrisma.follow.findMany.mockResolvedValue([{ followingId: 'acc2' }, { followingId: 'acc3' }]);

    const out = await service.getThreads('acc1');
    expect(out.threads.map((t) => t.otherId).sort()).toEqual(['acc2', 'acc3']);
    expect(mockPrisma.message.findMany).toHaveBeenNthCalledWith(
      1,
      expect.not.objectContaining({ distinct: expect.anything() }),
    );
  });
});
