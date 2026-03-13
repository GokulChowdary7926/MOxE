// backend/src/services/message.service.ts

import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { io } from '../server';

export class MessageService {
  /**
   * Send a direct message
   */
  async sendMessage(senderId: string, data: any) {
    const { recipientId, content, media, messageType, isVanish } = data;

    // Check if blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderId },
        ],
      },
    });

    if (blocked) {
      throw new AppError('Cannot send message to this user', 403);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        content,
        media: media || [],
        messageType,
        isVanish,
        vanishAt: isVanish ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        recipients: {
          create: {
            recipientId,
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Emit via socket
    io.to(`user:${recipientId}`).emit('new_message', message);

    // Create notification
    await prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type: 'MESSAGE',
        data: { messageId: message.id },
      },
    });

    return message;
  }

  /**
   * Send message to group
   */
  async sendGroupMessage(senderId: string, data: any) {
    const { groupId, content, media, messageType } = data;

    // Check if user is in group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_accountId: {
          groupId,
          accountId: senderId,
        },
      },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 403);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        content,
        media: media || [],
        messageType,
        groupId,
        isGroupMessage: true,
        recipients: {
          createMany: {
            data: [], // Will be handled separately
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { accountId: true },
    });

    // Create message recipients
    await prisma.messageRecipient.createMany({
      data: members
        .filter(m => m.accountId !== senderId)
        .map(m => ({
          messageId: message.id,
          recipientId: m.accountId,
        })),
    });

    // Emit to group
    members.forEach(member => {
      io.to(`user:${member.accountId}`).emit('new_group_message', {
        ...message,
        groupId,
      });
    });

    return message;
  }

  /**
   * Get conversations
   */
  async getConversations(accountId: string) {
    // Get all unique conversations
    const sentMessages = await prisma.message.findMany({
      where: { senderId: accountId, groupId: null },
      distinct: ['recipients'],
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await prisma.messageRecipient.findMany({
      where: { recipientId: accountId },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: { message: { createdAt: 'desc' } },
    });

    // Combine and deduplicate
    const conversations = new Map();

    sentMessages.forEach(msg => {
      msg.recipients.forEach(recipient => {
        const otherUserId = recipient.recipient.id;
        conversations.set(otherUserId, {
          user: recipient.recipient,
          lastMessage: msg,
          unreadCount: 0,
        });
      });
    });

    receivedMessages.forEach(rec => {
      const otherUserId = rec.message.sender.id;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: rec.message.sender,
          lastMessage: rec.message,
          unreadCount: rec.isRead ? 0 : 1,
        });
      } else {
        const conv = conversations.get(otherUserId);
        if (rec.message.createdAt > conv.lastMessage.createdAt) {
          conv.lastMessage = rec.message;
        }
        if (!rec.isRead) {
          conv.unreadCount++;
        }
      }
    });

    return Array.from(conversations.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }

  /**
   * Get conversation with specific user
   */
  async getConversation(accountId: string, otherUserId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: accountId, recipients: { some: { recipientId: otherUserId } } },
          { senderId: otherUserId, recipients: { some: { recipientId: accountId } } },
        ],
        groupId: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        recipients: true,
        reactions: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Mark as read
    await prisma.messageRecipient.updateMany({
      where: {
        recipientId: accountId,
        message: { senderId: otherUserId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return messages.reverse();
  }

  /**
   * Get group messages
   */
  async getGroupMessages(groupId: string, accountId: string, page: number = 1, limit: number = 50) {
    // Check if user is in group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_accountId: {
          groupId,
          accountId,
        },
      },
    });

    if (!member) {
      throw new AppError('You are not a member of this group', 403);
    }

    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        reactions: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Mark as read
    await prisma.messageRecipient.updateMany({
      where: {
        recipientId: accountId,
        message: { groupId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return messages.reverse();
  }

  /**
   * Create group
   */
  async createGroup(creatorId: string, data: any) {
    const { name, photo, memberIds } = data;

    const group = await prisma.group.create({
      data: {
        name,
        photo,
        createdBy: creatorId,
        members: {
          create: [
            { accountId: creatorId },
            ...memberIds.map((id: string) => ({ accountId: id })),
          ],
        },
        admins: {
          create: {
            accountId: creatorId,
          },
        },
      },
      include: {
        members: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });

    return group;
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, accountId: string, emoji: string) {
    const existing = await prisma.reaction.findUnique({
      where: {
        accountId_messageId: {
          accountId,
          messageId,
        },
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction if same emoji
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
        return { reacted: false };
      } else {
        // Update reaction
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
        return { reacted: true, emoji };
      }
    }

    await prisma.reaction.create({
      data: {
        accountId,
        messageId,
        emoji,
      },
    });

    return { reacted: true, emoji };
  }

  /**
   * Delete message (for everyone)
   */
  async deleteMessage(messageId: string, accountId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== accountId) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    // Check if within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.createdAt < oneHourAgo) {
      throw new AppError('Cannot delete messages older than 1 hour', 400);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  /**
   * Recall message (for everyone)
   */
  async recallMessage(messageId: string, accountId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== accountId) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    // Check if within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (message.createdAt < tenMinutesAgo) {
      throw new AppError('Cannot recall messages older than 10 minutes', 400);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'This message was recalled',
        messageType: 'RECALLED',
      },
    });

    return { success: true };
  }
}