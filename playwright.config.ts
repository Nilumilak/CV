import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT } from './tests/e2e/global-setup';

// `npm run e2e` builds first, then global-setup serves dist/ in-process.

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // The 3D scene renders on the CPU in tests (no GPU). Parallel pages starve each other
  // until clicks time out, so run one test at a time with a longer limit.
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  // Software WebGL on a busy machine can be slow; give visibility checks room.
  expect: { timeout: 15_000 },
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
