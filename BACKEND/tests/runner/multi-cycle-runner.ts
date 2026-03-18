import { TestEnvironment } from '../config/test-environment';
import { TestSuite, SuiteResult, Failure } from '../suites/base-suite';

// Lightweight runner scaffold: you can register concrete suites here
// and invoke runAllCycles() from a test script or CLI.

export class MultiCycleTestRunner {
  private readonly env = new TestEnvironment();
  private readonly cycles: number;
  private readonly suites: TestSuite[];

  constructor(options?: { cycles?: number; suites?: TestSuite[] }) {
    this.cycles = options?.cycles ?? 1;
    this.suites = options?.suites ?? [];
  }

  registerSuite(suite: TestSuite) {
    this.suites.push(suite);
  }

  async runAllCycles(): Promise<Failure[]> {
    const allFailures: Failure[] = [];

    for (let cycle = 1; cycle <= this.cycles; cycle++) {
      // eslint-disable-next-line no-console
      console.log(`\n=== Starting test cycle ${cycle}/${this.cycles} ===`);
      await this.env.setup();

      for (const suite of this.suites) {
        // eslint-disable-next-line no-console
        console.log(`Running suite: ${suite.name}`);
        let result: SuiteResult;
        try {
          result = await suite.run(this.env);
        } catch (e) {
          const failure: Failure = {
            suite: suite.name,
            testName: 'suite-internal-error',
            message: e instanceof Error ? e.message : String(e),
            error: e,
            severity: 'CRITICAL',
          };
          allFailures.push(failure);
          // eslint-disable-next-line no-console
          console.error(`[${suite.name}] internal error:`, failure.message);
          continue;
        }

        if (result.failures.length) {
          allFailures.push(...result.failures);
          // eslint-disable-next-line no-console
          console.warn(
            `[${suite.name}] ${result.failures.length} failures (${result.passed}/${result.total} passed)`,
          );
        } else {
          // eslint-disable-next-line no-console
          console.log(`[${suite.name}] all ${result.total} tests passed`);
        }
      }

      await this.env.teardown();
    }

    return allFailures;
  }
}

