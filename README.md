# PW_FRAMEWORK — Playwright Automation Framework

A production-grade, scalable end-to-end test automation framework built with **Playwright** and **JavaScript (ESM)**. Designed for real-world CI/CD pipelines with a clean separation of concerns, zero hardcoding, and full RCA support on failure.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Framework Architecture](#framework-architecture)
- [Design Patterns](#design-patterns)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Test Data Strategy](#test-data-strategy)
- [Execution Strategy & Tagging](#execution-strategy--tagging)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Failure Analysis & RCA](#failure-analysis--rca)
- [Best Practices](#best-practices)
- [Coverage Strategy](#coverage-strategy)

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev/) | ^1.61 | Browser automation |
| Node.js | 18+ | Runtime |
| JavaScript (ESM) | ES2022 | Language (`"type": "module"` in package.json) |
| [@faker-js/faker](https://fakerjs.dev/) | ^10 | Dynamic test data generation |
| [Allure Playwright](https://docs.qameta.io/allure/) | ^3 | Rich test reporting |

---

## Project Structure

```
PW_FRAMEWORK/
├── playwright.config.js          # Playwright configuration — projects, reporters, global setup
├── package.json                  # Dependencies and npm run scripts
│
├── src/
│   ├── config/
│   │   └── config.js             # Central config — all URLs, credentials, env settings
│   │
│   ├── fixtures/
│   │   └── auth.fixture.js       # Custom Playwright fixture — handles login before each test
│   │
│   ├── pages/
│   │   ├── BasePage.js           # Base class — wraps Playwright API with defensive checks & logging
│   │   ├── LoginPage.js          # Login page actions and smart login logic
│   │   └── Homepage.js           # Homepage / dashboard page actions
│   │
│   ├── setup/
│   │   ├── global-setup.js       # Runs once before suite — generates unique RUN_ID
│   │   └── global-teardown.js    # Runs once after suite — logs run completion
│   │
│   ├── testdata/
│   │   └── userscreds.json       # Static credential sets for multi-user scenarios
│   │
│   ├── tests/
│   │   ├── login.spec.js         # Login test scenarios
│   │   └── homepage.spec.js      # Homepage test scenarios
│   │
│   └── utils/
│       ├── loggerUtil.js         # Structured console logger (INFO/DEBUG/WARN/ERROR)
│       ├── fakerUtil.js          # Dynamic test data helpers using @faker-js/faker
│       └── dbconnect.js          # Database connection utility for direct DB validation
```

---

## Framework Architecture

### Layer Diagram

```
┌─────────────────────────────────────────┐
│              SPEC FILES                 │  ← Assertions, test logic only
├─────────────────────────────────────────┤
│              FIXTURES                   │  ← Login, auth state, shared setup
├─────────────────────────────────────────┤
│            PAGE OBJECTS                 │  ← Actions, locators, page methods
├─────────────────────────────────────────┤
│              BASE PAGE                  │  ← Defensive wrappers around Playwright API
├─────────────────────────────────────────┤
│         CONFIG  |  LOGGER  |  UTILS     │  ← Shared infrastructure
└─────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `config.js` | Single source of truth for all environment-specific values. Defaults hardcoded here, overridden by CI env vars |
| `loggerUtil.js` | Structured logging with timestamps and RUN_ID. 4 levels: INFO, DEBUG, WARN, ERROR |
| `global-setup.js` | Generates a unique `RUN_ID` once per run using `crypto.randomUUID()` — stamped on every log line |
| `global-teardown.js` | Logs suite completion boundary — confirms run completed vs crashed mid-way |
| `BasePage.js` | Wraps every Playwright action (click, fill, goto etc.) with visibility checks, `clear()` before fill, logging. All page classes extend this |
| `LoginPage.js` | Login-specific locators and methods. Includes `smartLogin()` which auto-detects 3 auth states |
| `Homepage.js` | Homepage-specific locators and actions |
| `auth.fixture.js` | Playwright custom fixture — performs login once before each test, hands authenticated `loginPage` to every test that needs it |

---

## Design Patterns

| Pattern | Applied In | Purpose |
|---------|-----------|---------|
| **Page Object Model (POM)** | `pages/` | Decouples locators and actions from test logic. UI changes are fixed in one place |
| **Singleton** | `config.js`, `loggerUtil.js` | One shared instance per process — consistent config and log formatting everywhere |
| **Inheritance** | `LoginPage → BasePage`, `Homepage → BasePage` | Shared defensive wrappers in one place. Page classes stay lean |
| **Fixture (Dependency Injection)** | `auth.fixture.js` | Login boilerplate injected automatically — tests stay focused on what they test |
| **Template Method** | `BasePage.#resolve()` | Accepts both CSS string selectors and Playwright Locator objects transparently |
| **Factory / Builder** | `fakerUtil.js` | Generates fresh dynamic test data per test run, never stale |

---

## Configuration & Environment Variables

All configuration lives in `src/config/config.js`. **Hardcoded values are not allowed in test or page files.**

```js
// src/config/config.js
export const config = Object.freeze({
  env:             process.env.ENV              ?? 'staging',
  appUrl:          process.env.APP_URL           ?? 'https://eventhub.rahulshettyacademy.com/login',
  apiUrl:          process.env.API_URL           ?? 'https://api.staging.myapp.com',
  serviceUser:     process.env.SERVICE_USER      ?? 'user@example.com',
  servicePassword: process.env.SERVICE_PASSWORD  ?? 'Password@123',
  buildNo:         process.env.BUILD_NO          ?? 'local',
});
```

### Overriding in CI

| CI Platform | How to Override |
|------------|----------------|
| GitHub Actions | `env:` block in workflow YAML |
| Jenkins | `withEnv([...])` block or pipeline parameters |
| BrowserStack | Environment config in `browserstack.yml` |
| Local | Prefix command: `APP_URL=https://prod.app.com npx playwright test` |

**Rule:** If a value could ever differ between environments or needs to be secret — it belongs in `config.js` driven by an env var, not hardcoded anywhere.

---

## Test Data Strategy

| Source | When to Use |
|--------|------------|
| `config.js` | App URL, service credentials — injected from CI secrets |
| `testdata/userscreds.json` | Static multi-user sets (e.g. admin, viewer, guest roles) |
| `fakerUtil.js` / `@faker-js/faker` | Dynamic data — names, emails, dates, addresses for create/update tests |
| `process.env.*` at runtime | `RUN_ID`, `BUILD_NO`, environment-specific overrides |
| DB direct query (`dbconnect.js`) | Seeding preconditions or validating persistence post-action |

**Rule:** Never hardcode test data (usernames, passwords, URLs, IDs) in spec or page files.

---

## Execution Strategy & Tagging

Every test is tagged in its title. Tags drive which tests run in which pipeline stage.

### Tag Definitions

| Tag | Meaning | Target Duration |
|-----|---------|----------------|
| `@sanity` | Most critical path — app is up and login works | < 10 minutes total |
| `@bvt` | Build Verification — core user journeys smoke-tested after every deployment | < 15 minutes |
| `@regression` | Full suite — all business-critical flows verified | Standard regression window (e.g. nightly, pre-release) |

### Tagging Example

```js
test('should display homepage after login @sanity @bvt @regression', ...);
test('should display event cards on homepage @regression', ...);
test('should navigate to event detail page @regression @bvt', ...);
```

### Execution Decision Tree

```
Every commit / PR       →  @sanity       (fast feedback, < 10 min)
Every deployment        →  @bvt          (smoke check, < 15 min)
Nightly / pre-release   →  @regression   (full coverage)
```

---

## Running Tests

### Prerequisites

```bash
npm install
npx playwright install
```

### npm Scripts

```bash
npm run conduit-sanity            # Run @sanity tests only
npm run conduit-regression        # Run @regression tests only
npm run conduit-sanity-regression # Run @sanity + @regression together
npm run conduit-bvt               # Run @sanity + @smoke + @regression + @bvt
npm run eventApp-bvt              # Run all tests in the eventapp project
```

### Direct Playwright Commands

```bash
npx playwright test                              # Run all tests
npx playwright test --grep @sanity               # Run sanity only
npx playwright test --grep "@sanity|@regression" # Run sanity + regression
npx playwright test --project=chromium           # Run in specific browser
npx playwright test src/tests/login.spec.js      # Run single spec file
npx playwright test --headed                     # Run with browser visible
npx playwright test --debug                      # Run in debug mode
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Sanity Tests
        env:
          APP_URL:          ${{ secrets.APP_URL }}
          SERVICE_USER:     ${{ secrets.SERVICE_USER }}
          SERVICE_PASSWORD: ${{ secrets.SERVICE_PASSWORD }}
          BUILD_NO:         ${{ github.run_number }}
        run: npm run conduit-sanity

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Jenkins (Declarative Pipeline)

```groovy
pipeline {
  agent any
  environment {
    APP_URL          = credentials('APP_URL')
    SERVICE_USER     = credentials('SERVICE_USER')
    SERVICE_PASSWORD = credentials('SERVICE_PASSWORD')
    BUILD_NO         = "${env.BUILD_NUMBER}"
  }
  stages {
    stage('Install') { steps { sh 'npm ci && npx playwright install --with-deps' } }
    stage('Sanity')  { steps { sh 'npm run conduit-sanity' } }
  }
  post {
    always { publishHTML(target: [reportDir: 'playwright-report', reportFiles: 'index.html']) }
  }
}
```

### BrowserStack

Configure `browserstack.yml` and replace the `use` block in `playwright.config.js` with BrowserStack capabilities. Credentials injected via `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` environment variables.

---

## Failure Analysis & RCA

When a test fails, the following artifacts are automatically available:

| Artifact | Location | Use |
|----------|---------|-----|
| **Structured logs** | Console / CI log output | Every action logged with timestamp and RUN_ID — trace the exact sequence of events |
| **RUN_ID correlation** | All log lines | Filter all logs for one run: `grep "RUN_ID=RUN-xxxx"` |
| **HTML Report** | `playwright-report/index.html` | Visual test results with step-by-step breakdown |
| **Screenshots** | Captured on failure | Attached to HTML report — shows exact UI state at point of failure |
| **Video** | Configured in `playwright.config.js` | Full recording of test execution — replay the failure |
| **Traces** | `trace: 'on-first-retry'` in config | Playwright Trace Viewer — DOM snapshots, network, console at every step |

### Viewing a Trace

```bash
npx playwright show-trace trace.zip
```

### Log-based RCA Flow

```
1. Find the RUN_ID from the failed CI run log
2. grep "RUN_ID=<value>" across all output to isolate that run
3. Follow INFO → DEBUG → ERROR sequence to pinpoint where it failed
4. Open the HTML report and screenshot for visual confirmation
5. If needed, open the trace for DOM + network state at failure point
```

---

## Best Practices

### Code Rules
- **No hardcoded values** — URLs, credentials, IDs, timeouts all go in `config.js`
- **No `expect()` in page objects** — page methods return data; spec files assert it
- **No raw Playwright API in page files** — always go through `BasePage` methods
- **No imports from `@playwright/test` in spec files** — always import from the fixture
- **No `page.waitForTimeout()` in tests** — use `waitForVisible()` or Playwright auto-wait

### Logging Rules
- `info()` — test start/end, login, navigation, major milestone
- `debug()` — variable values, URLs, element state, config values
- `warn()` — unexpected but recoverable: element not found, retry happening
- `error()` — in `catch` blocks only, just before re-throwing

### Test Design Rules
- One behaviour per test — do not chain unrelated actions
- Tag every test with at least one of: `@sanity`, `@bvt`, `@regression`
- Use `expect.soft()` when validating multiple fields — reports all failures, not just first
- Return strings/values from page methods for text assertions — never assert inside page objects

---

## Coverage Strategy

### Coverage Split (Target)

```
Total Tests: 100%
├── API Tests:  70%  — Fast, stable, isolated, no browser overhead
└── UI Tests:   30%  — E2E critical paths only, not every API scenario repeated in UI
```

### UI Coverage Focus (E2E)

| Priority | What to Cover |
|----------|--------------|
| P0 — Sanity | Login, homepage load, core navigation |
| P1 — BVT | Key user journeys: browse event → book → confirm |
| P2 — Regression | Edge cases, negative scenarios, multi-role access, error states |

### API Coverage Focus

- All CRUD endpoints
- Authentication and authorisation boundaries
- Error responses (4xx, 5xx)
- Contract/schema validation
- Data integrity post-write operations

**Principle:** If a behaviour can be validated at the API level, do it there. Reserve UI tests for flows that require the full browser stack (visual state, navigation, user journey confirmation).
