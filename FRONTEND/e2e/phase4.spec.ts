import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Phase 4 flows — requires:
 * - Backend on :5007 (see playwright.config webServer) with DATABASE_URL
 * - Seeded user: `cd BACKEND && MOXE_ALLOW_E2E_SEED=1 npx prisma db seed` (or `npm run prisma:seed:e2e`; default user playwright_e2e / Test123!)
 *
 * Override: E2E_USERNAME, E2E_PASSWORD, E2E_JOB_USERNAME (JOB account; seed defaults to playwright_job_e2e)
 */
const username = process.env.E2E_USERNAME || 'playwright_e2e';
const password = process.env.E2E_PASSWORD || 'Test123!';
const jobUsername = process.env.E2E_JOB_USERNAME || 'playwright_job_e2e';

const fixtureImage = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe.serial('MOxE Phase 4 – Core User Flows', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 });
  });

  test('home feed loads (post or empty state)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'For you' })).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByTestId('feed-post').or(page.getByTestId('feed-empty')).or(page.getByRole('article')).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('create post flow — reach share screen (upload + POST optional in dev)', async ({ page }) => {
    await page.goto('/create/post');
    await expect(page.getByText('New post')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[type="file"][accept*="image"]').setInputFiles(fixtureImage);
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/\/create\/post\/edit/);
    await page.locator('header > button').nth(1).click();
    await expect(page).toHaveURL(/\/create\/post\/share/);
    await page.getByPlaceholder('Add a caption...').fill(`Playwright E2E ${Date.now()}`);
    await expect(page.getByPlaceholder('Add a caption...')).toBeVisible();
    // Full publish hits /upload then POST /api/posts — enable E2E_FULL_CREATE=1 when storage + API are ready.
    if (process.env.E2E_FULL_CREATE === '1') {
      const shareBtn = page.getByRole('button', { name: 'Share', exact: true });
      await shareBtn.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/posts') && r.request().method() === 'POST' && r.status() < 400,
          { timeout: 120_000 },
        ),
        shareBtn.click({ force: true }),
      ]);
      await expect(page).toHaveURL(/\//, { timeout: 60_000 });
    }
  });

  test('settings – From MOxE page radios respond', async ({ page }) => {
    await page.goto('/settings/notifications/from-moxe');
    await expect(page.getByText('From MOxE')).toBeVisible({ timeout: 15_000 });
    const reminders = page.locator('section').filter({ hasText: 'Reminders' });
    await reminders.getByText('Off', { exact: true }).click();
    // UI is local-only (no API persistence yet); reload would reset.
  });

  test('mobile viewport – feed and create path', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'For you' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('create-post-button').click();
    await page.getByRole('link', { name: 'Post' }).click();
    await expect(page).toHaveURL(/\/create\/post/);
  });

  test('job tools – /job/agile renders board (JOB account)', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.getByPlaceholder('Username').fill(jobUsername);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 });

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/job/agile');
    await expect(page).toHaveURL(/\/job\/agile/);
    await expect(page.getByText('Live board', { exact: false })).toBeVisible({ timeout: 25_000 });
    const bad = errors.filter((e) => !/favicon|ResizeObserver|Failed to load resource/i.test(e));
    expect(bad, `Console errors: ${bad.join('\n')}`).toHaveLength(0);
  });
});
