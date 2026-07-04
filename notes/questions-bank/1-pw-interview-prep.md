
# Playwright Interview Prep — Topic-Wise Question Bank (99 Qs)

Compiled and de-duplicated from all your sources (Otwani, Shetty/techSmartHire, the docx bank, and the other 4 PDFs). Selected for high probability of being asked — not everything, just what actually gets asked.

---

## 1. Architecture & Installation

1. What is Playwright and how does it differ from Selenium and Cypress?
2. Explain Playwright's architecture — how does it communicate with browsers (client library → driver/WebSocket → browser)?
3. What are the three browser engines Playwright supports, and how do you target each?
4. How do you install Playwright and initialize a new project? What does `npx playwright install` do that `npm install` doesn't?
5. What is `playwright.config.ts`, and what are its most important fields?
6. What is the `@playwright/test` package, and how is it different from using Playwright as a standalone library?

## 2. Core Objects — Browser, Context, Page

7. Explain the Browser → BrowserContext → Page hierarchy — what does each level represent?
8. How do you handle multiple browser contexts in Playwright, and why is BrowserContext often compared to an incognito window?
9. What's the difference between `browser.newPage()` and `context.newPage()`?
10. How do browser contexts improve test isolation and enable safe parallel execution?
11. Why doesn't Playwright reuse your system browser profile/session by default — how do stale sessions leak between tests, and how do you prevent it?

## 3. Locators & Selector Strategies

12. What locator strategies does Playwright support (CSS, text, role, placeholder, label, alt-text, testId, XPath)?
13. Why is `getByRole` considered the most recommended locator strategy?
14. How does `page.locator()` differ from `page.$()` / `page.querySelector()` (Locator object vs ElementHandle)?
15. What's the difference between `page.click()` and `locator.click()` — why is `locator.click()` preferred?
16. How do you locate elements inside an iframe using `frameLocator()`?
17. How do you handle Shadow DOM elements in Playwright?
18. How do you deal with dynamic/unstable selectors (auto-generated class names, data-driven IDs)?

## 4. Auto-Waiting & Actionability

19. What is auto-waiting in Playwright, and how does it work internally?
20. What actionability checks does Playwright run before an action (attached, visible, stable, enabled, receives events)?
21. How is Playwright's auto-waiting different from Selenium's implicit/explicit waits?
22. What's the difference between `locator.waitFor()` and `expect(locator).toBeVisible()`?
23. Hard wait vs smart wait — why should you avoid `page.waitForTimeout()`?

## 5. Waiting Strategies

24. What are the different types of waits in Playwright (auto-wait, waitForSelector, waitForNavigation, waitForLoadState, waitForFunction, waitForEvent)?
25. What is `page.waitForLoadState()`, and what's the difference between `load`, `domcontentloaded`, and `networkidle`?
26. How do `page.waitForResponse()` / `page.waitForRequest()` help synchronize UI and network activity?
27. What are the different timeout types (test, action, navigation, expect, global), and how do you configure each?
28. What's the difference between `page.setDefaultTimeout()` and `page.setDefaultNavigationTimeout()`?
29. What's the most common cause of "missing await" bugs, and how does it manifest?

## 6. Assertions (Expect API)

30. What is the `expect()` API, and how do web-first (async, auto-retrying) assertions differ from plain boolean checks?
31. List the commonly used matchers: `toBeVisible`, `toHaveText`, `toContainText`, `toHaveValue`, `toHaveURL`, `toHaveCount`, `toHaveAttribute`.
32. What's the difference between `toHaveText()` and `toContainText()`?
33. Hard assertions vs soft assertions — when do you use `expect.soft()`?
34. What is visual/screenshot assertion (`toHaveScreenshot`), and how do you mask dynamic content (timestamps, ads) so it doesn't fail?
35. How do you configure the expect timeout globally vs. per assertion?

## 7. Hooks & Fixtures

36. What is a fixture in Playwright Test, and how does it differ from a `beforeEach` hook?
37. What built-in fixtures does `@playwright/test` provide (`browser`, `context`, `page`, `request`, `browserName`)?
38. How do you create a custom fixture using `test.extend()`?
39. What is fixture scope (`test` vs `worker`), and when would you use a worker-scoped fixture?
40. Explain Playwright's test hooks (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`) and best practices around them.
41. How do you save and reuse authentication using `storageState` with fixtures/`globalSetup`, so you only log in once?

## 8. Test Annotations

42. How do you skip, mark as fixme, or slow-mark a test using `test.skip()`, `test.fixme()`, `test.slow()`?
43. How do you tag tests (`@smoke`, `@regression`) and run them selectively with `--grep` / `--grep-invert`?
44. How do you group tests with `test.describe()` and force serial execution with `test.describe.serial()`?
45. How do you parameterize/data-drive tests by iterating over an array?

## 9. Playwright Config File

