import { AuthTests } from '../../tests/suites/auth-tests';
import { PostTests } from '../../tests/suites/post-tests';
import { FeedTests } from '../../tests/suites/feed-tests';
import { StoryTests } from '../../tests/suites/story-tests';
import { MessageTests } from '../../tests/suites/message-tests';
import type { Failure, SuiteResult, TestSuite } from '../../tests/suites/base-suite';
import { TestEnvironment } from '../../tests/config/test-environment';

export interface TestConfig {
  environment: 'development' | 'test' | 'staging' | 'production';
  iterations: number;
  concurrency: number;
}

export interface TestRunSummary {
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  durationMs: number;
  failures: Failure[];
}

export class TestOrchestrator {
  private readonly config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Runs the existing backend suites (auth, posts, feed, stories, messages)
   * against a real `TestEnvironment` and aggregates their results.
   */
  async runAllSuites(): Promise<TestRunSummary> {
    const startedAt = Date.now();

    const suites: TestSuite[] = [
      new AuthTests(),
      new PostTests(),
      new FeedTests(),
      new StoryTests(),
      new MessageTests(),
    ];

    const suiteResults: SuiteResult[] = [];
    const env = new TestEnvironment();

    await env.setup();
    try {
      for (const suite of suites) {
        // eslint-disable-next-line no-console
        console.log(`Running suite: ${suite.name}`);
        const result = await suite.run(env);
        suiteResults.push(result);
      }
    } finally {
      await env.teardown();
    }

    let totalTests = 0;
    let passed = 0;
    const failures: Failure[] = [];

    for (const r of suiteResults) {
      totalTests += r.total;
      passed += r.passed;
      failures.push(...r.failures);
    }

    const durationMs = Date.now() - startedAt;

    return {
      totalSuites: suites.length,
      totalTests,
      passed,
      failed: failures.length,
      durationMs,
      failures,
    };
  }
}

