import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT } from './tests/e2e/global-setup';

// `npm run e2e` builds first, then global-setup serves dist/ in-process.

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    // Software WebGL so tests also run on CI machines without a GPU.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
