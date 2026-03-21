import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let liveSocket: Socket | null = null;

export function initializeSocket(userId?: string, accountId?: string) {
  if (socket && socket.connected) return;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';
  const base = apiBase.replace(/\/api$/, '');
  const auth: { userId?: string; accountId?: string } = {};
  if (userId) auth.userId = userId;
  if (accountId) auth.accountId = accountId;
  socket = io(base, {
    auth: Object.keys(auth).length ? auth : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export function getSocket(): Socket | null {
  return socket && socket.connected ? socket : null;
}

/** Register accountId for real-time notifications (call when currentAccount is set). */
export function registerAccount(accountId: string): void {
  if (socket?.connected) socket.emit('register:account', { accountId });
}

/** Connect to /live namespace for real-time live rooms (camera, viewer count). */
export function connectLiveSocket(accountId?: string, userId?: string): Socket {
  if (liveSocket?.connected) return liveSocket;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';
  const base = apiBase.replace(/\/api$/, '');
  liveSocket = io(`${base}/live`, {
    auth: { accountId: accountId ?? userId, userId: userId ?? accountId },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });
  return liveSocket;
}

export function getLiveSocket(): Socket | null {
  return liveSocket?.connected ? liveSocket : null;
}

export function disconnectLiveSocket(): void {
  if (liveSocket) {
    liveSocket.removeAllListeners();
    liveSocket.disconnect();
    liveSocket = null;
  }
}
