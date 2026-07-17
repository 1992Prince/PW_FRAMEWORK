// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/tests',
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
 
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : undefined,
 
  reporter: [['html', { open: 'never' }],
              ["allure-playwright"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    trace: 'on-first-retry',
    headless: true,
  },

  globalSetup: './src/setup/global-setup.js',
  globalTeardown: './src/setup/global-teardown.js',

  projects: [
    {
      name: 'eventapp',
      testDir: 'src/tests',
      //use: { ...devices['Desktop Chrome'] },
    },

  ],
  
});

