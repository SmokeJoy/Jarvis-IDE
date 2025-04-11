import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 50
    }
  },
  expect: {
    toMatchSnapshot: { 
      threshold: 0.2,
      maxDiffPixels: 100
    }
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000
  },
  retries: 1,
  workers: 1
};

export default config; 