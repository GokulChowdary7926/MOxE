import axios from 'axios';
import bcrypt from 'bcrypt';
import { TestSuite, TestResult, SuiteResult } from './base-suite';
import type { TestEnvironment } from '../config/test-environment';

export class AuthTests extends TestSuite {
  name = 'Authentication & Account Management';

  async run(env: TestEnvironment): Promise<SuiteResult> {
    const results: TestResult[] = [];

    results.push(await this.testSendVerificationCodeValidation(env));
    results.push(await this.testLoginValidation(env));
    results.push(await this.testSuccessfulUsernameLogin(env));
    results.push(await this.testEmailVerificationRequest(env));
    results.push(await this.testGoogleUrlWhenNotConfigured(env));

    return this.createSuiteResult(results);
  }

  private async testSendVerificationCodeValidation(env: TestEnvironment): Promise<TestResult> {
    const name = 'auth/send-verification-code validates body';
    try {
      const res = await axios.post(
        `${env.baseUrl}/api/auth/send-verification-code`,
        {},
        { validateStatus: () => true },
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400 for missing phoneNumber, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testLoginValidation(env: TestEnvironment): Promise<TestResult> {
    const name = 'auth/login requires loginId and password';
    try {
      const res = await axios.post(
        `${env.baseUrl}/api/auth/login`,
        { loginId: '', password: '' },
        { validateStatus: () => true },
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400 for empty loginId/password, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testSuccessfulUsernameLogin(env: TestEnvironment): Promise<TestResult> {
    const name = 'auth/login succeeds with username + correct password';
    try {
      const password = 'TestPassword123!';
      const hashed = await bcrypt.hash(password, 10);

      const user = await env.prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          password: hashed,
          phoneNumber: '+19999999999',
          dateOfBirth: new Date('1990-01-01'),
          isVerified: true,
          accounts: {
            create: {
              username: `testuser${Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')}`,
              displayName: 'Test User',
              accountType: 'PERSONAL',
              subscriptionTier: 'FREE',
              isActive: true,
            },
          },
        },
        include: { accounts: true },
      });

      const account = user.accounts[0];
      const res = await axios.post(
        `${env.baseUrl}/api/auth/login`,
        {
          loginId: account.username,
          password,
        },
        { validateStatus: () => true },
      );

      if (res.status !== 200) {
        throw new Error(`Expected 200 for correct username/password, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (!res.data?.token || !res.data?.accountId) {
        throw new Error('Missing token or accountId in login response');
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testEmailVerificationRequest(env: TestEnvironment): Promise<TestResult> {
    const name = 'auth/email/request-verification accepts userId + email';
    try {
      const user = await env.prisma.user.create({
        data: {
          email: `verify-${Date.now()}@example.com`,
          phoneNumber: '+12223334444',
          password: 'test-password-hash',
          dateOfBirth: new Date('1990-01-01'),
        },
      });

      const res = await axios.post(
        `${env.baseUrl}/api/auth/email/request-verification`,
        { userId: user.id, email: user.email },
        { validateStatus: () => true },
      );

      if (res.status !== 200) {
        throw new Error(`Expected 200 from email/request-verification, got ${res.status}`);
      }

      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }

  private async testGoogleUrlWhenNotConfigured(env: TestEnvironment): Promise<TestResult> {
    const name = 'auth/google/url responds when Google not configured';
    try {
      const res = await axios.get(`${env.baseUrl}/api/auth/google/url`, {
        validateStatus: () => true,
      });
      // When GOOGLE_CLIENT_ID is missing, we expect 503.
      if (process.env.GOOGLE_CLIENT_ID) {
        if (res.status !== 200 || !res.data?.url) {
          throw new Error(`Expected 200 + url when configured, got ${res.status}`);
        }
      } else if (res.status !== 503) {
        throw new Error(`Expected 503 when GOOGLE_CLIENT_ID is missing, got ${res.status}`);
      }
      return this.pass(name);
    } catch (e) {
      return this.fail(name, e);
    }
  }
}

