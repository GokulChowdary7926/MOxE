import { Server } from 'socket.io';
import { setupTranslateNamespace } from './translate';

let ioRef: Server | null = null;

export function setupSocketHandlers(io: Server) {
  ioRef = io;

  // Root namespace – used for generic events (e.g. translation, story stickers).
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });

  setupTranslateNamespace(io);

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
