// backend/src/sockets/index.ts

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  accountId?: string;
}

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      socket.userId = decoded.userId;
      socket.accountId = decoded.accountId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle typing indicators
    socket.on('typing', (data: { recipientId: string; isTyping: boolean }) => {
      socket.to(`user:${data.recipientId}`).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle read receipts
    socket.on('mark_read', async (data: { messageIds: string[] }) => {
      await prisma.messageRecipient.updateMany({
        where: {
          messageId: { in: data.messageIds },
          recipientId: socket.accountId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.to(`user:${socket.userId}`).emit('messages_read', {
        messageIds: data.messageIds,
        readerId: socket.userId,
      });
    });

    // Handle joining live stream
    socket.on('join_live', async (data: { liveId: string }) => {
      socket.join(`live:${data.liveId}`);
      
      await prisma.liveViewer.create({
        data: {
          liveId: data.liveId,
          viewerId: socket.accountId!,
        },
      });

      // Update viewer count
      const count = await prisma.liveViewer.count({
        where: { liveId: data.liveId, leftAt: null },
      });

      io.to(`live:${data.liveId}`).emit('viewer_count', { count });
    });

    // Handle leaving live stream
    socket.on('leave_live', async (data: { liveId: string }) => {
      socket.leave(`live:${data.liveId}`);

      await prisma.liveViewer.updateMany({
        where: {
          liveId: data.liveId,
          viewerId: socket.accountId,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });

      const count = await prisma.liveViewer.count({
        where: { liveId: data.liveId, leftAt: null },
      });

      io.to(`live:${data.liveId}`).emit('viewer_count', { count });
    });

    // Handle live comments
    socket.on('live_comment', async (data: { liveId: string; message: string }) => {
      const comment = await prisma.liveComment.create({
        data: {
          liveId: data.liveId,
          commenterId: socket.accountId!,
          message: data.message,
        },
        include: {
          commenter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profilePhoto: true,
            },
          },
        },
      });

      io.to(`live:${data.liveId}`).emit('new_comment', comment);
    });

    // Handle live badges
    socket.on('purchase_badge', async (data: { liveId: string; tier: string }) => {
      // This would integrate with payment system
      // For now, just emit event
      io.to(`live:${data.liveId}`).emit('badge_purchased', {
        userId: socket.userId,
        tier: data.tier,
      });
    });

    // Handle location sharing (for Hangout Mode)
    socket.on('share_location', (data: { hangoutId: string; lat: number; lng: number }) => {
      // Only share with emergency contacts
      socket.to(`hangout:${data.hangoutId}`).emit('location_update', {
        userId: socket.userId,
        lat: data.lat,
        lng: data.lng,
      });
    });

    // Handle SOS alert
    socket.on('sos_alert', async (data: { hangoutId: string }) => {
      const hangout = await prisma.hangoutSession.findUnique({
        where: { id: data.hangoutId },
        include: {
          account: {
            include: {
              emergencyContacts: {
                include: {
                  contact: true,
                },
              },
            },
          },
        },
      });

      if (hangout) {
        hangout.account.emergencyContacts.forEach(contact => {
          io.to(`user:${contact.contact.id}`).emit('sos_alert', {
            userId: hangout.accountId,
            hangoutId: data.hangoutId,
            timestamp: new Date(),
          });
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.leave(`user:${socket.userId}`);
    });
  });
}