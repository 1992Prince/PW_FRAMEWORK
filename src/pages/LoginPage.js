// src/pages/LoginPage.js

/**
 * LoginPage — Page Object for the EventApp login screen.
 * Extends BasePage so all actions go through the wrapped, logged Playwright methods.
 *
 * Smart Login Logic (3 modes):
 *   MODE 1 — Email + password visible  → full login flow
 *   MODE 2 — Only password visible     → email pre-filled, enter password only
 *   MODE 3 — Neither visible           → already authenticated, validate homepage
 *
 * Available methods:
 *   isAt()                             — assert we are on the login URL
 *   login(url, email, password)        — straight login, no mode detection
 *   smartLogin(url, email, password)   — auto-detects login state and acts accordingly
 *   validateInvalidLogin(email, pass)  — attempt bad credentials, assert error message shown
 *   getErrorMessage()                  — return the current login error message text
 */

import { BasePage }       from './BasePage.js';
import { consoleLogger }  from '../utils/loggerUtil.js';

export class LoginPage extends BasePage {

  // ── Locators ──────────────────────────────────────────────────────────────
  // Defined once in the constructor and reused across all methods.
  // Update these selectors when the app's markup changes — no other code needs to change.

  constructor(page) {
    super(page);

    this.emailInput       = page.getByPlaceholder('you@email.com');
    this.passwordInput    = page.getByLabel('Password');
    this.loginButton      = page.getByText('Sign In');
    // homepageElement — a landmark that only appears after a successful login
    this.homepageElement  = page.getByText('Amazing Events');
    this.loginErrorMessage = page.getByText('Invalid email or password');

    // Used in log messages to identify this page in shared logs
    this.pageName = 'LoginPage';
  }

  // ── Page Guard ────────────────────────────────────────────────────────────

  /**
   * Confirms we are on the login page by waiting for the /login URL pattern.
   * Call this at the start of tests that must begin from the login screen.
   */
  async isAt() {
    consoleLogger.info(`${this.pageName}.isAt: Waiting for login URL`);
    await this.page.waitForURL('**/login**');
  }

  // ── Standard Login ────────────────────────────────────────────────────────

  /**
   * Straightforward login — navigates to URL, fills credentials, submits.
   * Use this when you are certain the full login form will be displayed.
   *
   * @param {string} url      Application URL to navigate to
   * @param {string} email    User email
   * @param {string} password User password
   */
  async login(url, email, password) {
    consoleLogger.info(`${this.pageName}.login: url=${url} | email=${email}`);

    await this.goto(url);
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton.last()); // .last() avoids multiple-match issue if Sign In appears twice

    await this.waitForVisible(this.homepageElement, 10000);
    consoleLogger.info(`${this.pageName}.login: Login successful — homepage element visible`);
    await this.wait(5000);

  }

//   // ── Smart Login ───────────────────────────────────────────────────────────

//   /**
//    * Detects the current login page state and takes the appropriate action.
//    * Useful when the same test suite runs against sessions that may already be authenticated.
//    *
//    * @param {string} url      Application URL to navigate to
//    * @param {string} email    User email
//    * @param {string} password User password
//    */
//   async smartLogin(url, email, password) {
//     consoleLogger.info(`${this.pageName}.smartLogin: url=${url} | email=${email}`);
//     await this.goto(url);

//     try {

//       if (await this.isVisible(this.emailInput)) {
//         // MODE 1 — Full login form shown (email + password fields both present)
//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 1 — full login form detected`);

//         await this.fill(this.emailInput, email);
//         await this.fill(this.passwordInput, password);
//         await this.click(this.loginButton.last());
//         await this.waitForVisible(this.homepageElement, 10000);

//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 1 complete`);

//       } else if (await this.isVisible(this.passwordInput)) {
//         // MODE 2 — Email already pre-filled (SSO / remembered session), only password needed
//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 2 — email pre-filled, entering password only`);

//         await this.fill(this.passwordInput, password);
//         await this.click(this.loginButton);
//         await this.waitForVisible(this.homepageElement, 10000);

//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 2 complete`);

//       } else {
//         // MODE 3 — No login form at all, assume user is already authenticated
//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 3 — no login form, validating authenticated state`);

//         await this.waitForVisible(this.homepageElement, 10000);

//         consoleLogger.info(`${this.pageName}.smartLogin: MODE 3 complete — homepage element confirmed`);
//       }

//     } catch (error) {
//       // Log the failure before re-throwing so the caller's stack trace is preserved
//       consoleLogger.error(`${this.pageName}.smartLogin: Failed — ${error.message}`);
//       throw error;
//     }
//   }

  // ── Negative / Validation ─────────────────────────────────────────────────

  /**
   * Attempts a login with the given credentials and asserts that the error message appears.
   * Use in negative test cases to verify the app rejects bad credentials.
   *
   * @param {string} email    Invalid email to submit
   * @param {string} password Invalid password to submit
   */
  async validateInvalidLogin(email, password) {
    consoleLogger.info(`${this.pageName}.validateInvalidLogin: Testing invalid credentials`);

    if (await this.isVisible(this.emailInput)) {
      await this.fill(this.emailInput, email);
      await this.fill(this.passwordInput, password);
      await this.click(this.loginButton.last());

      await this.waitForVisible(this.loginErrorMessage, 5000);
      consoleLogger.info(`${this.pageName}.validateInvalidLogin: Error message visible as expected`);
    } else {
      consoleLogger.warn(`${this.pageName}.validateInvalidLogin: Email input not visible — skipping`);
    }
  }

  /**
   * Returns the text of the login error message element.
   * Call after a failed login attempt to assert the exact message in your test.
   *
   * @returns {Promise<string>}
   */
  async getErrorMessage() {
    return await this.getText(this.loginErrorMessage);
  }
}
