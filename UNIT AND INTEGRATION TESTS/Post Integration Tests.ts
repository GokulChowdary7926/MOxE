// backend/tests/integration/posts.test.ts

import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/server';

describe('Posts Endpoints', () => {
  let authToken: string;
  let userId: string;
  let accountId: string;

  beforeAll(async () => {
    // Create test user and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '+1234567890',
        password: 'Password123!',
      });

    authToken = loginResponse.body.token;
    accountId = loginResponse.body.primaryAccount.id;
    userId = loginResponse.body.user.id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test post with #hashtag')
        .field('location', 'New York')
        .field('privacy', 'PUBLIC')
        .attach('media', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('caption', 'Test post with #hashtag');
    });

    it('should fail without media', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test post');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'At least one media file is required');
    });
  });

  describe('GET /api/posts/feed', () => {
    it('should return feed posts', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    let postId: string;

    beforeAll(async () => {
      // Create a test post
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test post for likes')
        .attach('media', Buffer.from('fake-image'), 'test.jpg');

      postId = postResponse.body.id;
    });

    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked', true);
    });

    it('should unlike a post', async () => {
      // First like
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Then unlike
      const response = await request(app)
        .delete(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked', false);
    });
  });

  describe('POST /api/posts/:id/comments', () => {
    let postId: string;

    beforeAll(async () => {
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test post for comments')
        .attach('media', Buffer.from('fake-image'), 'test.jpg');

      postId = postResponse.body.id;
    });

    it('should add a comment', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Great post!' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('content', 'Great post!');
      expect(response.body).toHaveProperty('accountId', accountId);
    });

    it('should reply to a comment', async () => {
      // First create parent comment
      const commentResponse = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Parent comment' });

      const commentId = commentResponse.body.id;

      // Then reply
      const replyResponse = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          content: 'Reply to comment',
          parentId: commentId 
        });

      expect(replyResponse.status).toBe(201);
      expect(replyResponse.body).toHaveProperty('parentId', commentId);
    });
  });
});