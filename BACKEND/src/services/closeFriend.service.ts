import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type CloseFriendItem = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
};

export class CloseFriendService {
  async list(accountId: string): Promise<CloseFriendItem[]> {
    const rows = await prisma.closeFriend.findMany({
      where: { accountId },
      include: {
        friend: { select: { id: true, username: true, displayName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.friend.id,
      username: r.friend.username,
      displayName: r.friend.displayName,
      profilePhoto: r.friend.profilePhoto,
    }));
  }

  async add(accountId: string, friendId: string): Promise<{ ok: boolean }> {
    if (accountId === friendId) throw new AppError('Cannot add yourself', 400);
    const friend = await prisma.account.findUnique({ where: { id: friendId } });
    if (!friend) throw new AppError('Account not found', 404);
    await prisma.closeFriend.upsert({
      where: { accountId_friendId: { accountId, friendId } },
      create: { accountId, friendId },
      update: {},
    });
    return { ok: true };
  }

  async remove(accountId: string, friendId: string): Promise<{ ok: boolean }> {
    await prisma.closeFriend.deleteMany({
      where: { accountId, friendId },
    });
    return { ok: true };
  }
}
