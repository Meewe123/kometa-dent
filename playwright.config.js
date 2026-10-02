import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;

/**
 * Browser tests run against the real server in demo mode (in-memory data,
 * seeded appointments, admin token "demo"), so they need no setup.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'node server.js --demo',
    env: { PORT: String(PORT), LOG_LEVEL: 'warn' },
    url: `http://localhost:${PORT}/healthz`,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
  ],
});
