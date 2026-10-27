import { preview } from 'vite';

export const E2E_PORT = 4321;

/**
 * Serves the production build from inside the Playwright process.
 * A separate web server process would work too, but force-killing it on Windows
 * takes several minutes, so the server is started and closed in-process instead.
 * Bound to 127.0.0.1: on Windows "localhost" can resolve to IPv6 only.
 */
export default async function globalSetup() {
  const server = await preview({
    preview: { host: '127.0.0.1', port: E2E_PORT, strictPort: true },
    logLevel: 'warn',
  });
  return async () => {
    await server.close();
  };
}
