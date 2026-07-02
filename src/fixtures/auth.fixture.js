// src/fixtures/auth.fixture.js

/**
 * Custom Playwright fixture that handles login before each test.
 *
 * Why a fixture?
 *   - Tests should not repeat login boilerplate — one place to maintain it.
 *   - The fixture runs before every test that uses it and hands over
 *     a fully authenticated `page` along with a ready `loginPage` object.
 *
 * Exports:
 *   test   — extended Playwright test with `loginPage` fixture built in
 *   expect — re-exported so spec files only need one import from this file
 *
 * Usage in spec files (import from fixture, NOT from @playwright/test):
 *   import { test, expect } from '../fixtures/auth.fixture.js';
 *
 *   test('my test', async ({ loginPage }) => {
 *     // page is already logged in, loginPage methods are ready to use
 *     await loginPage.goto(config.appUrl);
 *   });
 */

import { test as base, expect } from '@playwright/test';
import { LoginPage }             from '../pages/LoginPage.js';
import { config }                from '../config/config.js';

const test = base.extend({

  // `loginPage` fixture — performs login once before the test body runs
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);

    // Log in using credentials and URL from central config
    // These can be overridden at CI level via environment variables
    await loginPage.login(config.appUrl, config.serviceUser, config.servicePassword);

    // Hand the authenticated loginPage instance to the test
    await use(loginPage);

    // write logout code here i.e. clean up
  },
});

export { test, expect };
