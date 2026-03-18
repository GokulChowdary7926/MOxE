/**
 * Data export for GDPR/CCPA compliance.
 * Aggregates account data into a structured JSON payload for "Download your data".
 * ALGORITHMS_AND_WORKFLOWS.md §17.
 */

import { prisma } from '../server';

export interface DataExportPayload {
  exportedAt: string; // ISO
  accountId: string;
  profile: Record<string, unknown>;
  posts: Array<{ id: string; caption: string | null; createdAt: string; mediaCount: number }>;
  follows: Array<{ id: string; direction: 'follower' | 'following'; username: string; createdAt: string }>;
  likes: Array<{ id: string; postId: string | null; commentId: string | null; reelId: string | null; createdAt: string }>;
  savedPosts: Array<{ postId: string; collectionId: string | null; savedAt: string }>;
  collections: Array<{ id: string; name: string; createdAt: string }>;
  comments: Array<{ id: string; postId: string | null; reelId: string | null; content: string; createdAt: string }>;
  messagesMetadata: Array<{ id: string; direction: 'sent' | 'received'; messageType: string; createdAt: string }>;
  notificationsMetadata: Array<{ id: string; type: string; read: boolean; createdAt: string }>;
}

export class DataExportService {
  async exportAccountData(accountId: string): Promise<DataExportPayload> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { user: { select: { id: true, phoneNumber: true, email: true, dateOfBirth: true, createdAt: true } } },
    });
    if (!account) throw new Error('Account not found');

    const [posts, followsAsFollower, followsAsFollowing, likes, savedPosts, collections, comments, messagesSent, messagesReceived, notifications] = await Promise.all([
      prisma.post.findMany({
        where: { accountId, isDeleted: false },
        select: { id: true, caption: true, createdAt: true, media: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.findMany({
        where: { followerId: accountId },
        include: { following: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.findMany({
        where: { followingId: accountId },
        include: { follower: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.like.findMany({
        where: { accountId },
        select: { id: true, postId: true, commentId: true, reelId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savedPost.findMany({
        where: { accountId },
        select: { postId: true, collectionId: true, savedAt: true },
        orderBy: { savedAt: 'desc' },
      }),
      prisma.collection.findMany({
        where: { accountId },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.findMany({
        where: { accountId },
        select: { id: true, postId: true, reelId: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.findMany({
        where: { senderId: accountId },
        select: { id: true, messageType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      prisma.messageRecipient.findMany({
        where: { recipientId: accountId },
        select: { message: { select: { id: true, messageType: true, createdAt: true } } },
        take: 10000,
      }),
      prisma.notification.findMany({
        where: { recipientId: accountId },
        select: { id: true, type: true, read: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
    ]);

    const profile: Record<string, unknown> = {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      accountType: account.accountType,
      subscriptionTier: account.subscriptionTier,
      bio: account.bio,
      profilePhoto: account.profilePhoto,
      isPrivate: account.isPrivate,
      createdAt: account.createdAt?.toISOString?.(),
      updatedAt: account.updatedAt?.toISOString?.(),
      user: account.user
        ? {
            id: account.user.id,
            phoneNumber: account.user.phoneNumber,
            email: account.user.email ?? null,
            dateOfBirth: account.user.dateOfBirth?.toISOString?.(),
            createdAt: account.user.createdAt?.toISOString?.(),
          }
        : null,
    };

    const messagesMetadata = [
      ...messagesSent.map((m) => ({
        id: m.id,
        direction: 'sent' as const,
        messageType: m.messageType,
        createdAt: m.createdAt.toISOString(),
      })),
      ...messagesReceived.map((r) => ({
        id: r.message.id,
        direction: 'received' as const,
        messageType: r.message.messageType,
        createdAt: r.message.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5000);

    return {
      exportedAt: new Date().toISOString(),
      accountId,
      profile,
      posts: posts.map((p) => ({
        id: p.id,
        caption: p.caption,
        createdAt: p.createdAt.toISOString(),
        mediaCount: Array.isArray(p.media) ? (p.media as unknown[]).length : 0,
      })),
      follows: [
        ...followsAsFollower.map((f) => ({
          id: f.id,
          direction: 'following' as const,
          username: f.following.username,
          createdAt: f.createdAt.toISOString(),
        })),
        ...followsAsFollowing.map((f) => ({
          id: f.id,
          direction: 'follower' as const,
          username: f.follower.username,
          createdAt: f.createdAt.toISOString(),
        })),
      ],
      likes: likes.map((l) => ({
        id: l.id,
        postId: l.postId,
        commentId: l.commentId,
        reelId: l.reelId,
        createdAt: l.createdAt.toISOString(),
      })),
      savedPosts: savedPosts.map((s) => ({
        postId: s.postId,
        collectionId: s.collectionId,
        savedAt: s.savedAt.toISOString(),
      })),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
      })),
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        reelId: c.reelId,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
      messagesMetadata,
      notificationsMetadata: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }
}
