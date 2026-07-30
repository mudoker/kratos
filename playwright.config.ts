import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config();

export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 180 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 30000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3005',

    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 60000,
    /* Maximum time for navigation actions like `page.goto()`. */
    navigationTimeout: 60000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers and mobile viewports */
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run build && PORT=3005 npm start',
    url: 'http://localhost:3005/login',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      BETTER_AUTH_URL: 'http://localhost:3005',
      NEXT_PUBLIC_BETTER_AUTH_URL: 'http://localhost:3005',
      PORT: '3005',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: '/tmp/kratos-test-results',
});
