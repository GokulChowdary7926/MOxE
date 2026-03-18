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

export class MessageTests extends TestSuite {
  name = 'Messages & DMs';

  async run(env: TestEnvironment): Promise<SuiteResult> {
    const results: TestResult[] = [];

    results.push(await this.testMessagesRequireAuth(env));
    results.push(await this.testSendAndFetchDirectMessage(env));
    results.push(await this.testMarkThreadRead(env));
    results.push(await this.testBlockedRecipientCannotBeMessaged(env));
    results.push(await this.testMinorSenderMustFollowRecipient(env));
    results.push(await this.testMinorRecipientMustFollowSender(env));
    results.push(await this.testMuteAndUnmuteConversation(env));

    return this.createSuiteResult(results);
  }

  private async testMessagesRequireAuth(env: TestEnvironment): Promise<TestResult> {
    const name = 'GET /api/messages requires auth';
    try {
      const res = await axios.get(`${env.baseUrl}/api/messages`, {
        params: { userId: 'some-id' },
        validateStatus: () => true,
      });
      if (res.status !== 401) {
        throw new Error(`Expected 401 for unauthenticated /api/messages, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testSendAndFetchDirectMessage(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/messages sends DM and GET /api/messages fetches it in order';
    try {
      // Emma ↔ Marcus
      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      // Emma sends a text DM to Marcus
      const sendRes = await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-marcus',
          content: 'Hello Marcus from automated tests',
          messageType: 'TEXT',
        },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (sendRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/messages, got ${sendRes.status}`);
      }
      const msgId = sendRes.data?.id;
      if (!msgId) throw new Error('Message id missing from send response');

      // Marcus fetches the thread with Emma
      const threadRes = await axios.get(`${env.baseUrl}/api/messages`, {
        headers: marcusHeaders,
        params: { userId: 'test-account-emma', limit: 20 },
        validateStatus: () => true,
      });
      if (threadRes.status !== 200) {
        throw new Error(`Expected 200 from GET /api/messages for thread, got ${threadRes.status}`);
      }
      const items: any[] = threadRes.data?.items ?? threadRes.data ?? [];
      if (!Array.isArray(items) || !items.length) {
        throw new Error('Thread returned no messages');
      }
      const found = items.some((m) => m.id === msgId && m.content === 'Hello Marcus from automated tests');
      if (!found) {
        throw new Error('Sent DM not found in fetched thread');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testMarkThreadRead(env: TestEnvironment): Promise<TestResult> {
    const name = 'POST /api/messages/thread-read marks thread as read';
    try {
      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      // Emma sends another message to Marcus to ensure unread state
      const sendRes = await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-marcus',
          content: 'Unread message for read-test',
          messageType: 'TEXT',
        },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (sendRes.status !== 201) {
        throw new Error(`Expected 201 from POST /api/messages, got ${sendRes.status}`);
      }

      // Marcus lists threads to confirm there is at least one thread entry
      const threadsBefore = await axios.get(`${env.baseUrl}/api/messages/threads`, {
        headers: marcusHeaders,
        validateStatus: () => true,
      });
      if (threadsBefore.status !== 200) {
        throw new Error(`Expected 200 from GET /api/messages/threads, got ${threadsBefore.status}`);
      }

      // Mark thread with Emma as read
      const readRes = await axios.post(
        `${env.baseUrl}/api/messages/thread-read`,
        { userId: 'test-account-emma' },
        { headers: marcusHeaders, validateStatus: () => true },
      );
      if (readRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/messages/thread-read, got ${readRes.status}`);
      }
      if (!readRes.data?.ok) {
        throw new Error('thread-read endpoint did not return ok: true');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testBlockedRecipientCannotBeMessaged(env: TestEnvironment): Promise<TestResult> {
    const name = 'Blocked recipient cannot be messaged';
    try {
      // Marcus blocks Emma
      await env.prisma.block.create({
        data: {
          blockerId: 'test-account-marcus',
          blockedId: 'test-account-emma',
        },
      });

      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };

      const res = await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-marcus',
          content: 'Should be blocked',
          messageType: 'TEXT',
        },
        { headers: emmaHeaders, validateStatus: () => true },
      );

      if (res.status !== 403) {
        throw new Error(`Expected 403 when messaging a blocker, got ${res.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testMinorSenderMustFollowRecipient(env: TestEnvironment): Promise<TestResult> {
    const name = 'Minor sender must follow recipient';
    try {
      // Ensure Lena (minor) does NOT follow Marcus
      await env.prisma.follow.deleteMany({
        where: { followerId: 'test-account-lena', followingId: 'test-account-marcus' },
      });

      const lenaToken = tokenFor('test-account-lena', 'test-user-lena');
      const lenaHeaders = { Authorization: `Bearer ${lenaToken}` };

      const res = await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-marcus',
          content: 'Hi from minor Lena',
          messageType: 'TEXT',
        },
        { headers: lenaHeaders, validateStatus: () => true },
      );

      if (res.status !== 403) {
        throw new Error(`Expected 403 when minor sender messages non-followed account, got ${res.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testMinorRecipientMustFollowSender(env: TestEnvironment): Promise<TestResult> {
    const name = 'Minor recipient must follow sender';
    try {
      // Ensure Lena (minor recipient) does NOT follow Marcus
      await env.prisma.follow.deleteMany({
        where: { followerId: 'test-account-lena', followingId: 'test-account-marcus' },
      });

      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      const res = await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-lena',
          content: 'Hi Lena from Marcus',
          messageType: 'TEXT',
        },
        { headers: marcusHeaders, validateStatus: () => true },
      );

      if (res.status !== 403) {
        throw new Error(`Expected 403 when messaging minor who does not follow sender, got ${res.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testMuteAndUnmuteConversation(env: TestEnvironment): Promise<TestResult> {
    const name = 'Mute/unmute conversation updates thread mute state';
    try {
      const emmaToken = tokenFor('test-account-emma', 'test-user-emma');
      const marcusToken = tokenFor('test-account-marcus', 'test-user-marcus');
      const emmaHeaders = { Authorization: `Bearer ${emmaToken}` };
      const marcusHeaders = { Authorization: `Bearer ${marcusToken}` };

      // Ensure there is a thread between Emma and Marcus
      await axios.post(
        `${env.baseUrl}/api/messages`,
        {
          recipientId: 'test-account-marcus',
          content: 'Thread setup for mute test',
          messageType: 'TEXT',
        },
        { headers: emmaHeaders, validateStatus: () => true },
      );

      // Emma mutes Marcus
      const muteRes = await axios.post(
        `${env.baseUrl}/api/messages/mute/test-account-marcus`,
        { duration: '24h' },
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (muteRes.status !== 200) {
        throw new Error(`Expected 200 from POST /api/messages/mute/:userId, got ${muteRes.status}`);
      }

      const threadsAfterMute = await axios.get(`${env.baseUrl}/api/messages/threads`, {
        headers: emmaHeaders,
        validateStatus: () => true,
      });
      if (threadsAfterMute.status !== 200) {
        throw new Error(`Expected 200 from GET /api/messages/threads, got ${threadsAfterMute.status}`);
      }
      const t1 = threadsAfterMute.data?.threads ?? [];
      const threadWithMarcus = t1.find((t: any) => t.otherId === 'test-account-marcus');
      if (!threadWithMarcus || !threadWithMarcus.mutedUntil) {
        throw new Error('Expected mutedUntil to be set after muteConversation');
      }

      // Emma un-mutes Marcus
      const unmuteRes = await axios.delete(
        `${env.baseUrl}/api/messages/mute/test-account-marcus`,
        { headers: emmaHeaders, validateStatus: () => true },
      );
      if (unmuteRes.status !== 200) {
        throw new Error(`Expected 200 from DELETE /api/messages/mute/:userId, got ${unmuteRes.status}`);
      }

      const threadsAfterUnmute = await axios.get(`${env.baseUrl}/api/messages/threads`, {
        headers: emmaHeaders,
        validateStatus: () => true,
      });
      if (threadsAfterUnmute.status !== 200) {
        throw new Error(`Expected 200 from GET /api/messages/threads after unmute, got ${threadsAfterUnmute.status}`);
      }
      const t2 = threadsAfterUnmute.data?.threads ?? [];
      const threadWithMarcusAfter = t2.find((t: any) => t.otherId === 'test-account-marcus');
      if (!threadWithMarcusAfter || threadWithMarcusAfter.mutedUntil) {
        throw new Error('Expected mutedUntil to be cleared after unmuteConversation');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }
}

