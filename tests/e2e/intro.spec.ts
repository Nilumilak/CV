import { expect, test, type Page } from '@playwright/test';

/**
 * Enter shows once the sky is ready, while the islands still load and upload below the clouds.
 * On the CPU renderer tests use, that makes the welcome frames very slow, so allow time.
 */
const enterQuietly = async (page: Page) => {
  const enter = page.getByRole('button', { name: 'Enter quietly' });
  // Click inside the page. Playwright's click can still be sending pointer events on the
  // next frame, which is when any click becomes "skip", so the dive would end immediately.
  await expect(enter).toBeVisible({ timeout: 90_000 });
  await enter.evaluate((el: HTMLButtonElement) => el.click());
};

/**
 * Skip starts listening on the frame after Enter, so the key that pressed Enter is not
 * also a skip. Under the software renderer that frame can land late; wait for it.
 */
const skipWithKeyboard = async (page: Page) => {
  await expect(page.getByRole('button', { name: /Skip/ })).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await page.keyboard.press('Space');
};

test.describe('welcome and fly-in', () => {
  test.beforeEach(() => test.slow());

  test('welcome screen, then Skip lands in the world', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to my World');
    await enterQuietly(page);

    // Click inside the page. Playwright's own click scrolls the button into view first,
    // and on the slow phone renderer the dive ends and removes Skip before that scroll finishes.
    const skip = page.getByRole('button', { name: /Skip/ });
    await expect(skip).toBeVisible();
    await skip.evaluate((el: HTMLButtonElement) => el.click());
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
    await skipWithKeyboard(page);
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
