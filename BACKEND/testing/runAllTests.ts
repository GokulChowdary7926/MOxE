import { TestOrchestrator } from './architecture/testOrchestrator';

async function main() {
  const orchestrator = new TestOrchestrator({
    environment: (process.env.NODE_ENV as any) || 'test',
    iterations: 1,
    concurrency: 1,
  });

  const summary = await orchestrator.runAllSuites();

  // eslint-disable-next-line no-console
  console.log('--- Backend test summary (orchestrator) ---');
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        totalSuites: summary.totalSuites,
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        durationMs: summary.durationMs,
      },
      null,
      2,
    ),
  );

  if (summary.failed > 0) {
    // eslint-disable-next-line no-console
    console.error('Failures:', summary.failures);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error while running orchestrated tests:', err);
  process.exitCode = 1;
});

