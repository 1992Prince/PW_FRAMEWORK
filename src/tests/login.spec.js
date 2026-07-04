// src/tests/login.spec.js

/**
 * Login tests for EventHub.
 * Import test and expect from the auth fixture — NOT from @playwright/test.
 * The fixture handles login automatically before each test.
 */

import { test, expect } from "../fixtures/auth.fixture.js";
import { consoleLogger } from '../utils/loggerUtil.js';

// import test data from JSON file
import testData from "../testdata/registration.json" assert { type: "json" };

test("should land on homepage with correct URL and title after login", async ({
  pageManager,
}) => {
  // Login is already done by the fixture — just validate the post-login state

  test.step("Login Successful - ", async () => {
      consoleLogger.info("Login Successful - ", testData.validRegistration[0].email);
    });

  test.step("Checkout assertion - ", async () => {
      await expect(pageManager.page).toHaveURL(
    "https://eventhub.rahulshettyacademy.com/",
  );
    });

  await expect(pageManager.page).toHaveURL(
    "https://eventhub.rahulshettyacademy.com/",
  );
  await expect(pageManager.page).toHaveTitle("EventHub — Discover & Book Events");
});


/**
 * In JSON file we have objects with different keys like "validRegistration" and 
 * "invalidEmailFormat".
 * after importing the JSON file, we will get JSON object with keys and values.
 * we can access the values of the keys using dot notation or bracket notation.
 * for example, to access the value of "validRegistration" key, we can use
 * testdata.validRegistration or testdata["validRegistration"].
 * the value of "validRegistration" key is an array of objects, so we can loop through the array and run the test for each object.
 * we can use for of loop to iterate through the array and run the test for each object.
 */

test("DDT tests", async ({
  pageManager,
}) => {
  // Login is already done by the fixture — just validate the post-login state

  

  await expect(pageManager.page).toHaveURL(
    "https://eventhub.rahulshettyacademy.com/",
  );
  await expect(pageManager.page).toHaveTitle("EventHub — Discover & Book Events");

  consoleLogger.info("Running DDT tests for valid registration data - ", testData.validRegistration[0].email);
  consoleLogger.info("Running DDT tests for valid registration data - ", testData.validRegistration[0].password);
});


//write here all login, negative login, forgot password, reset password, logout, etc. test cases