46. What are the most important fields in `playwright.config.ts` (`testDir`, `timeout`, `retries`, `reporter`, `projects`)?
47. What goes inside the `use` block (`baseURL`, `headless`, `viewport`, `storageState`, `extraHTTPHeaders`)?
48. How do you configure multiple `projects` for cross-browser / cross-device testing?
49. How do you configure screenshot, video, and trace capture (`on`, `off`, `on-first-retry`, `retain-on-failure`)?
50. What is Playwright UI Mode, and how is it different from headed mode or the Inspector?
51. What is Codegen (`npx playwright codegen`) — practical use-cases and its limitations?

## 10. CLI Commands

52. What are the most commonly used Playwright CLI commands (`test`, `codegen`, `show-report`, `show-trace`, `install`)?
53. How do you filter/run specific tests from CLI (`--grep`, `--project`, file path, `:line`)?
54. How do you run tests headed, with `--slowMo`, or in `--debug` mode from CLI?
55. How do you install/update browsers via CLI (`install`, `install --with-deps`, `uninstall`)?
56. How do you configure reporters from CLI (`--reporter=list,html,json,junit`)?

## 11. Debugging & Tracing

57. What debugging tools does Playwright provide (Inspector, `--debug`, `--headed`, `page.pause()`)?
58. What is the Trace Viewer, and what does it capture (DOM snapshots, screenshots, network, console)?
59. How do you enable trace collection and view it with `npx playwright show-trace`?
60. What is `PWDEBUG`, and what modes does it enable?
61. How do you capture and inspect browser console logs/errors within a test?
62. How do you debug a flaky test that only fails in CI, using trace and video artifacts?

## 12. Network Interception & API Testing

63. What is network interception, and what is `page.route()` used for?
64. How do you mock a specific API endpoint to return custom JSON, or block/abort certain requests?
65. What's the difference between `route.fulfill()`, `route.continue()`, and `route.abort()`?
66. Can Playwright be used for API testing — what's the advantage over a tool like Postman? What is `APIRequestContext`?
67. How do you send GET/POST/PUT/DELETE requests and assert on status codes, headers, and JSON body?
68. How do you combine UI and API testing in one test (set up data via API, verify via UI)?
69. How do you create a persistent request context with shared auth headers using `request.newContext()`?

## 13. CI/CD Integration

70. How do you integrate Playwright into GitHub Actions, Jenkins, or Azure DevOps?
71. Why is `npx playwright install --with-deps` important in CI environments?
72. What are common reasons a test passes locally but fails in CI, and how do you diagnose them?
73. How do you configure retries specifically for CI?
74. How do you upload HTML reports and trace files as CI artifacts?
75. What is `globalSetup` / `globalTeardown`, and how is it used in CI pipelines?

## 14. Parallel Execution & Flaky Tests

76. How does Playwright run tests in parallel by default, and what is the role of workers?
77. What is test sharding, and how do you split a suite across machines using `--shard`?
78. How does BrowserContext isolation prevent parallel tests from interfering with each other?
79. What are the common causes of flaky tests, and how do you reduce them (stable locators like `getByTestId`, avoid `waitForTimeout`, isolate tests, mock APIs, configure retries)?
80. Explain Playwright's retry mechanism.
81. How would you optimize Playwright execution time in a large test suite?

## 15. Page Object Model (POM)

82. What is the Page Object Model, and why is it used in Playwright automation?
83. How do you implement a basic Page Object class and inject the `page` fixture into it?
84. How do you extend fixtures to auto-instantiate Page Objects for every test?
85. How do you organize a large Playwright project (folder structure, Base Page class, shared helper/utility classes)?
86. What are the limitations of POM, and when would you consider an alternative like the Screenplay pattern?

## 16. TypeScript Essentials for Playwright

87. What is TypeScript, and why use it in an automation framework (type safety, IntelliSense, refactoring, early error detection)?
88. What's the difference between `interface` and `type`? What are union types?
89. What are generics, and how are they used in a Playwright framework (e.g., typed custom fixtures)?
90. What is `tsconfig.json`, and what does "strict mode" mean in TypeScript?
91. What are access modifiers (`public`/`private`/`protected`), and how do you apply them in a Base Page class?

## 17. Real-World / Scenario-Based Questions

92. How would you handle a dynamic table with infinite scrolling?
93. How would you handle a multi-step form with validation?
94. How would you test a drag-and-drop Kanban board?
95. How would you test a real-time chat application?
96. How do you handle OTP/email verification in a login flow — and why prefer an API (Microsoft Graph/IMAP) over UI-automating the inbox?
97. How would you design a scalable Playwright framework for an enterprise project?
98. If Playwright doesn't natively support a browser feature you need, how do you extend it (`page.evaluate()`, CDP sessions, Node integrations)?
99. How do you combine Playwright with AI/GenAI tools (Copilot, MCP servers) to speed up authoring and debugging?

---

**Prep tip:** For each question, be ready to give (a) a one-line definition, (b) a short code snippet, and (c) a "why this matters / real-project" angle — that 3-part answer pattern is what separates a senior-sounding answer from a textbook one, and it's exactly the tone your Otwani/Shetty sources model throughout.
