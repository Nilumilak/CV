// Renders the classic CV page (#/cv) of the production build to public/cv.pdf.
// Usage: npm run pdf   (builds first)
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const PORT = 4330;
const out = fileURLToPath(new URL('../public/cv.pdf', import.meta.url));

const server = await preview({
  preview: { host: '127.0.0.1', port: PORT, strictPort: true },
  logLevel: 'warn',
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/#/cv`);
  await page.locator('main h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
  await server.close();
}
