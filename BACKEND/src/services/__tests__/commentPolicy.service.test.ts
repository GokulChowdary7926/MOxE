import { readCommentAllowFrom, assertMayCommentOnPost } from '../commentPolicy.service';
import { AppError } from '../../utils/AppError';

jest.mock('../../server', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    follow: { findUnique: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('commentPolicy.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('readCommentAllowFrom defaults to everyone', () => {
    expect(readCommentAllowFrom(null)).toBe('everyone');
    expect(readCommentAllowFrom({})).toBe('everyone');
  });

  it('readCommentAllowFrom reads followers / follow_back / off', () => {
    expect(readCommentAllowFrom({ comments: { allowFrom: 'followers' } })).toBe('followers');
    expect(readCommentAllowFrom({ comments: { allowFrom: 'follow-back' } })).toBe('follow_back');
    expect(readCommentAllowFrom({ comments: { allowFrom: 'follow_back' } })).toBe('follow_back');
    expect(readCommentAllowFrom({ comments: { allowFrom: 'off' } })).toBe('off');
  });

  it('assertMayCommentOnPost skips policy for post owner', async () => {
    await expect(assertMayCommentOnPost('same', 'same')).resolves.toBeUndefined();
    expect(mockPrisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('assertMayCommentOnPost rejects when mode off', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ clientSettings: { comments: { allowFrom: 'off' } } });
    await expect(assertMayCommentOnPost('owner', 'c1')).rejects.toThrow(AppError);
  });

  it('assertMayCommentOnPost rejects followers mode without follow edge', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ clientSettings: { comments: { allowFrom: 'followers' } } });
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    await expect(assertMayCommentOnPost('owner', 'c1')).rejects.toThrow(AppError);
  });

  it('assertMayCommentOnPost allows followers mode when follow exists', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ clientSettings: { comments: { allowFrom: 'followers' } } });
    mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    await expect(assertMayCommentOnPost('owner', 'c1')).resolves.toBeUndefined();
  });
});
