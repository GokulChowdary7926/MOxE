import { AppError } from '../../utils/AppError';
import { CloseFriendService } from '../closeFriend.service';

jest.mock('../../server', () => ({
  prisma: {
    closeFriend: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('CloseFriendService', () => {
  const service = new CloseFriendService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('add rejects adding self', async () => {
    await expect(service.add('a1', 'a1')).rejects.toBeInstanceOf(AppError);
  });

  it('add rejects missing friend account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    await expect(service.add('a1', 'f1')).rejects.toBeInstanceOf(AppError);
  });

  it('list maps close friends to item shape', async () => {
    mockPrisma.closeFriend.findMany.mockResolvedValue([
      {
        friend: { id: 'f1', username: 'bob', displayName: 'Bob', profilePhoto: null },
      },
    ]);
    const rows = await service.list('a1');
    expect(rows[0]).toEqual({
      id: 'f1',
      username: 'bob',
      displayName: 'Bob',
      profilePhoto: null,
    });
  });
});
