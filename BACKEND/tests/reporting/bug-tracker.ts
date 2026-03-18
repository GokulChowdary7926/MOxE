import type { Failure } from '../suites/base-suite';

export interface Bug extends Failure {
  id: string;
  timestamp: string;
}

export interface Fix {
  id: string;
  bugId: string;
  component: string;
  description: string;
  filesChanged: string[];
  timestamp: string;
}

export class BugTracker {
  private bugs: Bug[] = [];
  private fixes: Fix[] = [];

  addFailures(failures: Failure[]) {
    for (const f of failures) {
      const bug: Bug = {
        ...f,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
      };
      this.bugs.push(bug);
      this.logBug(bug);
    }
  }

  addFix(fix: Fix) {
    this.fixes.push(fix);
    this.logFix(fix);
  }

  getRemainingBugs(): Bug[] {
    const fixedIds = new Set(this.fixes.map((f) => f.bugId));
    return this.bugs.filter((b) => !fixedIds.has(b.id));
  }

  private logBug(bug: Bug) {
    // eslint-disable-next-line no-console
    console.error(
      `BUG [${bug.severity}] in ${bug.suite}/${bug.testName}: ${bug.message} (${bug.timestamp})`,
    );
  }

  private logFix(fix: Fix) {
    // eslint-disable-next-line no-console
    console.log(
      `FIX applied for bug ${fix.bugId} in ${fix.component}: ${fix.description} (${fix.timestamp})`,
    );
  }
}

