import { MultiCycleTestRunner } from './multi-cycle-runner';
import { BugTracker } from '../reporting/bug-tracker';
import { AuthTests } from '../suites/auth-tests';
import { PostTests } from '../suites/post-tests';
import { FeedTests } from '../suites/feed-tests';
import { StoryTests } from '../suites/story-tests';
import { MessageTests } from '../suites/message-tests';

export class AutomatedDetectionAndFixing {
  private readonly runner: MultiCycleTestRunner;
  private readonly bugTracker = new BugTracker();

  constructor(cycles: number = 1) {
    this.runner = new MultiCycleTestRunner({
      cycles,
      suites: [new AuthTests(), new PostTests(), new FeedTests(), new StoryTests(), new MessageTests()],
    });
  }

  async runOnce() {
    const failures = await this.runner.runAllCycles();
    this.bugTracker.addFailures(failures);
    const remaining = this.bugTracker.getRemainingBugs();
    if (remaining.length === 0) {
      // eslint-disable-next-line no-console
      console.log('All tests passed – no bugs recorded.');
    } else {
      // eslint-disable-next-line no-console
      console.log(`${remaining.length} bugs recorded (no auto-fix logic implemented yet).`);
    }
  }
}

// Simple CLI entrypoint when executed via ts-node / node (after compilation).
if (require.main === module) {
  const cycles = Number(process.argv[2]) || 1;
  const runner = new AutomatedDetectionAndFixing(cycles);
  runner
    .runOnce()
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('AutomatedDetectionAndFixing failed:', e);
      process.exit(1);
    });
}

