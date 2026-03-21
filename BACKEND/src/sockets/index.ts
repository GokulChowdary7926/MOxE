import { Server } from 'socket.io';
import { setupTranslateNamespace } from './translate';
import { LocationService } from '../services/location.service';
import { AppError } from '../utils/AppError';

let ioRef: Server | null = null;

type NearbyClient = {
  socketId: string;
  userId?: string;
  accountId?: string;
  latitude: number;
  longitude: number;
  updatedAt: number;
};

const nearbyClients = new Map<string, NearbyClient>();

/** All clients viewing Nearby messaging join this room so broadcasts reach them even before first GPS fix. */
const NEARBY_FEED_ROOM = 'nearby:feed';

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

type PrismaLike = { account: { findUnique: (args: any) => Promise<any> } };

const locationService = new LocationService();

export function setupSocketHandlers(io: Server, prismaInstance?: PrismaLike) {
  ioRef = io;
  const getPrisma = () => prismaInstance ?? (global as any).__MOXE_PRISMA__;

  // Root namespace – used for generic events (e.g. translation, story stickers, nearby messaging, notifications).
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    const userId = socket.handshake.auth?.userId as string | undefined;
    const accountId = socket.handshake.auth?.accountId as string | undefined;
    if (accountId) socket.join(`account:${accountId}`);

    socket.on('register:account', (payload: { accountId?: string }) => {
      const id = payload?.accountId;
      if (id && typeof id === 'string') socket.join(`account:${id}`);
    });

    socket.on('nearby:location', (payload: { latitude?: number; longitude?: number }) => {
      const { latitude, longitude } = payload || {};
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
      const updated: NearbyClient = {
        socketId: socket.id,
        userId,
        accountId,
        latitude,
        longitude,
        updatedAt: Date.now(),
      };
      nearbyClients.set(socket.id, updated);

      // Send a lightweight list of nearby users back to this client.
      const radiusKm = 5;
      const here = { latitude, longitude };
      const users = Array.from(nearbyClients.values())
        .filter((c) => c.socketId !== socket.id)
        .map((c) => {
          const distanceKm = haversineKm(here, c);
          if (Number.isNaN(distanceKm) || distanceKm > radiusKm) return null;
          return {
            latitude: c.latitude,
            longitude: c.longitude,
            distanceKm,
          };
        })
        .filter(Boolean);

      socket.emit('nearby:users', { users });
    });

    socket.on('nearby:message', async (payload: { text?: string; imageUrl?: string; anonymous?: boolean }) => {
      const text = (payload?.text ?? '').toString().trim();
      const imageUrl = typeof payload?.imageUrl === 'string' && payload.imageUrl ? payload.imageUrl : undefined;
      if (!text && !imageUrl) return;

      const sender = nearbyClients.get(socket.id);
      const radiusKm = 5;

      let fromUsername: string | null = null;
      let fromDisplayName: string | null = null;
      if (payload.anonymous) {
        fromDisplayName = 'Anonymous';
        fromUsername = 'anonymous';
      } else {
        const accountIdToUse = sender?.accountId ?? accountId;
        if (accountIdToUse) {
          try {
            const prisma = getPrisma();
            const account = prisma ? await prisma.account.findUnique({
              where: { id: accountIdToUse },
              select: { username: true, displayName: true },
            }) : null;
            if (account) {
              fromUsername = account.username;
              fromDisplayName = account.displayName || account.username;
            } else {
              fromDisplayName = 'Anonymous';
              fromUsername = 'anonymous';
            }
          } catch {
            fromDisplayName = 'Anonymous';
            fromUsername = 'anonymous';
          }
        } else {
          fromDisplayName = 'Anonymous';
          fromUsername = 'anonymous';
        }
      }

      const messagePayload = {
        text: text || (imageUrl ? '[Photo]' : ''),
        imageUrl: imageUrl || undefined,
        from: {
          userId: sender?.userId ?? userId ?? null,
          latitude: sender?.latitude ?? 0,
          longitude: sender?.longitude ?? 0,
          username: fromUsername,
          displayName: fromDisplayName,
        },
        sentAt: new Date().toISOString(),
      };

      const accountIdToBill = sender?.accountId ?? accountId;
      if (!accountIdToBill) {
        socket.emit('nearby:message:error', { code: 'AUTH', message: 'Sign in to post to Nearby.' });
        return;
      }
      const kind: 'text' | 'media' = imageUrl ? 'media' : 'text';
      try {
        await locationService.recordNearbyMessaging(accountIdToBill, kind);
        const usage = await locationService.getNearbyPostUsage(accountIdToBill);
        socket.emit('nearby:usage', usage);
      } catch (err: unknown) {
        const msg =
          err instanceof AppError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Daily limit reached';
        const status = err instanceof AppError ? err.statusCode : 429;
        socket.emit('nearby:message:error', { code: 'LIMIT', message: msg, status });
        return;
      }

      // Deliver to everyone in the Nearby feed room (must have emitted nearby:join on the client).
      // If sender has GPS: only deliver to peers within radiusKm, OR peers who haven't sent coords yet
      // (so they still see posts while permission/GPS loads). Previously we only iterated nearbyClients,
      // so users who hadn't emitted nearby:location yet never received anything.
      const senderLoc = sender
        ? { latitude: sender.latitude, longitude: sender.longitude }
        : null;
      const socketsInRoom = await io.in(NEARBY_FEED_ROOM).fetchSockets();
      for (const s of socketsInRoom) {
        if (!senderLoc) {
          s.emit('nearby:message', messagePayload);
          continue;
        }
        const target = nearbyClients.get(s.id);
        if (!target) {
          s.emit('nearby:message', messagePayload);
          continue;
        }
        const distanceKm = haversineKm(senderLoc, target);
        if (!Number.isNaN(distanceKm) && distanceKm <= radiusKm) {
          s.emit('nearby:message', messagePayload);
        }
      }
    });

    socket.on('disconnect', () => {
      nearbyClients.delete(socket.id);
      console.log('Client disconnected:', socket.id);
    });
  });

  setupTranslateNamespace(io);

  // Live rooms: real-time camera / live stories. Room = live:${liveId}.
  type LiveRoom = {
    liveId: string;
    broadcasterSocketId: string;
    accountId: string;
    viewerSocketIds: Set<string>;
  };
  const liveRooms = new Map<string, LiveRoom>();

  function emitViewerCount(nsp: ReturnType<Server['of']>, roomId: string, room: LiveRoom) {
    const count = room.viewerSocketIds.size;
    nsp.to(roomId).emit('live:viewer-count', { liveId: room.liveId, count });
  }

  const liveNs = io.of('/live');
  liveNs.on('connection', (socket) => {
    const accountId = (socket.handshake.auth?.accountId ?? socket.handshake.auth?.userId) as string | undefined;

    socket.on('live:start', (payload: { liveId?: string }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      if (!liveId || !accountId) return;
      if (liveRooms.has(liveId)) return; // already started
      const roomId = `live:${liveId}`;
      socket.join(roomId);
      const room: LiveRoom = {
        liveId,
        broadcasterSocketId: socket.id,
        accountId,
        viewerSocketIds: new Set(),
      };
      liveRooms.set(liveId, room);
      emitViewerCount(liveNs, roomId, room);
    });

    socket.on('live:join', (payload: { liveId?: string }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      if (!liveId) return;
      const room = liveRooms.get(liveId);
      if (!room) {
        socket.emit('live:ended', { liveId });
        return;
      }
      const roomId = `live:${liveId}`;
      socket.join(roomId);
      room.viewerSocketIds.add(socket.id);
      emitViewerCount(liveNs, roomId, room);
    });

    socket.on('live:leave', (payload: { liveId?: string }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      if (!liveId) return;
      const room = liveRooms.get(liveId);
      if (room) {
        room.viewerSocketIds.delete(socket.id);
        const roomId = `live:${liveId}`;
        emitViewerCount(liveNs, roomId, room);
      }
      socket.leave(`live:${liveId}`);
    });

    socket.on('live:end', (payload: { liveId?: string }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      if (!liveId || !accountId) return;
      const room = liveRooms.get(liveId);
      if (!room || room.broadcasterSocketId !== socket.id) return;
      const roomId = `live:${liveId}`;
      liveNs.to(roomId).emit('live:ended', { liveId });
      liveRooms.delete(liveId);
    });

    socket.on('disconnect', () => {
      for (const [liveId, room] of liveRooms.entries()) {
        if (room.broadcasterSocketId === socket.id) {
          const roomId = `live:${liveId}`;
          liveNs.to(roomId).emit('live:ended', { liveId });
          liveRooms.delete(liveId);
          break;
        }
        if (room.viewerSocketIds.has(socket.id)) {
          room.viewerSocketIds.delete(socket.id);
          emitViewerCount(liveNs, `live:${liveId}`, room);
          break;
        }
      }
    });
  });

  // Direct messages namespace: /dm
  const dm = io.of('/dm');
  dm.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    socket.join(userId);
    console.log('DM client connected', userId, socket.id);

    socket.on('typing', (payload: { to?: string }) => {
      if (!payload?.to) return;
      dm.to(payload.to).emit('typing', { from: userId });
    });

    socket.on('disconnect', () => {
      console.log('DM client disconnected', userId, socket.id);
    });
  });
}

