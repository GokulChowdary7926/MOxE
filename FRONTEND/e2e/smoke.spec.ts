import { test, expect } from '@playwright/test';

test.describe('UI smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    // "Log in" alone matches both submit and "Log in with Google" — require exact label.
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in with Google' })).toBeVisible();
  });
});
