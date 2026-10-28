import { expect, test } from '@playwright/test';

// A browser with WebGL switched off must still get the full CV.
test.use({ launchOptions: { args: ['--disable-3d-apis'] } });

test('falls back to the classic CV without WebGL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('cannot show the 3D version');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renat Kalimulin');
  await expect(page.locator('canvas')).toHaveCount(0);
});
