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

export class StoryTests extends TestSuite {
  name = 'Stories';

  async run(env: TestEnvironment): Promise<SuiteResult> {
    const results: TestResult[] = [];

    results.push(await this.testListStoriesRequiresAuth(env));
    results.push(await this.testCreateStoryAndListInFeed(env));
    results.push(await this.testRecordStoryView(env));
    results.push(await this.testStoryLikeFlow(env));

    return this.createSuiteResult(results);
  }

  private async testListStoriesRequiresAuth(env: TestEnvironment): Promise<TestResult> {
    const name = 'GET /api/stories requires auth';
    try {
      const res = await axios.get(`${env.baseUrl}/api/stories`, {
        validateStatus: () => true,
      });
      if (res.status !== 401) {
        throw new Error(`Expected 401 for unauthenticated /api/stories, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testCreateStoryAndListInFeed(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/stories creates story and GET /api/stories lists it';
    try {
      const baseUrl = env.baseUrl;
      const token = tokenFor('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${baseUrl}/api/stories`,
        {
          media: [{ type: 'IMAGE', url: 'https://example.com/story.jpg' }],
          durationSeconds: 5,
          caption: 'Test story from automated suite',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/stories, got ${createRes.status}`);
      }
      const storyId = createRes.data?.id;
      if (!storyId) throw new Error('Story id missing from create response');

      const listRes = await axios.get(`${baseUrl}/api/stories`, {
        headers,
        validateStatus: () => true,
      });
      if (listRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/stories, got ${listRes.status}`);
      }
      const list: any[] = listRes.data ?? [];
      const found = list.some((entry: any) =>
        Array.isArray(entry.stories)
          ? entry.stories.some((s: any) => s.id === storyId)
          : entry.id === storyId,
      );
      if (!found) {
        throw new Error('Newly created story not present in stories feed response');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testRecordStoryView(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/stories/:id/view records a view';
    try {
      const baseUrl = env.baseUrl;
      const token = tokenFor('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${baseUrl}/api/stories`,
        {
          media: [{ type: 'IMAGE', url: 'https://example.com/story-view.jpg' }],
          durationSeconds: 5,
          caption: 'Story for view test',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/stories, got ${createRes.status}`);
      }
      const storyId = createRes.data?.id;

      const viewRes = await axios.post(
        `${baseUrl}/api/stories/${storyId}/view`,
        { anonymous: false },
        { headers, validateStatus: () => true },
      );
      if (viewRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/stories/:id/view, got ${viewRes.status}`);
      }
      if (!viewRes.data?.ok) {
        throw new Error('Story view endpoint did not return ok: true');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testStoryLikeFlow(env: TestEnvironment): Promise<TestResult> {
    const name = 'Story like/unlike flow works';
    try {
      const baseUrl = env.baseUrl;
      const token = tokenFor('test-account-emma', 'test-user-emma');
      const headers = { Authorization: `Bearer ${token}` };

      const createRes = await axios.post(
        `${baseUrl}/api/stories`,
        {
          media: [{ type: 'IMAGE', url: 'https://example.com/story-like.jpg' }],
          durationSeconds: 5,
          caption: 'Story for like test',
        },
        { headers, validateStatus: () => true },
      );
      if (createRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/stories, got ${createRes.status}`);
      }
      const storyId = createRes.data?.id;

      const likeRes = await axios.post(
        `${baseUrl}/api/stories/${storyId}/like`,
        {},
        { headers, validateStatus: () => true },
      );
      if (likeRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/stories/:id/like, got ${likeRes.status}`);
      }

      const statusRes = await axios.get(`${baseUrl}/api/stories/${storyId}/like`, {
        headers,
        validateStatus: () => true,
      });
      if (statusRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/stories/:id/like, got ${statusRes.status}`);
      }
      if (!statusRes.data?.liked) {
        throw new Error('Story like status did not reflect liked=true after like');
      }

      const unlikeRes = await axios.delete(`${baseUrl}/api/stories/${storyId}/like`, {
        headers,
        validateStatus: () => true,
      });
      if (unlikeRes.status !== 200) {
        throw new Error(`Expected 200 from DELETE /api/stories/:id/like, got ${unlikeRes.status}`);
      }

      const statusAfter = await axios.get(`${baseUrl}/api/stories/${storyId}/like`, {
        headers,
        validateStatus: () => true,
      });
      if (statusAfter.status !== 200) {
        throw new Error(`Expected 200 from GET /api/stories/:id/like after unlike, got ${statusAfter.status}`);
      }
      if (statusAfter.data?.liked) {
        throw new Error('Story like status still liked=true after unlike');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }
}

