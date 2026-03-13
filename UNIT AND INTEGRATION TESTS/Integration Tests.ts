// backend/tests/integration/auth.test.ts

import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/server';
import { redisClient } from '../../src/server';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Clean database
    await prisma.user.deleteMany();
    await redisClient.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('POST /api/auth/send-verification', () => {
    it('should send verification code', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 429 on too many requests', async () => {
      // Send 3 requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/send-verification')
          .send({ phoneNumber: '+1234567890' });
      }

      // 4th should fail
      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(429);
    });
  });

  describe('POST /api/auth/register', () => {
    const testUser = {
      phoneNumber: '+1234567890',
      username: 'testuser',
      displayName: 'Test User',
      password: 'Password123!',
      dateOfBirth: '1990-01-01',
    };

    it('should register new user successfully', async () => {
      // First verify phone
      await redisClient.setex('otp:+1234567890', 600, '123456');

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, otp: '123456' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('phoneNumber', testUser.phoneNumber);
    });

    it('should fail with invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, otp: 'wrong' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid or expired verification code');
    });

    it('should fail with duplicate username', async () => {
      await redisClient.setex('otp:+1987654321', 600, '123456');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          phoneNumber: '+1987654321',
          username: 'testuser', // Same username
          otp: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already taken');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with phone', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '+1234567890',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('accounts');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '+1234567890',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});