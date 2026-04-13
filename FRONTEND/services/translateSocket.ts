import { io, Socket } from 'socket.io-client';
import { getBackendOrigin } from './api';

let translateSocket: Socket | null = null;

export function getTranslateSocket(): Socket | null {
  return translateSocket && translateSocket.connected ? translateSocket : null;
}

export function connectTranslateSocket(token: string) {
  const base = getBackendOrigin();
  if (translateSocket && translateSocket.connected) return translateSocket;
  translateSocket = io(`${base}/translate`, {
    auth: { token },
    transports: ['websocket'],
  });
  return translateSocket;
}

