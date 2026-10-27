import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  assetsInclude: ['**/*.glb'],
  // On this Windows machine "localhost" resolves to IPv6 only and pages never load. Use IPv4.
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  // The lazy 3D chunk holds three.js and is large by design (budget: 600 KB gzip).
  build: { chunkSizeWarningLimit: 1600 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
