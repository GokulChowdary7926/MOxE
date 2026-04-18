import { AppError } from '../../utils/AppError';
import { GroupService } from '../group.service';

jest.mock('../../server', () => ({
  prisma: {
    groupMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    group: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    groupAdmin: {
      create: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('GroupService', () => {
  const service = new GroupService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getById rejects non-members', async () => {
    mockPrisma.groupMember.findUnique.mockResolvedValue(null);
    await expect(service.getById('a1', 'g1')).rejects.toBeInstanceOf(AppError);
  });

  it('create rejects when participants are less than 2 including creator', async () => {
    await expect(service.create('a1', { name: 'g', participantIds: [] })).rejects.toBeInstanceOf(AppError);
  });

  it('leave removes member and admin entries', async () => {
    const result = await service.leave('a1', 'g1');
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.groupMember.deleteMany).toHaveBeenCalledWith({ where: { groupId: 'g1', accountId: 'a1' } });
    expect(mockPrisma.groupAdmin.deleteMany).toHaveBeenCalledWith({ where: { groupId: 'g1', accountId: 'a1' } });
  });
});
