import { randomBytes } from 'crypto';
import { prisma } from '../../server';
import { createFlowTaskEvent } from './moxe-calendar.service';
import { AppError } from '../../utils/AppError';

const BOARD_TYPES = ['PERSONAL', 'TEAM', 'PROJECT'];
const MEMBER_ROLES = ['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];
const LABEL_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black'];

const cardInclude: any = {
  labels: { include: { label: true } },
  assignees: { include: { account: { select: { id: true, displayName: true, username: true } } } },
  checklists: { include: { items: { orderBy: { order: 'asc' } } } },
  comments: { select: { id: true } },
  attachments: { select: { id: true } },
};

async function getBoardWithAccess(accountId: string, boardId: string) {
  const board = await prisma.flowBoard.findFirst({
    where: { id: boardId },
    include: {
      account: { select: { id: true, displayName: true, username: true } },
      members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      columns: {
        orderBy: { order: 'asc' },
        include: {
          cards: {
            where: { archivedAt: null },
            orderBy: { order: 'asc' },
            include: cardInclude,
          },
        },
      },
      labels: true,
    },
  });
  if (!board) return null;
  const isOwner = board.accountId === accountId;
  const membership = board.members.find((m) => m.accountId === accountId);
  if (isOwner || membership) return { ...board, _access: { isOwner, role: isOwner ? 'ADMIN' : membership!.role } };
  return null;
}

async function getBoardOrThrow(accountId: string, boardId: string, opts?: { requireWrite?: boolean }) {
  const board = await getBoardWithAccess(accountId, boardId);
  if (!board) throw new AppError('Board not found', 404);
  const access = (board as any)._access;
  if (opts?.requireWrite && access && !canWriteBoard(access)) throw new AppError('You do not have permission to edit this board', 403);
  return board;
}

function canWriteBoard(access: { isOwner: boolean; role: string }) {
  return access.isOwner || access.role === 'ADMIN' || access.role === 'EDITOR';
}
function canManageMembers(access: { isOwner: boolean; role: string }) {
  return access.isOwner || access.role === 'ADMIN';
}
function canCommentBoard(access: { isOwner: boolean; role: string }) {
  return access.isOwner || ['ADMIN', 'EDITOR', 'COMMENTER'].includes(access.role);
}

async function getCardOrThrow(accountId: string, cardId: string) {
  const card = await prisma.flowCard.findUnique({
    where: { id: cardId },
    include: {
      column: { include: { board: true } },
      labels: { include: { label: true } },
      assignees: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      checklists: { include: { items: { orderBy: { order: 'asc' } } } },
      comments: { include: { author: { select: { id: true, displayName: true, username: true } } }, orderBy: { createdAt: 'asc' } },
      attachments: true,
    },
  });
  if (!card) throw new AppError('Card not found', 404);
  const board = card.column.board;
  const isOwner = board.accountId === accountId;
  const member = await prisma.flowBoardMember.findUnique({
    where: { boardId_accountId: { boardId: board.id, accountId } },
  });
  if (!isOwner && !member) throw new AppError('Card not found', 404);
  return card;
}

export class FlowService {
  async getBoards(accountId: string) {
    return prisma.flowBoard.findMany({
      where: {
        OR: [
          { accountId },
          { members: { some: { accountId } } },
        ],
      },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              where: { archivedAt: null },
              orderBy: { order: 'asc' },
              include: { labels: { include: { label: true } }, assignees: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createBoard(
    accountId: string,
    data: {
      name: string;
      description?: string;
      boardType?: string;
      background?: string;
      listNames?: string[];
    }
  ) {
    const name = (data.name || '').trim();
    if (name.length < 3 || name.length > 100) throw new AppError('Board name must be 3–100 characters', 400);
    const boardType = BOARD_TYPES.includes(data.boardType || '') ? data.boardType : 'PERSONAL';
    const listNames = Array.isArray(data.listNames) && data.listNames.length > 0
      ? data.listNames.map((n) => (n || '').trim().slice(0, 120)).filter(Boolean)
      : ['To Do', 'Doing', 'Done'];
    if (listNames.length === 0) throw new AppError('At least one list is required', 400);

    const count = await prisma.flowBoard.count({ where: { accountId } });
    const board = await prisma.flowBoard.create({
      data: {
        accountId,
        name,
        description: (data.description || '').slice(0, 500) || undefined,
        boardType,
        background: (data.background || '').trim().slice(0, 120) || undefined,
        order: count,
        columns: {
          create: listNames.map((name, i) => ({ name, order: i })),
        },
      },
      include: { columns: { orderBy: { order: 'asc' }, include: { cards: true } }, labels: true },
    });
    return board;
  }

  async getBoard(accountId: string, boardId: string, includeArchived = false) {
    const withAccess = await getBoardWithAccess(accountId, boardId);
    if (!withAccess) throw new AppError('Board not found', 404);
    const board = await prisma.flowBoard.findFirst({
      where: { id: boardId },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              where: includeArchived ? undefined : { archivedAt: null },
              orderBy: { order: 'asc' },
              include: cardInclude,
            },
          },
        },
        labels: true,
      },
    });
    if (!board) throw new AppError('Board not found', 404);
    return { ...board, _access: (withAccess as any)._access };
  }

  async listMembers(accountId: string, boardId: string) {
    const board = await getBoardOrThrow(accountId, boardId);
    const access = (board as any)._access;
    if (!access || !canManageMembers(access)) throw new AppError('Only admins can list members', 403);
    const b = await prisma.flowBoard.findUnique({
      where: { id: boardId },
      include: {
        account: { select: { id: true, displayName: true, username: true } },
        members: { include: { account: { select: { id: true, displayName: true, username: true } } } },
      },
    });
    if (!b) throw new AppError('Board not found', 404);
    return {
      owner: b.account,
      members: b.members.map((m) => ({ accountId: m.accountId, role: m.role, account: m.account })),
    };
  }

  async addMember(accountId: string, boardId: string, targetAccountId: string, role: string) {
    const board = await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const access = (board as any)._access;
    if (!access || !canManageMembers(access)) throw new AppError('Only admins can add members', 403);
    if (!MEMBER_ROLES.includes(role)) throw new AppError('Invalid role', 400);
    const target = await prisma.account.findUnique({ where: { id: targetAccountId } });
    if (!target) throw new AppError('User not found', 404);
    if (target.id === board.accountId) throw new AppError('Owner is already a member', 400);
    await prisma.flowBoardMember.upsert({
      where: { boardId_accountId: { boardId, accountId: targetAccountId } },
      create: { boardId, accountId: targetAccountId, role },
      update: { role },
    });
    return this.listMembers(accountId, boardId);
  }

  async removeMember(accountId: string, boardId: string, targetAccountId: string) {
    const board = await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const access = (board as any)._access;
    if (!access || !canManageMembers(access)) throw new AppError('Only admins can remove members', 403);
    if (targetAccountId === board.accountId) throw new AppError('Cannot remove board owner', 400);
    await prisma.flowBoardMember.deleteMany({
      where: { boardId, accountId: targetAccountId },
    });
    return { removed: true };
  }

  async updateMemberRole(accountId: string, boardId: string, targetAccountId: string, role: string) {
    const board = await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const access = (board as any)._access;
    if (!access || !canManageMembers(access)) throw new AppError('Only admins can change roles', 403);
    if (targetAccountId === board.accountId) throw new AppError('Cannot change owner role', 400);
    if (!MEMBER_ROLES.includes(role)) throw new AppError('Invalid role', 400);
    await prisma.flowBoardMember.update({
      where: { boardId_accountId: { boardId, accountId: targetAccountId } },
      data: { role },
    });
    return this.listMembers(accountId, boardId);
  }

  async inviteByEmail(accountId: string, boardId: string, email: string, role: string) {
    const board = await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const access = (board as any)._access;
    if (!access || !canManageMembers(access)) throw new AppError('Only admins can invite', 403);
    if (!MEMBER_ROLES.includes(role)) throw new AppError('Invalid role', 400);
    const emailNorm = (email || '').trim().toLowerCase().slice(0, 255);
    if (!emailNorm) throw new AppError('Email required', 400);
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.flowBoardInvite.create({
      data: { boardId, email: emailNorm, role, token, invitedById: accountId, expiresAt },
    });
    // Future: send email with invite link (e.g. /flow/join?token=...); for now just return success
    return { invited: true, expiresAt };
  }

  async updateBoard(
    accountId: string,
    boardId: string,
    data: { name?: string; description?: string; boardType?: string; background?: string }
  ) {
    await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 3 || name.length > 100) throw new AppError('Board name must be 3–100 characters', 400);
      update.name = name;
    }
    if (data.description !== undefined) update.description = data.description?.slice(0, 500) || null;
    if (data.boardType !== undefined && BOARD_TYPES.includes(data.boardType)) update.boardType = data.boardType;
    if (data.background !== undefined) update.background = data.background?.trim().slice(0, 120) || null;
    return prisma.flowBoard.update({
      where: { id: boardId },
      data: update,
      include: { columns: { orderBy: { order: 'asc' }, include: { cards: true } }, labels: true },
    });
  }

  async deleteBoard(accountId: string, boardId: string) {
    await getBoardOrThrow(accountId, boardId);
    await prisma.flowBoard.delete({ where: { id: boardId } });
    return { deleted: true };
  }

  async addColumn(accountId: string, boardId: string, name: string) {
    const board = await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const maxOrder = board.columns.length ? Math.max(...board.columns.map((c) => c.order)) + 1 : 0;
    return prisma.flowColumn.create({
      data: { boardId, name: (name || '').trim().slice(0, 120) || 'New list', order: maxOrder },
    });
  }

  async updateColumn(
    accountId: string,
    columnId: string,
    data: { name?: string; wipLimit?: number | null; color?: string | null }
  ) {
    const col = await prisma.flowColumn.findFirst({
      where: { id: columnId },
      include: { board: true },
    });
    if (!col) throw new AppError('Column not found', 404);
    await getBoardOrThrow(accountId, col.boardId, { requireWrite: true });
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name?.slice(0, 120) || col.name;
    if (data.wipLimit !== undefined) update.wipLimit = data.wipLimit;
    if (data.color !== undefined) update.color = data.color?.slice(0, 30) || null;
    return prisma.flowColumn.update({ where: { id: columnId }, data: update });
  }

  async deleteColumn(accountId: string, columnId: string) {
    const col = await prisma.flowColumn.findFirst({
      where: { id: columnId },
      include: { board: true },
    });
    if (!col || col.board.accountId !== accountId) throw new AppError('Column not found', 404);
    await prisma.flowColumn.delete({ where: { id: columnId } });
    return { deleted: true };
  }

  async reorderColumns(accountId: string, boardId: string, columnIds: string[]) {
    await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    if (!Array.isArray(columnIds) || columnIds.length === 0) return this.getBoard(accountId, boardId);
    await Promise.all(
      columnIds.map((id, index) =>
        prisma.flowColumn.updateMany({
          where: { id, boardId },
          data: { order: index },
        })
      )
    );
    return this.getBoard(accountId, boardId);
  }

  async addCard(
    accountId: string,
    columnId: string,
    data: {
      title: string;
      description?: string;
      companyName?: string;
      jobPostingUrl?: string;
      notes?: string;
      jobApplicationId?: string;
      dueDate?: string;
      labelIds?: string[];
      assigneeIds?: string[];
    }
  ) {
    const col = await prisma.flowColumn.findFirst({
      where: { id: columnId },
      include: { board: true },
    });
    if (!col) throw new AppError('Column not found', 404);
    await getBoardOrThrow(accountId, col.boardId, { requireWrite: true });
    const title = (data.title || '').trim();
    if (title.length < 3 || title.length > 200) throw new AppError('Card title must be 3–200 characters', 400);

    const maxOrder = await prisma.flowCard.count({ where: { columnId } });
    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    const card = await prisma.flowCard.create({
      data: {
        columnId,
        title,
        description: (data.description || '').slice(0, 5000) || undefined,
        companyName: (data.companyName || '').trim().slice(0, 200) || undefined,
        jobPostingUrl: (data.jobPostingUrl || '').trim().slice(0, 500) || undefined,
        notes: data.notes?.slice(0, 5000) || undefined,
        jobApplicationId: data.jobApplicationId || undefined,
        dueDate,
        order: maxOrder,
      },
      include: cardInclude,
    });

    const labelIds = Array.isArray(data.labelIds) ? data.labelIds : [];
    if (labelIds.length > 0) {
      const labels = await prisma.flowLabel.findMany({
        where: { boardId: col.boardId, id: { in: labelIds } },
      });
      await prisma.flowCardLabel.createMany({
        data: labels.map((l) => ({ cardId: card.id, labelId: l.id })),
      });
    }
    const assigneeIds = Array.isArray(data.assigneeIds) ? data.assigneeIds : [];
    if (assigneeIds.length > 0) {
      await prisma.flowCardMember.createMany({
        data: assigneeIds.slice(0, 20).map((aid) => ({ cardId: card.id, accountId: aid })),
        skipDuplicates: true,
      });
    }

    const saved = await this.getCard(accountId, card.id);
    await this.rescheduleCardReminders(saved.id);
    if (dueDate) {
      await createFlowTaskEvent({
        cardId: saved.id,
        boardId: col.boardId,
        title: saved.title,
        dueDate,
      });
    }
    return saved;
  }

  async getCard(accountId: string, cardId: string) {
    const card = await getCardOrThrow(accountId, cardId);
    return card;
  }

  async updateCard(
    accountId: string,
    cardId: string,
    data: {
      title?: string;
      description?: string;
      companyName?: string;
      jobPostingUrl?: string;
      notes?: string;
      dueDate?: string | null;
      labelIds?: string[];
      assigneeIds?: string[];
    }
  ) {
    const card = await getCardOrThrow(accountId, cardId);
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) {
      const title = data.title.trim();
      if (title.length < 3 || title.length > 200) throw new AppError('Card title must be 3–200 characters', 400);
      update.title = title;
    }
    if (data.description !== undefined) update.description = data.description?.slice(0, 5000) || null;
    if (data.companyName !== undefined) update.companyName = data.companyName?.trim().slice(0, 200) || null;
    if (data.jobPostingUrl !== undefined) update.jobPostingUrl = data.jobPostingUrl?.trim().slice(0, 500) || null;
    if (data.notes !== undefined) update.notes = data.notes?.slice(0, 5000) || null;
    const hadDueDate = !!card.dueDate;
    let nextDueDate: Date | null | undefined;
    if (data.dueDate !== undefined) {
      nextDueDate = data.dueDate ? new Date(data.dueDate) : null;
      update.dueDate = nextDueDate;
    }

    await prisma.flowCard.update({ where: { id: cardId }, data: update });

    if (data.labelIds !== undefined) {
      await prisma.flowCardLabel.deleteMany({ where: { cardId } });
      const labelIds = Array.isArray(data.labelIds) ? data.labelIds : [];
      if (labelIds.length > 0) {
        const labels = await prisma.flowLabel.findMany({
          where: { boardId: card.column.boardId, id: { in: labelIds } },
        });
        await prisma.flowCardLabel.createMany({
          data: labels.map((l) => ({ cardId, labelId: l.id })),
        });
      }
    }
    if (data.assigneeIds !== undefined) {
      await prisma.flowCardMember.deleteMany({ where: { cardId } });
      const assigneeIds = Array.isArray(data.assigneeIds) ? data.assigneeIds : [];
      if (assigneeIds.length > 0) {
        await prisma.flowCardMember.createMany({
          data: assigneeIds.slice(0, 20).map((aid) => ({ cardId, accountId: aid })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await this.getCard(accountId, cardId);
    await this.rescheduleCardReminders(updated.id);
    if (nextDueDate && (!hadDueDate || (card.dueDate && card.dueDate.getTime() !== nextDueDate.getTime()))) {
      await createFlowTaskEvent({
        cardId: updated.id,
        boardId: updated.column.boardId,
        title: updated.title,
        dueDate: nextDueDate,
      });
    }
    return updated;
  }

  async moveCard(accountId: string, cardId: string, targetColumnId: string, newOrder: number) {
    const card = await getCardOrThrow(accountId, cardId);
    if (card.archivedAt) throw new AppError('Cannot move archived card', 400);
    await getBoardOrThrow(accountId, card.column.boardId, { requireWrite: true });
    const target = await prisma.flowColumn.findFirst({
      where: { id: targetColumnId },
      include: { board: true },
    });
    if (!target || target.boardId !== card.column.boardId) throw new AppError('Target column not found', 404);
    await prisma.flowCard.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, order: newOrder },
    });
    const moved = await this.getCard(accountId, cardId);

    const targetColumn = await prisma.flowColumn.findFirst({
      where: { id: targetColumnId },
      include: { board: true },
    });
    if (targetColumn) {
      const name = (targetColumn.name || '').toLowerCase();
      if (name === 'done' || name === 'complete') {
        let doneLabel = await prisma.flowLabel.findFirst({
          where: { boardId: targetColumn.boardId, name: 'Done' },
        });
        if (!doneLabel) {
          doneLabel = await prisma.flowLabel.create({
            data: {
              boardId: targetColumn.boardId,
              name: 'Done',
              color: 'green',
            },
          });
        }
        await prisma.flowCardLabel.upsert({
          where: { cardId_labelId: { cardId: moved.id, labelId: doneLabel.id } },
          update: {},
          create: { cardId: moved.id, labelId: doneLabel.id },
        });
      }
    }

    await this.rescheduleCardReminders(moved.id);
    return moved;
  }

  async archiveCard(accountId: string, cardId: string) {
    const card = await getCardOrThrow(accountId, cardId);
    if (card.archivedAt) return card;
    await prisma.flowCard.update({
      where: { id: cardId },
      data: { archivedAt: new Date() },
    });
    return this.getCard(accountId, cardId);
  }

  async restoreCard(accountId: string, cardId: string, columnId?: string) {
    const card = await prisma.flowCard.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });
    if (!card || card.column.board.accountId !== accountId) throw new AppError('Card not found', 404);
    const data: { archivedAt: null; columnId?: string } = { archivedAt: null };
    if (columnId) {
      const col = await prisma.flowColumn.findFirst({
        where: { id: columnId },
        include: { board: true },
      });
      if (col && col.board.accountId === accountId) data.columnId = columnId;
    }
    await prisma.flowCard.update({ where: { id: cardId }, data });
    return this.getCard(accountId, cardId);
  }

  async deleteCard(accountId: string, cardId: string) {
    const card = await getCardOrThrow(accountId, cardId);
    await getBoardOrThrow(accountId, card.column.boardId, { requireWrite: true });
    await prisma.flowCard.delete({ where: { id: cardId } });
    return { deleted: true };
  }

  // ——— Labels ———
  async createLabel(accountId: string, boardId: string, name: string, color: string) {
    await getBoardOrThrow(accountId, boardId, { requireWrite: true });
    const n = (name || '').trim().slice(0, 20);
    if (!n) throw new AppError('Label name required', 400);
    const c = LABEL_COLORS.includes(color) ? color : 'blue';
    return prisma.flowLabel.create({
      data: { boardId, name: n, color: c },
    });
  }

  async updateLabel(accountId: string, labelId: string, data: { name?: string; color?: string }) {
    const label = await prisma.flowLabel.findFirst({
      where: { id: labelId },
      include: { board: true },
    });
    if (!label || label.board.accountId !== accountId) throw new AppError('Label not found', 404);
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = (data.name || '').trim().slice(0, 20) || label.name;
    if (data.color !== undefined && LABEL_COLORS.includes(data.color)) update.color = data.color;
    return prisma.flowLabel.update({ where: { id: labelId }, data: update });
  }

  async deleteLabel(accountId: string, labelId: string) {
    const label = await prisma.flowLabel.findFirst({
      where: { id: labelId },
      include: { board: true },
    });
    if (!label) throw new AppError('Label not found', 404);
    await getBoardOrThrow(accountId, label.boardId, { requireWrite: true });
    await prisma.flowLabel.delete({ where: { id: labelId } });
    return { deleted: true };
  }

  // ——— Checklists ———
  async addChecklist(
    accountId: string,
    cardId: string,
    data: { name: string; items?: { title: string }[] }
  ) {
    const card = await getCardOrThrow(accountId, cardId);
    await getBoardOrThrow(accountId, card.column.boardId, { requireWrite: true });
    const name = (data.name || '').trim().slice(0, 120) || 'Checklist';
    const items = Array.isArray(data.items) ? data.items : [];
    const checklist = await prisma.flowChecklist.create({
      data: {
        cardId,
        name,
        order: 0,
        items: {
          create: items.slice(0, 100).map((it, i) => ({
            title: (it.title || '').trim().slice(0, 500) || 'Item',
            order: i,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    return checklist;
  }

  async updateChecklist(accountId: string, checklistId: string, data: { name?: string }) {
    const cl = await prisma.flowChecklist.findFirst({
      where: { id: checklistId },
      include: { card: { include: { column: true } } },
    });
    if (!cl) throw new AppError('Checklist not found', 404);
    await getBoardOrThrow(accountId, cl.card.column.boardId, { requireWrite: true });
    const updateData = data.name !== undefined ? { name: data.name.slice(0, 120) } : {};
    return prisma.flowChecklist.update({
      where: { id: checklistId },
      data: updateData,
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteChecklist(accountId: string, checklistId: string) {
    const cl = await prisma.flowChecklist.findFirst({
      where: { id: checklistId },
      include: { card: { include: { column: true } } },
    });
    if (!cl) throw new AppError('Checklist not found', 404);
    await getBoardOrThrow(accountId, cl.card.column.boardId, { requireWrite: true });
    await prisma.flowChecklist.delete({ where: { id: checklistId } });
    return { deleted: true };
  }

  async addChecklistItem(accountId: string, checklistId: string, title: string) {
    const cl = await prisma.flowChecklist.findFirst({
      where: { id: checklistId },
      include: { card: { include: { column: true } } },
    });
    if (!cl) throw new AppError('Checklist not found', 404);
    await getBoardOrThrow(accountId, cl.card.column.boardId, { requireWrite: true });
    const maxOrder = await prisma.flowChecklistItem.aggregate({
      where: { checklistId },
      _max: { order: true },
    });
    return prisma.flowChecklistItem.create({
      data: {
        checklistId,
        title: (title || '').trim().slice(0, 500) || 'Item',
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async updateChecklistItem(
    accountId: string,
    itemId: string,
    data: { title?: string; done?: boolean; order?: number }
  ) {
    const item = await prisma.flowChecklistItem.findFirst({
      where: { id: itemId },
      include: { checklist: { include: { card: { include: { column: true } } } } },
    });
    if (!item) throw new AppError('Item not found', 404);
    await getBoardOrThrow(accountId, item.checklist.card.column.boardId, { requireWrite: true });
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title.slice(0, 500);
    if (data.done !== undefined) update.done = data.done;
    if (data.order !== undefined) update.order = data.order;
    return prisma.flowChecklistItem.update({ where: { id: itemId }, data: update });
  }

  async deleteChecklistItem(accountId: string, itemId: string) {
    const item = await prisma.flowChecklistItem.findFirst({
      where: { id: itemId },
      include: { checklist: { include: { card: { include: { column: true } } } } },
    });
    if (!item) throw new AppError('Item not found', 404);
    await getBoardOrThrow(accountId, item.checklist.card.column.boardId, { requireWrite: true });
    await prisma.flowChecklistItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  // ——— Comments ———
  async addComment(accountId: string, cardId: string, body: string) {
    const card = await getCardOrThrow(accountId, cardId);
    const boardWithAccess = await getBoardWithAccess(accountId, card.column.boardId);
    if (!boardWithAccess || !canCommentBoard((boardWithAccess as any)._access)) throw new AppError('You do not have permission to comment', 403);
    const text = (body || '').trim();
    if (!text) throw new AppError('Comment body required', 400);
    return prisma.flowComment.create({
      data: { cardId, authorId: accountId, body: text },
      include: { author: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async listComments(accountId: string, cardId: string) {
    await getCardOrThrow(accountId, cardId);
    return prisma.flowComment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async updateComment(accountId: string, commentId: string, body: string) {
    const comment = await prisma.flowComment.findFirst({
      where: { id: commentId },
      include: { card: { include: { column: true } } },
    });
    if (!comment) throw new AppError('Comment not found', 404);
    const board = await getBoardWithAccess(accountId, comment.card.column.boardId);
    if (!board) throw new AppError('Comment not found', 404);
    if (comment.authorId !== accountId && !canWriteBoard((board as any)._access)) throw new AppError('You do not have permission to edit this comment', 403);
    const text = (body || '').trim();
    if (!text) throw new AppError('Comment body required', 400);
    return prisma.flowComment.update({
      where: { id: commentId },
      data: { body: text },
      include: { author: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async deleteComment(accountId: string, commentId: string) {
    const comment = await prisma.flowComment.findFirst({
      where: { id: commentId },
      include: { card: { include: { column: true } } },
    });
    if (!comment) throw new AppError('Comment not found', 404);
    const board = await getBoardWithAccess(accountId, comment.card.column.boardId);
    if (!board) throw new AppError('Comment not found', 404);
    if (comment.authorId !== accountId && !canWriteBoard((board as any)._access)) throw new AppError('You do not have permission to delete this comment', 403);
    await prisma.flowComment.delete({ where: { id: commentId } });
    return { deleted: true };
  }

  // ——— Attachments (URL/store only; no file upload in this service) ———
  async addAttachment(
    accountId: string,
    cardId: string,
    data: { fileName: string; fileUrl: string; fileSize: number; mimeType?: string }
  ) {
    await getCardOrThrow(accountId, cardId);
    const fileName = (data.fileName || '').trim().slice(0, 255) || 'file';
    const fileUrl = (data.fileUrl || '').trim().slice(0, 1024);
    if (!fileUrl) throw new AppError('File URL required', 400);
    const fileSize = Math.max(0, Number(data.fileSize) || 0);
    return prisma.flowAttachment.create({
      data: {
        cardId,
        fileName,
        fileUrl,
        fileSize,
        mimeType: (data.mimeType || '').slice(0, 100) || undefined,
        uploaderId: accountId,
      },
    });
  }

  async deleteAttachment(accountId: string, attachmentId: string) {
    const att = await prisma.flowAttachment.findFirst({
      where: { id: attachmentId },
      include: { card: { include: { column: true } } },
    });
    if (!att) throw new AppError('Attachment not found', 404);
    await getBoardOrThrow(accountId, att.card.column.boardId, { requireWrite: true });
    await prisma.flowAttachment.delete({ where: { id: attachmentId } });
    return { deleted: true };
  }

  private async rescheduleCardReminders(cardId: string): Promise<void> {
    const card = await prisma.flowCard.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: true } },
        assignees: true,
      },
    });
    if (!card) return;
    await prisma.flowCardReminder.deleteMany({ where: { cardId } });
    if (!card.dueDate || card.archivedAt) return;

    const now = new Date();
    const reminderHours = [24, 1];
    const recipients =
      card.assignees.length > 0
        ? card.assignees.map((a) => a.accountId)
        : [card.column.board.accountId];

    const data: { accountId: string; cardId: string; notifyAt: Date }[] = [];
    for (const accountId of recipients) {
      for (const h of reminderHours) {
        const notifyAt = new Date(card.dueDate.getTime() - h * 60 * 60 * 1000);
        if (notifyAt <= now) continue;
        data.push({ accountId, cardId: card.id, notifyAt });
      }
    }
    if (data.length > 0) {
      await prisma.flowCardReminder.createMany({ data, skipDuplicates: true });
    }
  }

  async processDueReminders(): Promise<number> {
    const now = new Date();
    let due;
    try {
      due = await prisma.flowCardReminder.findMany({
        where: { notifyAt: { lte: now } },
        include: {
          account: { select: { id: true } },
          card: {
            include: {
              column: {
                include: { board: true },
              },
            },
          },
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2021' || (e?.message && String(e.message).includes('does not exist'))) {
        return 0;
      }
      throw e;
    }
    let count = 0;
    for (const r of due as any[]) {
      try {
        const card = r.card;
        const board = card.column.board;
        await prisma.notification.create({
          data: {
            recipientId: r.accountId,
            type: 'FLOW_DUE_REMINDER',
            content: `Card due soon: ${card.title}`,
            data: {
              cardId: card.id,
              boardId: board.id,
              boardName: board.name,
              dueDate: card.dueDate,
            } as object,
          },
        });
        await prisma.flowCardReminder.delete({ where: { id: r.id } });
        count++;
      } catch {
      }
    }
    return count;
  }
}
