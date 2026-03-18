import type { Failure, SuiteResult, TestResult } from '../../tests/suites/base-suite';

/**
 * Thin wrapper on top of the existing `TestSuite` abstraction.
 * New suites can extend this instead of re‑importing from tests/.
 */
export abstract class BaseTestSuite {
  abstract readonly name: string;

  /**
   * Run the suite and return a `SuiteResult`.
   * Implementations can delegate to the existing concrete suites.
   */
  abstract run(): Promise<SuiteResult>;

  protected pass(testName: string, details?: Record<string, unknown>): TestResult {
    return {
      name: testName,
      passed: true,
      details,
    };
  }

  protected fail(testName: string, error: Error): Failure {
    return {
      testName,
      message: error.message,
      stack: error.stack,
    };
  }
}

