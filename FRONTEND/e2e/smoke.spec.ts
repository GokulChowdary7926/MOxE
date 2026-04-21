import { test, expect } from '@playwright/test';

test.describe('UI smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    const uiTimeout = 15000;
    await expect(page.getByPlaceholder('Username')).toBeVisible({ timeout: uiTimeout });
    await expect(page.getByPlaceholder('Password')).toBeVisible({ timeout: uiTimeout });
    // "Log in" alone matches both submit and "Log in with Google" — require exact label.
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible({ timeout: uiTimeout });
    await expect(page.getByRole('button', { name: 'Log in with Google' })).toBeVisible({ timeout: uiTimeout });
  });
});
