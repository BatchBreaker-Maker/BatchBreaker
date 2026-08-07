import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  // The dev DB is a remote Neon instance, not local — round trips (and this
  // test's many sequential login/logout cycles) are slower than a typical
  // local-Postgres CI setup, so defaults here are more generous than usual.
  // A Neon compute that's scaled to zero can take well over 10s to wake on
  // the first query after a period of inactivity (observed once taking ~86s
  // on a single request), hence the generous expect timeout below.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 100_000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
