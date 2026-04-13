import { io, Socket } from 'socket.io-client';
import { getBackendOrigin } from './api';

let socket: Socket | null = null;
let liveSocket: Socket | null = null;
/** Prevents reusing a connection authenticated with a stale or placeholder id (e.g. before `/accounts/me`). */
let socketAuthKey = '';

export function initializeSocket(userId?: string, accountId?: string) {
  const base = getBackendOrigin();
  const nextKey = `${userId ?? ''}|${accountId ?? ''}`;
  if (!accountId) {
    // During auth bootstrap, accountId can be temporarily empty.
    // Avoid tearing down a healthy in-flight socket to prevent noisy
    // "WebSocket closed before connection is established" errors.
    const hasToken =
      typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
    if (!hasToken) {
      teardownMainSocket();
      socketAuthKey = '';
    }
    return;
  }
  if ((socket?.connected || socket?.active) && socketAuthKey === nextKey) return;
  teardownMainSocket();
  socketAuthKey = nextKey;
  const auth: { userId?: string; accountId?: string } = { accountId };
  if (userId) auth.userId = userId;
  socket = io(base, {
    auth,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

function teardownMainSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket && socket.connected ? socket : null;
}

/** Disconnect root real-time socket and clear auth key (logout/session loss). */
export function disconnectSocket(): void {
  teardownMainSocket();
  socketAuthKey = '';
}

/** Register accountId for real-time notifications (call when currentAccount is set). */
export function registerAccount(accountId: string): void {
  if (socket?.connected) socket.emit('register:account', { accountId });
}

/** Connect to /live namespace for real-time live rooms (camera, viewer count). */
export function connectLiveSocket(accountId?: string, userId?: string): Socket {
  if (liveSocket?.connected) return liveSocket;
  const base = getBackendOrigin();
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
