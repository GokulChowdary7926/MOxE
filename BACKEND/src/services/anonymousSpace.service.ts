/**
 * Anonymous Discussion Spaces: list spaces, create post, vote, report.
 * Authors are stored for moderation but never returned to clients.
 */
import { prisma } from '../server';
import { AppError } from '../utils/AppError';

const CONTENT_MAX = 2000;

export class AnonymousSpaceService {
  async listSpaces(accountId: string) {
    const spaces = await prisma.anonymousSpace.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { posts: true } },
      },
    });
    return spaces.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isPublic: s.isPublic,
      postCount: s._count.posts,
      createdAt: s.createdAt,
    }));
  }

  async createSpace(accountId: string, data: { name: string; description?: string; isPublic?: boolean }) {
    const name = (data.name || 'Space').trim().slice(0, 100);
    return prisma.anonymousSpace.create({
      data: {
        name,
        description: data.description?.trim().slice(0, 500) ?? null,
        isPublic: data.isPublic ?? true,
        createdById: accountId,
      },
    });
  }

  async getSpace(spaceId: string) {
    const space = await prisma.anonymousSpace.findFirst({
      where: { id: spaceId, isPublic: true },
      include: { _count: { select: { posts: true } } },
    });
    if (!space) throw new AppError('Space not found', 404);
    return {
      id: space.id,
      name: space.name,
      description: space.description,
      isPublic: space.isPublic,
      postCount: space._count.posts,
      createdAt: space.createdAt,
    };
  }

  async listPosts(spaceId: string, accountId: string, cursor?: string, limit = 20) {
    const space = await prisma.anonymousSpace.findFirst({
      where: { id: spaceId, isPublic: true },
    });
    if (!space) throw new AppError('Space not found', 404);

    const posts = await prisma.anonymousPost.findMany({
      where: { spaceId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        votes: { where: { accountId }, select: { direction: true } },
        _count: { select: { votes: true } },
      },
    });

    const hasMore = posts.length > limit;
    const list = hasMore ? posts.slice(0, limit) : posts;

    const scoreByPost = await prisma.anonymousVote.groupBy({
      by: ['postId'],
      where: { postId: { in: list.map((p) => p.id) } },
      _sum: { direction: true },
    });
    const scoreMap = new Map(scoreByPost.map((s) => [s.postId, s._sum.direction ?? 0]));

    return {
      posts: list.map((p) => ({
        id: p.id,
        content: p.content,
        mediaUrl: p.mediaUrl,
        createdAt: p.createdAt,
        score: scoreMap.get(p.id) ?? 0,
        voteCount: p._count.votes,
        myVote: p.votes[0]?.direction ?? null,
      })),
      nextCursor: hasMore ? list[list.length - 1].id : null,
    };
  }

  async createPost(accountId: string, spaceId: string, data: { content: string; mediaUrl?: string }) {
    const space = await prisma.anonymousSpace.findFirst({
      where: { id: spaceId, isPublic: true },
    });
    if (!space) throw new AppError('Space not found', 404);
    const content = (data.content || '').trim().slice(0, CONTENT_MAX);
    if (!content) throw new AppError('Content is required', 400);

    const post = await prisma.anonymousPost.create({
      data: {
        spaceId,
        accountId,
        content,
        mediaUrl: data.mediaUrl?.trim() || null,
      },
    });
    await prisma.anonymousSpace.update({
      where: { id: spaceId },
      data: { updatedAt: new Date() },
    });
    return {
      id: post.id,
      content: post.content,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      score: 0,
      voteCount: 0,
      myVote: null,
    };
  }

  async vote(accountId: string, postId: string, direction: 1 | -1) {
    const post = await prisma.anonymousPost.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);

    await prisma.anonymousVote.upsert({
      where: {
        postId_accountId: { postId, accountId },
      },
      create: { postId, accountId, direction },
      update: { direction },
    });
    const sum = await prisma.anonymousVote.aggregate({
      where: { postId },
      _sum: { direction: true },
    });
    const my = await prisma.anonymousVote.findUnique({
      where: { postId_accountId: { postId, accountId } },
    });
    return {
      score: sum._sum.direction ?? 0,
      myVote: my?.direction ?? null,
    };
  }

  async removeVote(accountId: string, postId: string) {
    await prisma.anonymousVote.deleteMany({
      where: { postId, accountId },
    });
    const sum = await prisma.anonymousVote.aggregate({
      where: { postId },
      _sum: { direction: true },
    });
    return { score: sum._sum.direction ?? 0, myVote: null };
  }

  async reportPost(accountId: string, postId: string, reason: string) {
    const post = await prisma.anonymousPost.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    await prisma.report.create({
      data: {
        reporterId: accountId,
        reportedAnonymousPostId: postId,
        reason: (reason || 'Anonymous post').trim().slice(0, 200),
      },
    });
    return { ok: true };
  }

  async listComments(postId: string) {
    const post = await prisma.anonymousPost.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    const comments = await prisma.anonymousComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
    }));
  }

  async addComment(accountId: string, postId: string, content: string, parentId?: string) {
    const post = await prisma.anonymousPost.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    const text = (content || '').trim().slice(0, 1000);
    if (!text) throw new AppError('Content is required', 400);
    const comment = await prisma.anonymousComment.create({
      data: {
        postId,
        accountId,
        content: text,
        parentId: parentId?.trim() || null,
      },
    });
    return {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    };
  }
}
