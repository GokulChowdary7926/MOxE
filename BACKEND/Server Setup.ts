// backend/src/server.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
import { rateLimit } from 'express-rate-limit';
import { createClient } from 'redis';

// Import routes
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
import adminRoutes from './routes/admin.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

// Import socket handlers
import { setupSocketHandlers } from './sockets';

dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Redis
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/accounts', authenticate, accountRoutes);
app.use('/api/posts', authenticate, postRoutes);
app.use('/api/stories', authenticate, storyRoutes);
app.use('/api/reels', authenticate, reelRoutes);
app.use('/api/live', authenticate, liveRoutes);
app.use('/api/messages', authenticate, messageRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/explore', authenticate, exploreRoutes);
app.use('/api/map', authenticate, mapRoutes);
app.use('/api/commerce', authenticate, commerceRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await prisma.$disconnect();
  await redisClient.quit();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };