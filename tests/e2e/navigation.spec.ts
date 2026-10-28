import { expect, test } from '@playwright/test';

test.describe('island navigation', () => {
  test('a label opens its panel, Esc closes it and focus returns', async ({ page }) => {
    await page.goto('/');
    const label = page.getByRole('button', { name: /^Radio Gigabit/ });
    await label.click();

    const panel = page.getByRole('dialog');
    await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Senior Full Stack Engineer');
    await expect(panel.getByText('LLM test generator', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/#\/radio$/);

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/#\/$/);
    await expect(label).toBeFocused();
  });

  test('deep links open an island and Back returns', async ({ page }) => {
    await page.goto('/#/market');
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(
      'Senior Frontend Developer',
    );
    await page.getByRole('button', { name: /^Previous island/ }).click();
    await expect(page).toHaveURL(/#\/arena$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/market$/);
  });

  test('the Islands menu reaches every island', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Islands/ }).click();
    const items = page.getByRole('list', { name: 'Islands' }).getByRole('button');
    await expect(items).toHaveCount(7);
    await items.filter({ hasText: 'Home' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(
      'Renat Kalimulin',
    );
  });

  test('works with the keyboard only', async ({ page }) => {
    await page.goto('/');
    // Tab through the top bar to the first island label, then open it.
    const firstLabel = page.getByRole('button', { name: /^Home/ });
    await expect(firstLabel).toBeVisible();
    for (
      let i = 0;
      i < 10 && !(await firstLabel.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press('Tab');
    }
    await expect(firstLabel).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/#\/workshop$/);
  });
});

test.describe('classic CV', () => {
  test('shows the whole CV and links to the PDF', async ({ page, request }) => {
    await page.goto('/#/cv');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renat Kalimulin');
    for (const company of [
      'MONETECH SERVICIOS',
      'Olimpbet KZ',
      'Radio Gigabit',
      'Eco Activists',
      'JSC NPP Salyut',
    ]) {
      await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
    }
    await expect(page.locator('canvas')).toHaveCount(0);

    const pdf = await request.get('/cv.pdf');
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('pdf');
  });
});
