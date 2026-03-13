import { io, Socket } from 'socket.io-client';

let dmSocket: Socket | null = null;

export function connectDmSocket(userId: string): Socket {
  if (dmSocket && dmSocket.connected) {
    return dmSocket;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';
  const base = apiBase.replace(/\/api$/, '');
  dmSocket = io(`${base}/dm`, {
    auth: { userId },
    transports: ['websocket'],
  });
  return dmSocket;
}

export function getDmSocket(): Socket | null {
  return dmSocket;
}

export function disconnectDmSocket() {
  if (dmSocket) {
    dmSocket.disconnect();
    dmSocket = null;
  }
}

