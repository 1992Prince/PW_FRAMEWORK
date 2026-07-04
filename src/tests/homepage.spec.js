// src/tests/homepage.spec.js

/**
 * Homepage tests for EventHub.
 * Login is handled by the auth fixture — no login boilerplate needed here.
 * Import test and expect from the fixture, NOT from @playwright/test.
 */

import { test, expect } from "../fixtures/auth.fixture.js";

test("should display homepage heading after login @sanity @bvt @regression", async ({
  pageManager,
}) => {
  const homepage = pageManager.getHomePage();

  await homepage.isAt();
  await homepage.verifyHomepageLoaded();
});

test("should display Dilli Diwali Mela event on homepage @regression", async ({
  pageManager,
}) => {
  const homepage = pageManager.getHomePage();

  await homepage.isAt();
  await expect(homepage.dilliWalaMelaEvent).toBeVisible();
});

test("should navigate away after clicking Dilli Diwali Mela event @regression @bvt", async ({
  pageManager,
}) => {
  const homepage = pageManager.getHomePage();

  await homepage.isAt();
  await homepage.clickDilliWalaMelaEvent();

  // After clicking the event card, URL should change away from the homepage
  await expect(pageManager.page).not.toHaveURL(
    "https://eventhub.rahulshettyacademy.com/",
  );
});

/**
 *  To run tests with specific tags, use the following commands:
 * npx playwright test --grep "@sanity"
 * npx playwright test --grep "@regression|@sanity"
 */

/*
 * ── GOOD PRACTICES FOR ASSERTIONS IN SPEC FILES ───────────────────────────
 *
 * 1. KEEP ALL ASSERTIONS AT THE TEST LEVEL (here in spec files, never in page objects)
 *    Page object methods should only perform actions and return data.
 *    The spec file decides whether the returned data is correct.
 *
 * 2. FOR TEXT / URL / TITLE VALIDATION — return from page object, assert here:
 *
 *    // In Homepage.js add getter methods:
 *    async getPageTitle()   { return await this.page.title(); }
 *    async getCurrentUrl()  { return this.page.url(); }
 *    async getHeadingText() { return await this.getText(this.pageHeading); }
 *
 *    // In spec, store the returned value and assert:
 *    const title = await homepage.getPageTitle();
 *    expect(title).toBe('EventHub — Discover & Book Events');
 *
 *    const url = await homepage.getCurrentUrl();
 *    expect(url).toContain('eventhub.rahulshettyacademy.com');
 *
 *    const heading = await homepage.getHeadingText();
 *    expect(heading).toBe('Amazing Events');
 *
 * 3. OTHER COMMON ASSERTIONS TO ADD AS COVERAGE GROWS:
 *
 *    // Visibility
 *    await expect(homepage.dilliWalaMelaEvent).toBeVisible();
 *    await expect(homepage.userAccountMenu).toBeVisible();
 *
 *    // Count — e.g. number of event cards rendered on the page
 *    const cardCount = await loginPage.page.locator('.event-card').count();
 *    expect(cardCount).toBeGreaterThan(0);
 *
 *    // Attribute — e.g. a button is disabled
 *    await expect(homepage.logoutBtn).toHaveAttribute('disabled');
 *
 *    // Soft assertions — run all checks, report all failures at end (don't stop on first)
 *    expect.soft(await homepage.getPageTitle()).toBe('EventHub — Discover & Book Events');
 *    expect.soft(await homepage.getHeadingText()).toBe('Amazing Events');
 */
