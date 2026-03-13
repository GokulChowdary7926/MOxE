import { Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getSessionForSocket, processAudioChunk } from '../services/translation.service';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface AuthPayload {
  userId: string;
  accountId?: string;
}

export function setupTranslateNamespace(io: import('socket.io').Server): void {
  const translateNs = io.of('/translate');

  translateNs.use((socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string })?.token ||
      (socket.handshake.query as { token?: string })?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      (socket as any).accountId = decoded.accountId || decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  translateNs.on('connection', (socket) => {
    const accountId = (socket as any).accountId as string;
    let sessionId: string | null = null;
    let sessionMeta: {
      sourceLang: string;
      targetLang: string;
      synthesizeSpeech: boolean;
    } | null = null;

    socket.on('join', async (payload: { sessionId: string; role: 'caller' | 'callee' }, ack?: (err: string | null) => void) => {
      if (sessionId) {
        ack?.('Already joined a session');
        return;
      }
      const { sessionId: sid, role } = payload || {};
      if (!sid || !role) {
        ack?.('Missing sessionId or role');
        return;
      }
      const session = await getSessionForSocket(sid, accountId);
      if (!session) {
        ack?.('Invalid or expired session');
        return;
      }
      sessionId = session.sessionId;
      sessionMeta = {
        sourceLang: session.sourceLang,
        targetLang: session.targetLang,
        synthesizeSpeech: session.synthesizeSpeech,
      };
      socket.join(sessionId);
      ack?.(null);
    });

    socket.on('audio', async (chunk: Buffer | string) => {
      if (!sessionId || !sessionMeta) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'base64');
      if (buffer.length === 0) return;
      try {
        const results = await processAudioChunk(
          sessionId,
          buffer,
          sessionMeta.sourceLang,
          sessionMeta.targetLang,
          sessionMeta.synthesizeSpeech
        );
        for (const r of results) {
          translateNs.to(sessionId!).emit('translation', {
            type: 'translation',
            text: r.text,
            original: r.original,
            isFinal: r.isFinal,
          });
          if (r.audio && r.audio.length > 0) {
            translateNs.to(sessionId!).emit('translation_audio', r.audio);
          }
        }
      } catch (err) {
        socket.emit('error', { message: 'Processing failed' });
      }
    });

    socket.on('disconnect', () => {
      sessionId = null;
      sessionMeta = null;
    });
  });
}
