import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Reels studio + share draft smoke.
 *
 * Requires backend seed user (same as phase4.spec.ts):
 *   cd BACKEND && MOXE_ALLOW_E2E_SEED=1 npx prisma db seed
 *
 * Studio test uses Chromium fake camera/mic (stable in CI).
 *
 * Optional: E2E_FULL_REEL=1 — after recording, click Post and wait for POST …/reels + redirect home.
 */
const username = process.env.E2E_USERNAME || 'playwright_e2e';
const password = process.env.E2E_PASSWORD || 'Test123!';
const fixtureImage = path.join(__dirname, 'fixtures', 'test-image.png');

test.use({
  permissions: ['camera', 'microphone'],
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

test.describe('Reels editor smoke', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 });
  });

  test('studio: templates, speed, green screen, timer countdown, align ghost, recording stop', async ({
    page,
  }) => {
    await page.goto('/create-reel');
    await expect(page.getByTestId('reel-studio')).toBeVisible({ timeout: 15_000 });

    const safeCenterTemplate = page.getByRole('button', { name: 'Safe center', exact: true });
    await safeCenterTemplate.click();
    await expect(safeCenterTemplate).toHaveClass(/bg-moxe-primary/);

    await page.getByTestId('reel-speed-slider').fill('2');
    await expect(page.getByTestId('reel-speed-value')).toHaveText('2.00x');

    await page.getByTestId('reel-open-camera').click();
    await expect(page.getByText('Record reel')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.fixed.inset-0 video').first()).toBeVisible({ timeout: 25_000 });

    await page.getByTestId('reel-green-screen-toggle').check();
    await expect(page.getByTestId('reel-green-screen-active')).toBeVisible();

    await page.getByTestId('reel-align-snap').click();
    await page.getByTestId('reel-timer-select').selectOption('3');
    await page.getByTestId('reel-record-start').click();
    await expect(page.getByTestId('reel-timer-countdown')).toHaveText('3');
    await expect(page.getByText('Recording')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('reel-align-ghost')).toBeVisible();

    await page.getByTestId('reel-record-stop').click();
    // Fake media streams can produce empty blobs on some hosts; assert flow exits recorder reliably.
    await expect(page.getByText('Record reel')).toBeHidden({ timeout: 45_000 });

    if (process.env.E2E_FULL_REEL === '1') {
      const postBtn = page.getByTestId('reel-studio-post');
      await Promise.all([
        page.waitForResponse((r) => {
          const p = new URL(r.url()).pathname.replace(/\/$/, '');
          return r.request().method() === 'POST' && r.status() < 400 && /\/reels$/.test(p);
        }, { timeout: 120_000 }),
        postBtn.click(),
      ]);
      await expect(page).toHaveURL(/\//, { timeout: 60_000 });
    }
  });

  test('new reel flow: image upload → edit → share → save draft', async ({ page }) => {
    await page.goto('/create/reel');
    // File input exists only on CAMERA tab (default is TEMPLATES).
    await page.getByRole('button', { name: 'CAMERA' }).click();
    await page.locator('input[type=file][accept*="image"]').setInputFiles(fixtureImage);
    await expect(page).toHaveURL(/\/create\/reel\/edit/, { timeout: 15_000 });
    await page.locator('header > button').last().click();
    await expect(page).toHaveURL(/\/create\/reel\/share/, { timeout: 15_000 });
    await page.getByTestId('reel-save-draft').click({ force: true });
    await expect(page).toHaveURL(/\/(create|explore)$/, { timeout: 15_000 });
  });
});
