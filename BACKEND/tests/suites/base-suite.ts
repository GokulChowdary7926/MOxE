import type { TestEnvironment } from '../config/test-environment';

export type FailureSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Failure {
  suite: string;
  testName: string;
  message: string;
  error?: unknown;
  severity: FailureSeverity;
}

export interface TestResult {
  name: string;
  passed: boolean;
  failure?: Failure;
}

export interface SuiteResult {
  suite: string;
  total: number;
  passed: number;
  failures: Failure[];
}

export abstract class TestSuite {
  abstract name: string;
  abstract run(env: TestEnvironment): Promise<SuiteResult>;

  protected pass(name: string): TestResult {
    return { name, passed: true };
  }

  protected fail(
    name: string,
    error: unknown,
    severity: FailureSeverity = 'HIGH',
  ): TestResult {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
    const failure: Failure = {
      suite: this.name,
      testName: name,
      message,
      error,
      severity,
    };
    return { name, passed: false, failure };
  }

  protected createSuiteResult(results: TestResult[]): SuiteResult {
    const failures = results
      .filter((r) => !r.passed && r.failure)
      .map((r) => r.failure as Failure);
    const passed = results.length - failures.length;
    return {
      suite: this.name,
      total: results.length,
      passed,
      failures,
    };
  }
}

