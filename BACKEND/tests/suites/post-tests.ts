import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { TestSuite, TestResult, SuiteResult } from './base-suite';
import type { TestEnvironment } from '../config/test-environment';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function createTokenForAccount(accountId: string, userId: string) {
  return jwt.sign({ accountId, userId }, JWT_SECRET, { expiresIn: '1h' });
}

export class PostTests extends TestSuite {
  name = 'Posts & Feed';

  async run(env: TestEnvironment): Promise<SuiteResult> {
    const results: TestResult[] = [];

    results.push(await this.testListByAccountRequiresAccountId(env));
    results.push(await this.testCreatePostRequiresAuth(env));
    results.push(await this.testCreateAndFetchPost(env));
    results.push(await this.testFeedReturnsCreatedPost(env));
    results.push(await this.testLikeAndUnlikePost(env));
    results.push(await this.testCommentRequiresAuth(env));
    results.push(await this.testSaveAndUnsavePost(env));

    return this.createSuiteResult(results);
  }

  private async testListByAccountRequiresAccountId(env: TestEnvironment): Promise<TestResult> {
    const name = 'GET /api/posts requires accountId';
    try {
      const res = await axios.get(`${env.baseUrl}/api/posts`, {
        validateStatus: () => true,
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for missing accountId, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testCreatePostRequiresAuth(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/posts without auth returns 401';
    try {
      const res = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Unauthorized post',
          media: [{ type: 'IMAGE', url: 'https://example.com/unauth.jpg' }],
        },
        { validateStatus: () => true },
      );
      if (res.status !== 401) {
        throw new Error(`Expected 401 from POST /api/posts without token, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testCreateAndFetchPost(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/posts creates post and GET /api/posts/:id returns it';
    try {
      const token = createTokenForAccount('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Testing my first MOxE post',
          media: [{ type: 'IMAGE', url: 'https://example.com/image.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;
      if (!postId) throw new Error('POST /api/posts did not return an id');

      const getRes = await axios.get(`${env.baseUrl}/api/posts/${postId}`, {
        headers,
        validateStatus: () => true,
      });
      if (getRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/posts/${postId}, got ${getRes.status}`);
      }
      if (getRes.data?.caption !== 'Testing my first MOxE post') {
        throw new Error('Fetched post caption does not match');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testFeedReturnsCreatedPost(env: TestEnvironment): Promise<TestResult> {
    const name = 'GET /api/posts/feed returns items for Emma including her post';
    try {
      const token = createTokenForAccount('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      // Create a post that should appear in feed.
      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Feed post check',
          media: [{ type: 'IMAGE', url: 'https://example.com/feed.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;

      const feedRes = await axios.get(`${env.baseUrl}/api/posts/feed`, {
        headers,
        validateStatus: () => true,
      });
      if (feedRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/posts/feed, got ${feedRes.status}`);
      }
      const items: any[] = feedRes.data?.items ?? [];
      if (!Array.isArray(items)) {
        throw new Error('Feed response does not contain items array');
      }
      const found = items.some((p) => p.id === postId);
      if (!found) {
        throw new Error('Newly created post not found in feed items');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testLikeAndUnlikePost(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST/DELETE /api/posts/:id/like toggles like state';
    try {
      const accountId = 'test-account-emma';
      const userId = 'test-user-emma';
      const token = createTokenForAccount(accountId, userId);
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Like flow post',
          media: [{ type: 'IMAGE', url: 'https://example.com/like.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;

      const likeRes = await axios.post(
        `${env.baseUrl}/api/posts/${postId}/like`,
        {},
        { headers, validateStatus: () => true },
      );
      if (likeRes.status !== 200 || !likeRes.data?.liked) {
        throw new Error(`Expected liked: true from POST /like, got status ${likeRes.status}`);
      }

      const unlikeRes = await axios.delete(`${env.baseUrl}/api/posts/${postId}/like`, {
        headers,
        validateStatus: () => true,
      });
      if (unlikeRes.status !== 200 || unlikeRes.data?.liked !== false) {
        throw new Error(`Expected liked: false from DELETE /like, got status ${unlikeRes.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testCommentRequiresAuth(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/posts/:id/comments without auth returns 401';
    try {
      // Create a post as Emma first
      const token = createTokenForAccount('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Comment auth post',
          media: [{ type: 'IMAGE', url: 'https://example.com/comment.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;

      // Now try to comment without Authorization header
      const res = await axios.post(
        `${env.baseUrl}/api/posts/${postId}/comments`,
        { content: 'Hello without auth' },
        { validateStatus: () => true },
      );
      if (res.status !== 401) {
        throw new Error(`Expected 401 from POST /api/posts/:id/comments without token, got ${res.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testSaveAndUnsavePost(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST/DELETE /api/posts/:id/save toggles saved state';
    try {
      const accountId = 'test-account-emma';
      const userId = 'test-user-emma';
      const token = createTokenForAccount(accountId, userId);
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Save flow post',
          media: [{ type: 'IMAGE', url: 'https://example.com/save.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;

      const saveRes = await axios.post(
        `${env.baseUrl}/api/posts/${postId}/save`,
        {},
        { headers, validateStatus: () => true },
      );
      if (saveRes.status !== 200 || !saveRes.data?.saved) {
        throw new Error(`Expected saved: true from POST /save, got status ${saveRes.status}`);
      }

      const unsaveRes = await axios.delete(`${env.baseUrl}/api/posts/${postId}/save`, {
        headers,
        validateStatus: () => true,
      });
      if (unsaveRes.status !== 200 || unsaveRes.data?.saved !== false) {
        throw new Error(`Expected saved: false from DELETE /save, got status ${unsaveRes.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }
}


