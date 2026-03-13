import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(userId?: string) {
  if (socket && socket.connected) return;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';
  const base = apiBase.replace(/\/api$/, '');
  socket = io(base, {
    auth: userId ? { userId } : undefined,
    transports: ['websocket'],
  });
}

export function getSocket(): Socket | null {
  return socket && socket.connected ? socket : null;
}
