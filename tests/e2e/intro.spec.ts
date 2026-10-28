import { expect, test, type Page } from '@playwright/test';

const enterQuietly = (page: Page) =>
  page.getByRole('button', { name: 'Enter quietly' }).click({ timeout: 30_000 });

test.describe('welcome and fly-in', () => {
  test('welcome screen, then Skip lands in the world', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to my World');
    await enterQuietly(page);

    await page.getByRole('button', { name: /Skip/ }).click();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Radio Gigabit/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to my World' })).toHaveCount(0);
  });

  test('the dive finishes on its own', async ({ page }) => {
    await page.goto('/');
    await enterQuietly(page);
    await expect(page.getByRole('button', { name: /Skip/ })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Skip/ })).toHaveCount(0);
  });

  test('a deep link lands on its island after the intro', async ({ page }) => {
    await page.goto('/#/radio');
    await enterQuietly(page);
    await page.keyboard.press('Space');
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(
      'Senior Full Stack Engineer',
    );
  });

  test('"Just the CV" opens the classic page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Just the CV, please' }).click();
    await expect(page).toHaveURL(/#\/cv$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renat Kalimulin');
  });

  test('the sound toggle switches on and off', async ({ page }) => {
    await page.goto('/?skipIntro');
    const toggle = page.getByRole('button', { name: 'Sound' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('skips the dive', async ({ page }) => {
    await page.goto('/');
    await enterQuietly(page);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Skip/ })).toHaveCount(0);
  });
});
