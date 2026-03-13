import { io, Socket } from 'socket.io-client';

let translateSocket: Socket | null = null;

export function getTranslateSocket(): Socket | null {
  return translateSocket && translateSocket.connected ? translateSocket : null;
}

export function connectTranslateSocket(token: string) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';
  const base = apiBase.replace(/\/api$/, '');
  if (translateSocket && translateSocket.connected) return translateSocket;
  translateSocket = io(`${base}/translate`, {
    auth: { token },
    transports: ['websocket'],
  });
  return translateSocket;
}

