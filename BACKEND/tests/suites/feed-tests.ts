import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { TestSuite, TestResult, SuiteResult } from './base-suite';
import type { TestEnvironment } from '../config/test-environment';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function tokenFor(accountId: string, userId: string) {
  return jwt.sign({ accountId, userId }, JWT_SECRET, { expiresIn: '1h' });
}

export class FeedTests extends TestSuite {
  name = 'Feed & Favorites';

  async run(env: TestEnvironment): Promise<SuiteResult> {
    const results: TestResult[] = [];

    results.push(await this.testFeedRequiresAuth(env));
    results.push(await this.testOwnPostAppearsInFeed(env));
    results.push(await this.testFollowedAccountPostsAppear(env));
    results.push(await this.testFavoritesFeedFiltersByFavorite(env));
    results.push(await this.testInteractionEndpointRecordsView(env));

    return this.createSuiteResult(results);
  }

  private async testFeedRequiresAuth(env: TestEnvironment): Promise<TestResult> {
    const name = 'GET /api/posts/feed requires auth';
    try {
      const res = await axios.get(`${env.baseUrl}/api/posts/feed`, {
        validateStatus: () => true,
      });
      if (res.status !== 401) {
        throw new Error(`Expected 401 without Authorization, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testOwnPostAppearsInFeed(env: TestEnvironment): Promise<TestResult> {
    const name = 'Own PUBLIC post appears in /api/posts/feed';
    try {
      const accountId = 'test-account-emma';
      const userId = 'test-user-emma';
      const token = tokenFor(accountId, userId);
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Feed self-post',
          media: [{ type: 'IMAGE', url: 'https://example.com/self.jpg' }],
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
      const found = items.some((p) => p.id === postId);
      if (!found) {
        throw new Error('Own post not present in feed items');
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testFollowedAccountPostsAppear(env: TestEnvironment): Promise<TestResult> {
    const name = 'Posts from followed account appear in feed';
    try {
      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      // Emma follows Marcus
      const followRes = await axios.post(
        `${env.baseUrl}/api/follow`,
        { accountId: 'test-account-marcus' },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (followRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/follow, got ${followRes.status}`);
      }

      // Marcus creates a public post
      const postRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Post from Marcus for followers',
          media: [{ type: 'IMAGE', url: 'https://example.com/marcus.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers: marcusHeaders, validateStatus: () => true },
      );
      if (postRes.status !== 201) {
        throw new Error(`Expected 201 from Marcus POST /api/posts, got ${postRes.status}`);
      }
      const postId = postRes.data?.id;

      // Emma's feed should include Marcus's post
      const feedRes = await axios.get(`${env.baseUrl}/api/posts/feed`, {
        headers: emmaHeaders,
        validateStatus: () => true,
      });
      if (feedRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/posts/feed, got ${feedRes.status}`);
      }
      const items: any[] = feedRes.data?.items ?? [];
      const found = items.some((p) => p.id === postId);
      if (!found) {
        throw new Error('Followed account post not present in viewer feed');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testFavoritesFeedFiltersByFavorite(env: TestEnvironment): Promise<TestResult> {
    const name = 'Favorites feed only includes posts from favorite accounts';
    try {
      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      // Ensure Emma follows Marcus and marks him as favorite
      await axios.post(
        `${env.baseUrl}/api/follow`,
        { accountId: 'test-account-marcus' },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      const favRes = await axios.patch(
        `${env.baseUrl}/api/follow/test-account-marcus/favorite`,
        { isFavorite: true },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (favRes.status !== 200) {
        throw new Error(`Expected 200 from PATCH /api/follow/:id/favorite, got ${favRes.status}`);
      }

      // Marcus posts
      const marcusPost = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Favorite Marcus post',
          media: [{ type: 'IMAGE', url: 'https://example.com/fav-marcus.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers: marcusHeaders, validateStatus: () => true },
      );
      if (marcusPost.status !== 201) {
        throw new Error(`Expected 201 from Marcus POST /api/posts, got ${marcusPost.status}`);
      }

      // Favorites feed
      const favFeed = await axios.get(`${env.baseUrl}/api/posts/feed/favorites`, {
        headers: emmaHeaders,
        validateStatus: () => true,
      });
      if (favFeed.status !== 200) {
        throw new Error(`Expected 200 from GET /api/posts/feed/favorites, got ${favFeed.status}`);
      }
      const items: any[] = favFeed.data?.items ?? [];
      if (!items.length) {
        throw new Error('Favorites feed returned no items');
      }
      const allFromFavorites = items.every((p) => p.accountId === 'test-account-emma' || p.accountId === 'test-account-marcus');
      if (!allFromFavorites) {
        throw new Error('Favorites feed includes posts from non-favorite accounts');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testInteractionEndpointRecordsView(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/posts/:postId/interactions accepts VIEW';
    try {
      const accountId = 'test-account-emma';
      const userId = 'test-user-emma';
      const token = tokenFor(accountId, userId);
      const headers = { Authorization: `Bearer ${token}` };

      // Create a post
      const createRes = await axios.post(
        `${env.baseUrl}/api/posts`,
        {
          caption: 'Interaction test post',
          media: [{ type: 'IMAGE', url: 'https://example.com/interact.jpg' }],
          privacy: 'PUBLIC',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/posts, got ${createRes.status}`);
      }
      const postId = createRes.data?.id;

      // Record a VIEW interaction
      const interactionRes = await axios.post(
        `${env.baseUrl}/api/posts/${postId}/interactions`,
        { type: 'VIEW', value: 1 },
        { headers, validateStatus: () => true },
      );
      if (interactionRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/posts/:id/interactions, got ${interactionRes.status}`);
      }
      if (!interactionRes.data?.ok) {
        throw new Error('Interaction endpoint did not return ok: true');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }
}

