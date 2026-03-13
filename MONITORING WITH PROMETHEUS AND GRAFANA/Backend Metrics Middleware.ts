// backend/src/middleware/metrics.ts

import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const activeUsersGauge = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  registers: [register],
});

const postsCreatedCounter = new promClient.Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created',
  registers: [register],
});

const messagesSentCounter = new promClient.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  registers: [register],
});

const revenueCounter = new promClient.Counter({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['type'],
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const redisOperationDuration = new promClient.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

// Middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );
  });

  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Business metrics updates
export const updateActiveUsers = (count: number) => {
  activeUsersGauge.set(count);
};

export const incrementPostsCreated = () => {
  postsCreatedCounter.inc();
};

export const incrementMessagesSent = () => {
  messagesSentCounter.inc();
};

export const addRevenue = (amount: number, type: string) => {
  revenueCounter.inc({ type }, amount);
};

// Database query timing decorator
export const measureQuery = (queryName: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = (Date.now() - start) / 1000;
        databaseQueryDuration.observe({ query: queryName }, duration);
        return result;
      } catch (error) {
        const duration = (Date.now() - start) / 1000;
        databaseQueryDuration.observe({ query: `${queryName}_error` }, duration);
        throw error;
      }
    };

    return descriptor;
  };
};

// Redis operation timing decorator
export const measureRedis = (operation: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = (Date.now() - start) / 1000;
        redisOperationDuration.observe({ operation }, duration);
        return result;
      } catch (error) {
        const duration = (Date.now() - start) / 1000;
        redisOperationDuration.observe({ operation: `${operation}_error` }, duration);
        throw error;
      }
    };

    return descriptor;
  };
};