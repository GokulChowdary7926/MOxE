// backend/src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // Load .env before any other imports that read process.env

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import accountRoutes from './routes/account.routes';
import postRoutes from './routes/post.routes';
import storyRoutes from './routes/story.routes';
import reelRoutes from './routes/reel.routes';
import liveRoutes from './routes/live.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import exploreRoutes from './routes/explore.routes';
import mapRoutes from './routes/map.routes';
import commerceRoutes from './routes/commerce.routes';
import analyticsRoutes from './routes/analytics.routes';
import businessRoutes from './routes/business.routes';
import adminRoutes from './routes/admin.routes';
import jobRoutes from './routes/job.routes';
import premiumBlockedMessageRoutes from './routes/premiumBlockedMessage.routes';
import collectionRoutes from './routes/collection.routes';
import privacyRoutes from './routes/privacy.routes';
import followRoutes from './routes/follow.routes';
import closeFriendRoutes from './routes/closeFriend.routes';
import reportRoutes from './routes/report.routes';
import draftRoutes from './routes/draft.routes';
import emergencyContactRoutes from './routes/emergencyContact.routes';
import uploadRoutes from './routes/upload.routes';
import archiveRoutes from './routes/archive.routes';
import highlightRoutes from './routes/highlight.routes';
import groupRoutes from './routes/group.routes';
import supportRoutes from './routes/support.routes';
import contentRoutes from './routes/content.routes';
import safetyRoutes from './routes/safety.routes';
import streakRoutes from './routes/streak.routes';
import anonymousSpaceRoutes from './routes/anonymousSpace.routes';
import locationRoutes from './routes/location.routes';
import proximityRoutes from './routes/proximity.routes';
import featuresRoutes from './routes/features.routes';
import voiceRoutes from './routes/voice.routes';
import gifRoutes from './routes/gif.routes';
import messageRequestRoutes from './routes/messageRequests.routes';
import configRoutes from './routes/config.routes';
import translationRoutes from './routes/translation.routes';
import creatorRoutes from './routes/creator.routes';
import accessRoutes from './routes/access.routes';
import alertRoutes from './routes/alert.routes';
import compassRoutes from './routes/compass.routes';
import buildRoutes from './routes/build.routes';
import atlasRoutes from './routes/atlas.routes';
import adsRoutes from './routes/ads.routes';

import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './sockets';
import { ArchiveService } from './services/archive.service';
import { StoryService } from './services/story.service';
import { FlowService } from './services/job/flow.service';
import { CompassService } from './services/job/compass.service';
import { publishDueScheduledContent } from './services/scheduling.service';
import { MediaExpirationService } from './services/mediaExpiration.service';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Handle CORS preflight first so it never hits cors/helmet and can't return 403
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:7926',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:7926',
].filter(Boolean) as string[];
const isDev = process.env.NODE_ENV !== 'production';
app.use(
  cors({
    origin: (origin, cb) => {
      if (isDev) return cb(null, true);
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Ensure uploads directory exists at runtime (for multipart uploads and static serving)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.options('/api/*', (_req, res) => {
  res.sendStatus(204);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: express.Request) => req.method === 'OPTIONS',
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/premium', premiumBlockedMessageRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/close-friends', closeFriendRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/anonymous', anonymousSpaceRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/proximity-alerts', proximityRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/gifs', gifRoutes);
app.use('/api/message_requests', messageRequestRoutes);
app.use('/api/config', configRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/compass', compassRoutes);
app.use('/api/build', buildRoutes);
app.use('/api/atlas', atlasRoutes);
app.use('/api/ads', adsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);
setupSocketHandlers(io);

const archiveService = new ArchiveService();
const storyService = new StoryService();
const flowService = new FlowService();
const compassService = new CompassService();
const mediaTTLService = new MediaExpirationService();
setInterval(() => {
  archiveService.runArchiveJob()
    .then((r) => { if (r.archived > 0) console.log('[Archive]', r.archived, 'stories archived'); })
    .catch((e: Error) => console.error('[Archive]', e.message));
}, 60 * 60 * 1000);
setInterval(() => {
  storyService.processDueReminders()
    .then((n) => { if (n > 0) console.log('[StoryReminder]', n, 'reminders sent'); })
    .catch((e: Error) => console.error('[StoryReminder]', e.message));
}, 60 * 1000);
setInterval(() => {
  flowService.processDueReminders()
    .then((n) => { if (n > 0) console.log('[FlowReminder]', n, 'reminders sent'); })
    .catch((e: Error) => console.error('[FlowReminder]', e.message));
}, 60 * 1000);
setInterval(() => {
  publishDueScheduledContent()
    .then((r) => { if (r.posts > 0 || r.reels > 0) console.log('[Scheduling]', r.posts, 'posts,', r.reels, 'reels published'); })
    .catch((e: Error) => console.error('[Scheduling]', e.message));
}, 60 * 1000);
setInterval(() => {
  compassService
    .runHealthChecks()
    .then((n) => {
      if (n > 0) console.log('[CompassHealth]', n, 'services checked');
    })
    .catch((e: Error) => console.error('[CompassHealth]', e.message));
}, 60 * 1000);

// View‑once DM media TTL worker – run every minute.
setInterval(() => {
  mediaTTLService
    .processDue()
    .then((n) => {
      if (n > 0) console.log('[MediaTTL]', n, 'expired DM media items cleaned');
    })
    .catch((e: Error) => console.error('[MediaTTL]', e.message));
}, 60 * 1000);

const PORT = process.env.PORT || 5007;
httpServer.listen(PORT, () => {
  console.log(`MOxE server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };
