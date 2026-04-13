import { defineConfig, devices } from '@playwright/test';

const isCi = !!process.env.CI;
const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

/**
 * UI E2E tests. Run: npm run test:e2e
 * - Starts BACKEND (port 5007) then Vite (3001) so `/api` proxy works.
 * - Local: reuse existing servers when not CI (`reuseExistingServer`).
 * - Manual: `PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e` if you start both yourself.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(skipWebServer
    ? {}
    : {
        webServer: [
          {
            command: 'cd ../BACKEND && npm run dev',
            url: 'http://127.0.0.1:5007/health',
            // Avoid stale bundles when iterating on E2E selectors / components.
            reuseExistingServer: isCi,
            timeout: 120_000,
            stdout: 'pipe',
            stderr: 'pipe',
          },
          {
            command: isCi ? 'npm run preview' : 'npm run dev',
            url: 'http://127.0.0.1:3001',
            reuseExistingServer: isCi,
            timeout: isCi ? 90_000 : 300_000,
            stdout: 'inherit',
            stderr: 'inherit',
          },
        ],
      }),
});
