// src/pages/Homepage.js

/**
 * Homepage — Page Object for the EventApp authenticated homepage / dashboard.
 * Extends BasePage so all interactions use the wrapped, logged Playwright methods.
 *
 * Rule: Never add expect() assertions inside this class — keep assertions in spec files.
 *
 * Available methods:
 *   isAt()                      — assert we are on the homepage URL
 *   verifyHomepageLoaded()      — confirm the page heading is visible after login
 *   clickDilliWalaMelaEvent()   — click the Dilli Diwali Mela event card
 *   logout()                    — click the logout button
 */

import { BasePage }      from './BasePage.js';
import { consoleLogger } from '../utils/loggerUtil.js';

export class HomePage extends BasePage {

  // ── Locators ──────────────────────────────────────────────────────────────
  // Defined once in the constructor — update selectors here if the app changes.

  constructor(page) {
    super(page);

    this.pageHeading         = page.getByText('Amazing Events');
    this.userAccountMenu     = page.locator('[data-testid="user-account-menu"]');
    this.dilliWalaMelaEvent  = page.getByText('Dilli Diwali Mela');
    this.logoutBtn           = page.getByTestId('logout-btn');

    this.pageName = 'Homepage';
  }

  // ── Page Guard ────────────────────────────────────────────────────────────

  /**
   * Confirms we are on the homepage by waiting for the root URL pattern.
   * Call at the start of tests that must begin from the authenticated homepage.
   */
  async isAt() {
    consoleLogger.info(`${this.pageName}.isAt: Waiting for homepage URL`);
    await this.page.waitForURL('https://eventhub.rahulshettyacademy.com/');
  }

  // ── Verification ──────────────────────────────────────────────────────────

  /**
   * Verifies the homepage loaded correctly after login by checking the main heading.
   * Called after login to confirm the authenticated state before proceeding.
   */
  async verifyHomepageLoaded() {
    consoleLogger.info(`${this.pageName}.verifyHomepageLoaded: Verifying homepage heading is visible`);
    await this.waitForVisible(this.pageHeading, 10000);
    consoleLogger.info(`${this.pageName}.verifyHomepageLoaded: Homepage loaded and verified`);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Clicks the Dilli Diwali Mela event card on the homepage.
   */
  async clickDilliWalaMelaEvent() {
    consoleLogger.info(`${this.pageName}.clickDilliWalaMelaEvent: Clicking event card`);
    await this.click(this.dilliWalaMelaEvent);
    consoleLogger.info(`${this.pageName}.clickDilliWalaMelaEvent: Event card clicked`);
  }

  /**
   * Clicks the logout button to end the authenticated session.
   */
  async logout() {
    consoleLogger.info(`${this.pageName}.logout: Clicking logout button`);
    await this.click(this.logoutBtn);
    consoleLogger.info(`${this.pageName}.logout: Logged out successfully`);
  }
}
