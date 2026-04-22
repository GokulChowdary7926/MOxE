import { Server } from 'socket.io';
import { setupTranslateNamespace } from './translate';
import { LocationService } from '../services/location.service';
import { AppError } from '../utils/AppError';
import { NEARBY_HISTORY_MAX, NEARBY_HISTORY_TTL_MS } from './nearbyHistory';
import { normalizeStoredMediaUrl } from '../utils/mediaUrl';

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
const nearbyRecentMessageByAccount = new Map<string, { fingerprint: string; at: number }>();
const nearbyLocationLastAtBySocket = new Map<string, number>();
const dmTypingLastAtBySocket = new Map<string, number>();

/** All clients viewing Nearby messaging join this room so broadcasts reach them even before first GPS fix. */
const NEARBY_FEED_ROOM = 'nearby:feed';
const NEARBY_DEDUP_WINDOW_MS = 1200;
const NEARBY_DEDUP_RETENTION_MS = 5 * 60 * 1000;
const NEARBY_DEDUP_MAX_ENTRIES = 5000;
const NEARBY_LOCATION_THROTTLE_MS = 800;
const DM_TYPING_THROTTLE_MS = 400;
const NEARBY_MAX_TEXT_LENGTH = 1200;
const NEARBY_MAX_IMAGE_URL_LENGTH = 2048;

async function normalizeNearbyPayloadImage(payload: unknown): Promise<unknown> {
  if (!payload || typeof payload !== 'object') return payload;
  const source = payload as Record<string, unknown>;
  const raw = typeof source.imageUrl === 'string' ? source.imageUrl.trim() : '';
  if (!raw) return payload;
  const imageUrl = await normalizeStoredMediaUrl(raw);
  return { ...source, imageUrl: imageUrl || raw };
}

function pruneNearbyDedupMap(now = Date.now()): void {
  for (const [accountId, entry] of nearbyRecentMessageByAccount.entries()) {
    if (now - entry.at > NEARBY_DEDUP_RETENTION_MS) {
      nearbyRecentMessageByAccount.delete(accountId);
    }
  }

  // Hard cap as a final safeguard in case of unusual account churn.
  if (nearbyRecentMessageByAccount.size <= NEARBY_DEDUP_MAX_ENTRIES) return;
  const sorted = Array.from(nearbyRecentMessageByAccount.entries()).sort((a, b) => a[1].at - b[1].at);
  const toDelete = nearbyRecentMessageByAccount.size - NEARBY_DEDUP_MAX_ENTRIES;
  for (let i = 0; i < toDelete; i++) {
    nearbyRecentMessageByAccount.delete(sorted[i][0]);
  }
}

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

type PrismaLike = {
  account: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  nearbyFeedMessage?: {
    findMany: (args: any) => Promise<Array<{ payload: unknown }>>;
    create: (args: any) => Promise<unknown>;
  };
};

/** Best-effort rollback of daily nearby usage if message row failed to persist (keeps limits consistent). */
async function revertNearbyMessagingUsage(
  prisma: PrismaLike | undefined,
  accountId: string,
  kind: 'text' | 'media',
): Promise<void> {
  if (!prisma?.account?.findUnique || !prisma.account.update) return;
  const acc = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      nearbyPostCountToday: true,
      nearbyTextMessageCountToday: true,
      nearbyPostResetAt: true,
    },
  });
  if (!acc) return;
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const needReset = !acc.nearbyPostResetAt || acc.nearbyPostResetAt < midnight;
  if (needReset) return;
  if (kind === 'text') {
    const cur = acc.nearbyTextMessageCountToday ?? 0;
    if (cur <= 0) return;
    await prisma.account.update({
      where: { id: accountId },
      data: { nearbyTextMessageCountToday: cur - 1 },
    });
  } else {
    const cur = acc.nearbyPostCountToday ?? 0;
    if (cur <= 0) return;
    await prisma.account.update({
      where: { id: accountId },
      data: { nearbyPostCountToday: cur - 1 },
    });
  }
}

const locationService = new LocationService();

