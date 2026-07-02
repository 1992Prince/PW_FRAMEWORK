// src/pages/BasePage.js

/**
 * BasePage wraps Playwright actions with defensive checks and logging.
 * All page classes extend this — never call raw Playwright API in page files.
 *
 * Defensive code: even though Playwright has auto-wait, we add explicit
 * visibility/readiness checks to catch flaky elements early with clear errors.
 *
 * Available methods:
 *   goto(url)                          — navigate, wait for DOM ready (30s)
 *   click(locator)                     — assert visible, then click
 *   fill(locator, value)               — clear field, then fill
 *   pressSequentially(locator, value)  — type char-by-char (autocomplete fields)
 *   getText(locator)                   — return innerText of element
 *   isVisible(locator)                 — return true/false
 *   selectOption(locator, label)       — pick <select> option by visible label
 *   waitForVisible(locator, timeout)   — explicit wait for element to appear
 *   wait(ms)                           — fixed delay, use sparingly
 */

import { consoleLogger } from '../utils/loggerUtil.js';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Resolves a locator argument to a Playwright Locator.
   * Accepts either a CSS/text string or an already-resolved Playwright Locator object.
   * This lets page classes use semantic locators (getByPlaceholder, getByLabel, getByText)
   * and still call BasePage methods (fill, click, etc.) without wrapping everything in strings.
   */
  #resolve(locator) {
    return typeof locator === 'string' ? this.page.locator(locator) : locator;
  }

  // Navigate to a URL — waits for DOM to be fully loaded (30s timeout)
  async goto(url) {
    consoleLogger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  // Click an element — asserts visible first as defensive check before clicking
  async click(locator) {
    consoleLogger.debug(`Clicking: ${locator}`);
    const el = this.#resolve(locator);
    await el.waitFor({ state: 'visible', timeout: 5000 });
    await el.click();
  }

  // Fill a text input — clears existing content first, then fills
  async fill(locator, value) {
    consoleLogger.debug(`Filling "${locator}" with value`);
    const el = this.#resolve(locator);
    await el.waitFor({ state: 'visible', timeout: 5000 });
    await el.clear();
    await el.fill(value);
  }

  // Type character-by-character (useful for fields with input masking / autocomplete)
  async pressSequentially(locator, value, delay = 50) {
    consoleLogger.debug(`Typing sequentially into: ${locator}`);
    await this.#resolve(locator).pressSequentially(value, { delay });
  }

  // Read visible text from an element
  async getText(locator) {
    const text = await this.#resolve(locator).innerText();
    consoleLogger.debug(`getText "${locator}" → "${text}"`);
    return text;
  }

  // Check whether an element is visible — returns true/false immediately, no throw
  async isVisible(locator) {
    const visible = await this.#resolve(locator).isVisible();
    consoleLogger.debug(`isVisible "${locator}" → ${visible}`);
    return visible;
  }

  // Select an option in a <select> dropdown by visible label
  async selectOption(locator, label) {
    consoleLogger.debug(`Selecting "${label}" in: ${locator}`);
    await this.#resolve(locator).selectOption({ label });
  }

  // Wait for an element to be visible (default 5s, override as needed)
  async waitForVisible(locator, timeout = 5000) {
    consoleLogger.debug(`Waiting for visible: ${locator}`);
    await this.#resolve(locator).waitFor({ state: 'visible', timeout });
  }

  // Pause execution for a fixed time — use sparingly, prefer waitForVisible
  async wait(ms) {
    consoleLogger.debug(`Waiting ${ms}ms`);
    await this.page.waitForTimeout(ms);
  }
}
