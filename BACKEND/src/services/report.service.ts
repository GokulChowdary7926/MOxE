import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export type CreateReportBody = {
  type: 'account' | 'post' | 'comment' | 'story';
  targetId: string;
  reason: string;
  description?: string;
};

export class ReportService {
  async create(reporterId: string, body: CreateReportBody): Promise<{ id: string }> {
    const { type, targetId, reason, description } = body;
    if (!reason || reason.length > 200) throw new AppError('Invalid reason', 400);

    const data: {
      reporterId: string;
      reason: string;
      description?: string;
      reportedAccountId?: string;
      reportedPostId?: string;
      reportedCommentId?: string;
      reportedStoryId?: string;
    } = { reporterId, reason: reason.slice(0, 200), description: description?.slice(0, 1000) };

    if (type === 'account') {
      const account = await prisma.account.findUnique({ where: { id: targetId } });
      if (!account) throw new AppError('Account not found', 404);
      data.reportedAccountId = targetId;
    } else if (type === 'post') {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) throw new AppError('Post not found', 404);
      data.reportedPostId = targetId;
    } else if (type === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!comment) throw new AppError('Comment not found', 404);
      data.reportedCommentId = targetId;
    } else if (type === 'story') {
      const story = await prisma.story.findUnique({ where: { id: targetId } });
      if (!story) throw new AppError('Story not found', 404);
      data.reportedStoryId = targetId;
    } else {
      throw new AppError('Invalid report type', 400);
    }

    const report = await prisma.report.create({ data });

    // Creator 14.2: Harassment protection – if same reporter reports same account >= 3 times, auto-restrict reporter (as seen by reported account)
    if (type === 'account' && data.reportedAccountId) {
      const count = await prisma.report.count({
        where: { reporterId, reportedAccountId: data.reportedAccountId },
      });
      if (count >= 3) {
        await prisma.restrict.upsert({
          where: {
            restrictorId_restrictedId: { restrictorId: data.reportedAccountId, restrictedId: reporterId },
          },
          create: { restrictorId: data.reportedAccountId, restrictedId: reporterId },
          update: {},
        });
      }
    }
    return { id: report.id };
  }

  /** Generic "Report a problem" (no specific target). */
  async createProblemReport(reporterId: string, reason: string, description?: string): Promise<{ id: string }> {
    if (!reason || reason.length > 200) throw new AppError('Invalid reason', 400);
    const report = await prisma.report.create({
      data: {
        reporterId,
        reason: reason.slice(0, 200),
        description: description?.slice(0, 1000) ?? null,
      },
    });
    return { id: report.id };
  }

  /** Anonymous report – no auth. Creates AnonymousReport. */
  async createAnonymous(data: { type: string; targetId?: string; reason: string; description?: string }): Promise<{ id: string }> {
    const { type, targetId, reason, description } = data;
    const validTypes = ['account', 'post', 'comment', 'story', 'problem'];
    if (!validTypes.includes(type)) throw new AppError('Invalid report type', 400);
    if (!reason || reason.length > 200) throw new AppError('Invalid reason', 400);
    if (type !== 'problem' && !targetId) throw new AppError('targetId required for this type', 400);

    const report = await prisma.anonymousReport.create({
      data: {
        type,
        targetId: targetId ?? null,
        reason: reason.slice(0, 200),
        description: description?.slice(0, 1000) ?? null,
      },
    });
    return { id: report.id };
  }
}
