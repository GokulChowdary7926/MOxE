import { io, Socket } from 'socket.io-client';
import { getBackendOrigin } from './api';

let dmSocket: Socket | null = null;
let dmSocketUserId: string | null = null;

export function connectDmSocket(userId: string): Socket {
  if (dmSocket && dmSocket.connected && dmSocketUserId === userId) {
    return dmSocket;
  }
  if (dmSocket && dmSocketUserId !== userId) {
    dmSocket.removeAllListeners();
    dmSocket.disconnect();
    dmSocket = null;
  }
  const base = getBackendOrigin();
  dmSocket = io(`${base}/dm`, {
    auth: { userId },
    transports: ['websocket', 'polling'],
  });
  dmSocketUserId = userId;
  return dmSocket;
}

export function getDmSocket(): Socket | null {
  return dmSocket;
}

export function disconnectDmSocket() {
  if (dmSocket) {
    dmSocket.removeAllListeners();
    dmSocket.disconnect();
    dmSocket = null;
  }
  dmSocketUserId = null;
}