export function setupSocketHandlers(io: Server, prismaInstance?: PrismaLike) {
  ioRef = io;
  const getPrisma = () => prismaInstance ?? (global as any).__MOXE_PRISMA__;
  const isActiveAccount = async (id?: string | null): Promise<boolean> => {
    if (!id) return false;
    const prisma = getPrisma();
    if (!prisma) return false;
    try {
      const account = await prisma.account.findUnique({
        where: { id },
        select: { id: true, isActive: true },
      });
      return !!account?.id && account?.isActive !== false;
    } catch {
      return false;
    }
  };
  const dedupPruneTimer = setInterval(() => {
    pruneNearbyDedupMap();
  }, 60 * 1000);
  dedupPruneTimer.unref();

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

    socket.on('nearby:join', async () => {
      await socket.join(NEARBY_FEED_ROOM);
      const prisma = getPrisma();
      const nf = prisma?.nearbyFeedMessage;
      if (nf?.findMany) {
        try {
          const since = new Date(Date.now() - NEARBY_HISTORY_TTL_MS);
          const rows = await nf.findMany({
            where: { createdAt: { gte: since } },
            orderBy: { createdAt: 'asc' },
            take: NEARBY_HISTORY_MAX,
            select: { payload: true },
          });
          const messages = await Promise.all(rows.map((r: { payload: unknown }) => normalizeNearbyPayloadImage(r.payload)));
          if (messages.length > 0) {
            socket.emit('nearby:history', { messages });
          }
        } catch (e) {
          console.error('nearby:history load failed', e);
        }
      }
    });
    socket.on('nearby:leave', async () => {
      await socket.leave(NEARBY_FEED_ROOM);
    });

    socket.on('nearby:location', (payload: { latitude?: number; longitude?: number }) => {
      const now = Date.now();
      const lastLocationAt = nearbyLocationLastAtBySocket.get(socket.id) ?? 0;
      if (now - lastLocationAt < NEARBY_LOCATION_THROTTLE_MS) return;
      nearbyLocationLastAtBySocket.set(socket.id, now);
      const { latitude, longitude } = payload || {};
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
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
      const text = (payload?.text ?? '').toString().trim().slice(0, NEARBY_MAX_TEXT_LENGTH);
      const rawImageUrl =
        typeof payload?.imageUrl === 'string' && payload.imageUrl ? payload.imageUrl.trim() : undefined;
      const imageUrl =
        rawImageUrl && rawImageUrl.length <= NEARBY_MAX_IMAGE_URL_LENGTH ? rawImageUrl : undefined;
      if (!text && !imageUrl) return;

      const sender = nearbyClients.get(socket.id);
      const radiusKm = 5;
      const accountIdToBill = sender?.accountId ?? accountId;

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
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        text: text || (imageUrl ? '[Photo]' : ''),
        imageUrl: imageUrl || undefined,
        from: {
          userId: sender?.userId ?? userId ?? null,
          accountId: payload.anonymous ? null : accountIdToBill,
          latitude: sender?.latitude ?? 0,
          longitude: sender?.longitude ?? 0,
          username: fromUsername,
          displayName: fromDisplayName,
        },
        sentAt: new Date().toISOString(),
      };

      if (!accountIdToBill) {
        socket.emit('nearby:message:error', { code: 'AUTH', message: 'Sign in to post to Nearby.' });
        return;
      }

      // Server-side idempotency for rapid duplicate sends from same account.
      // Prevents accidental double posts due to retries/taps/reconnect races.
      const fingerprint = `${(text || '').toLowerCase()}|${imageUrl || ''}|${payload?.anonymous ? '1' : '0'}`;
      const now = Date.now();
      pruneNearbyDedupMap(now);
      const previous = nearbyRecentMessageByAccount.get(accountIdToBill);
      if (
        previous &&
        previous.fingerprint === fingerprint &&
        now - previous.at <= NEARBY_DEDUP_WINDOW_MS
      ) {
        return;
      }
      nearbyRecentMessageByAccount.set(accountIdToBill, { fingerprint, at: now });

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

      const prisma = getPrisma();
      const nf = prisma?.nearbyFeedMessage;
      if (nf?.create) {
        try {
          await nf.create({
            data: {
              messageId: messagePayload.messageId,
              accountId: accountIdToBill,
              payload: messagePayload,
            },
          });
        } catch (persistErr) {
          console.error('nearbyFeedMessage persist failed', persistErr);
          await revertNearbyMessagingUsage(prisma as PrismaLike, accountIdToBill, kind);
          socket.emit('nearby:message:error', {
            code: 'PERSIST',
            message: 'Could not save your message. Please try again.',
            status: 503,
          });
          return;
        }
      }

      // Deliver to everyone in the Nearby feed room (must have emitted nearby:join on the client).
      // If sender has GPS: only deliver to peers within radiusKm, OR peers who haven't sent coords yet
      // (so they still see posts while permission/GPS loads). Previously we only iterated nearbyClients,
      // so users who hadn't emitted nearby:location yet never received anything.
      const senderLoc = sender
        ? { latitude: sender.latitude, longitude: sender.longitude }
        : null;
      const socketsInRoom = await io.in(NEARBY_FEED_ROOM).fetchSockets();
      const outboundPayload = await normalizeNearbyPayloadImage(messagePayload);
      for (const s of socketsInRoom) {
        if (!senderLoc) {
          s.emit('nearby:message', outboundPayload);
          continue;
        }
        const target = nearbyClients.get(s.id);
        if (!target) {
          s.emit('nearby:message', outboundPayload);
          continue;
        }
        const distanceKm = haversineKm(senderLoc, target);
        if (!Number.isNaN(distanceKm) && distanceKm <= radiusKm) {
          s.emit('nearby:message', outboundPayload);
        }
      }
    });

    socket.on('disconnect', () => {
      nearbyClients.delete(socket.id);
      nearbyLocationLastAtBySocket.delete(socket.id);
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
    void (async () => {
      const ok = await isActiveAccount(accountId);
      if (!ok) socket.disconnect(true);
    })();

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

    // WebRTC signaling (viewer ↔ broadcaster). Payloads are JSON-serialized SDP/ICE from the browser.
    socket.on('live:webrtc-request', (payload: { liveId?: string }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      if (!liveId) return;
      const room = liveRooms.get(liveId);
      if (!room || socket.id === room.broadcasterSocketId) return;
      liveNs.to(room.broadcasterSocketId).emit('live:webrtc-request', { liveId, viewerSocketId: socket.id });
    });

    socket.on(
      'live:webrtc-offer',
      (payload: { liveId?: string; viewerSocketId?: string; sdp?: { type?: string; sdp?: string } }) => {
        const liveId = (payload?.liveId ?? '').toString().trim();
        const viewerSocketId = (payload?.viewerSocketId ?? '').toString().trim();
        const sdp = payload?.sdp;
        if (!liveId || !viewerSocketId || !sdp?.sdp || !sdp?.type) return;
        const room = liveRooms.get(liveId);
        if (!room || room.broadcasterSocketId !== socket.id) return;
        liveNs.to(viewerSocketId).emit('live:webrtc-offer', { liveId, sdp: { type: sdp.type, sdp: sdp.sdp } });
      },
    );

    socket.on('live:webrtc-answer', (payload: { liveId?: string; sdp?: { type?: string; sdp?: string } }) => {
      const liveId = (payload?.liveId ?? '').toString().trim();
      const sdp = payload?.sdp;
      if (!liveId || !sdp?.sdp || !sdp?.type) return;
      const room = liveRooms.get(liveId);
      if (!room || socket.id === room.broadcasterSocketId) return;
      liveNs.to(room.broadcasterSocketId).emit('live:webrtc-answer', {
        liveId,
        sdp: { type: sdp.type, sdp: sdp.sdp },
        viewerSocketId: socket.id,
      });
    });

    socket.on(
      'live:webrtc-ice',
      (payload: {
        liveId?: string;
        toSocketId?: string;
        candidate?: { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
      }) => {
        const liveId = (payload?.liveId ?? '').toString().trim();
        if (!liveId || payload.candidate == null) return;
        const room = liveRooms.get(liveId);
        if (!room) return;
        if (socket.id === room.broadcasterSocketId) {
          const toSocketId = (payload.toSocketId ?? '').toString().trim();
          if (!toSocketId) return;
          liveNs.to(toSocketId).emit('live:webrtc-ice', { liveId, candidate: payload.candidate });
        } else {
          liveNs.to(room.broadcasterSocketId).emit('live:webrtc-ice', {
            liveId,
            candidate: payload.candidate,
            viewerSocketId: socket.id,
          });
        }
      },
    );

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
    if (!userId) return socket.disconnect(true);
    let authorized = false;
    void (async () => {
      const ok = await isActiveAccount(userId);
      if (!ok) return socket.disconnect(true);
      authorized = true;
      socket.join(userId);
      console.log('DM client connected', userId, socket.id);
    })();

    socket.on('typing', (payload: { to?: string }) => {
      if (!authorized) return;
      const now = Date.now();
      const lastTypingAt = dmTypingLastAtBySocket.get(socket.id) ?? 0;
      if (now - lastTypingAt < DM_TYPING_THROTTLE_MS) return;
      dmTypingLastAtBySocket.set(socket.id, now);
      if (!payload?.to || typeof payload.to !== 'string' || payload.to.length > 128) return;
      dm.to(payload.to).emit('typing', { from: userId });
    });

    socket.on('disconnect', () => {
      dmTypingLastAtBySocket.delete(socket.id);
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
export function emitPostUpdated(
  postId: string,
  payload: {
    likeCount?: number;
    commentCount?: number;
    comment?: object;
    allowComments?: boolean;
    hideLikeCount?: boolean;
  },
): void {
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

/** Broadcast to everyone in Socket.IO `/live` room `live:${liveId}` (Q&A, moderators, etc.). */
export function emitLiveRoomEvent(liveId: string, event: string, payload: object): void {
  if (!ioRef) return;
  ioRef.of('/live').to(`live:${liveId}`).emit(event, payload);
}