export function getIo(): Server | null {
  return ioRef;
}

/** Emit a new notification to the recipient's connected clients (real-time). */
export function emitNotification(accountId: string, payload: object): void {
  if (ioRef) ioRef.to(`account:${accountId}`).emit('notification', payload);
}

/** Broadcast that a new post was created so feed clients can refetch. */
export function emitFeedNewPost(): void {
  if (ioRef) ioRef.emit('feed:new-post', {});
}

/** Broadcast post like/comment updates so PostDetail and FeedPost can update in real time. */
export function emitPostUpdated(postId: string, payload: { likeCount?: number; commentCount?: number; comment?: object }): void {
  if (ioRef) ioRef.emit('post:updated', { postId, ...payload });
}

/** Broadcast that a new story was posted so story strips can refetch. */
export function emitStoriesNew(): void {
  if (ioRef) ioRef.emit('stories:new', {});
}

/** Broadcast note created event. */
export function emitNoteCreated(payload: object): void {
  if (ioRef) ioRef.emit('note:created', payload);
}

/** Broadcast note deleted event. */
export function emitNoteDeleted(noteId: string): void {
  if (ioRef) ioRef.emit('note:deleted', { noteId });
}

/** Broadcast notes refresh event (expiry/scheduled transitions). */
export function emitNotesRefresh(): void {
  if (ioRef) ioRef.emit('note:refresh', {});
}
