# Template Method Pattern

## 1. What Is This Pattern?

The **Template Method** pattern defines the **skeleton of an algorithm in a base class**
and lets subclasses **fill in the specific steps** without changing the overall structure.

The base class says: *"Here is the common structure and shared behaviour — subclasses,
you provide the specifics."*

### Which GoF Category?

The Template Method pattern is a **Behavioural** design pattern.

| Category | Purpose | Examples |
|---|---|---|
| Creational | How objects are created | Factory, Builder, Singleton |
| Structural | How objects are composed | Facade, Adapter, Decorator |
| **Behavioural** | How objects interact and share behaviour | **Template Method**, Strategy, Observer |

> **Simple one-liner for interview:**
> *"Template Method is a Behavioural pattern where a base class defines the common
> structure and reusable steps, and each subclass only overrides the parts that are
> specific to it — without touching the shared logic."*

---

## 2. What Problem Does It Solve?

### Without Template Method

Imagine every page class (`LoginPage`, `HomePage`) directly used raw Playwright
methods — each one would repeat the same defensive checks, the same logging, the same
`waitFor` logic:

```js
// LoginPage — without BasePage
async click(locator) {
    await locator.waitFor({ state: 'visible', timeout: 5000 }); // repeated
    consoleLogger.debug(`Clicking: ${locator}`);                // repeated
    await locator.click();
}

// HomePage — without BasePage — EXACT SAME CODE duplicated
async click(locator) {
    await locator.waitFor({ state: 'visible', timeout: 5000 }); // duplicated
    consoleLogger.debug(`Clicking: ${locator}`);                // duplicated
    await locator.click();
}
```

Every time you want to improve the `click` logic (e.g. add retry, change timeout),
you must update every single page class.

### With Template Method

The shared logic lives **once** in `BasePage`. All page classes inherit it automatically.
Changing `click` in `BasePage` instantly applies everywhere.

---

## 3. How It Is Implemented in This Framework

### The Structure

```
BasePage          ← defines all shared, reusable Playwright interactions
    │
    ├── LoginPage ← extends BasePage, adds login-specific locators and methods
    └── HomePage  ← extends BasePage, adds homepage-specific locators and methods
```

### `BasePage` — the template (common algorithm)

`BasePage` defines every interaction that all pages share:
- Navigation (`goto`)
- Interactions (`click`, `fill`, `pressSequentially`)
- Reads (`getText`, `isVisible`)
- Waits (`waitForVisible`, `wait`)

Each method wraps the raw Playwright call with:
1. **Defensive wait** — `waitFor({ state: 'visible' })` before acting
2. **Logging** — `consoleLogger.debug(...)` on every action
3. **Locator resolution** — accepts both string selectors and Playwright Locator objects

```js
// src/pages/BasePage.js — the template
export class BasePage {
    constructor(page) {
        this.page = page;
    }

    // Shared method — available to ALL page classes automatically
    async click(locator) {
        consoleLogger.debug(`Clicking: ${locator}`);
        const el = this.#resolve(locator);
        await el.waitFor({ state: 'visible', timeout: 5000 }); // defensive check
        await el.click();
    }

    async fill(locator, value) {
        consoleLogger.debug(`Filling "${locator}" with value`);
        const el = this.#resolve(locator);
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.clear();
        await el.fill(value);
    }

    // ... goto, getText, isVisible, waitForVisible, wait — all shared here
}
```

### `LoginPage` — a concrete implementation

`LoginPage` extends `BasePage` and only defines what is **specific to the login screen**:
its own locators and its own high-level methods like `login()`. It calls `this.fill()`,
`this.click()` etc. which are all inherited from `BasePage` — no duplication.

```js
// src/pages/LoginPage.js
export class LoginPage extends BasePage {
    constructor(page) {
        super(page);  // hands `page` to BasePage constructor

        // Page-specific locators only
        this.emailInput    = page.getByPlaceholder('you@email.com');
        this.passwordInput = page.getByLabel('Password');
        this.loginButton   = page.getByText('Sign In');
    }

    // Page-specific high-level method
    // Internally calls this.goto(), this.fill(), this.click() — all from BasePage
    async login(url, email, password) {
        await this.goto(url);
        await this.fill(this.emailInput, email);
        await this.fill(this.passwordInput, password);
        await this.click(this.loginButton);
    }
}
```

### `HomePage` — another concrete implementation

`HomePage` also extends `BasePage` and only defines what is specific to the homepage:

```js
// src/pages/Homepage.js
export class HomePage extends BasePage {
    constructor(page) {
        super(page);

        // Homepage-specific locators
        this.pageHeading        = page.getByText('Amazing Events');
        this.dilliWalaMelaEvent = page.getByText('Dilli Diwali Mela');
        this.logoutBtn          = page.getByTestId('logout-btn');
    }

    async verifyHomepageLoaded() {
        await this.waitForVisible(this.pageHeading, 10000); // inherited from BasePage
    }

    async clickDilliWalaMelaEvent() {
        await this.click(this.dilliWalaMelaEvent); // inherited from BasePage
    }
}
```

---

## 4. What Does It Achieve?

| Benefit | How |
|---|---|
| **No code duplication** | Logging, defensive waits, locator resolution — written once in `BasePage`, used everywhere |
| **Single point of change** | Change `click()` timeout in `BasePage` → all pages get the fix instantly |
| **Consistent behaviour** | Every page interaction behaves the same way — same logging, same waits, same error handling |
| **Clean page classes** | `LoginPage` and `HomePage` only contain what is unique to them — no boilerplate |
| **Easy to extend** | Add a new page → extend `BasePage`, define locators and high-level methods, done |

---

## 5. How to Explain in an Interview

> *"In our framework, we use the **Template Method pattern** through our `BasePage` class.
> `BasePage` is a Behavioural design pattern where the base class defines the common,
> reusable structure — in our case all Playwright interactions like `click`, `fill`,
> `goto`, and `waitForVisible`. Each of these methods adds defensive visibility checks
> and logging around the raw Playwright calls."*

> *"Every page class — `LoginPage`, `HomePage` — extends `BasePage`. They inherit all
> those shared interactions automatically and only define what is specific to their page:
> their own locators and their own high-level methods like `login()` or
> `clickDilliWalaMelaEvent()`."*

> *"The benefit is zero duplication. If I want to change the timeout on every `click`
> across the entire framework, I change one line in `BasePage` and every page is updated
> instantly. Without this pattern, I'd have to change it in every single page class."*

---

## 6. Template Method vs Inheritance — Are They the Same?

They look similar but the intent is different:

| | Plain Inheritance | Template Method Pattern |
|---|---|---|
| **Purpose** | Reuse code via parent-child | Define a reusable algorithm skeleton, allow subclasses to fill in steps |
| **Who controls the flow?** | Subclass can override anything | Base class controls the structure; subclasses only fill in the variable parts |
| **Intent** | Code reuse | Algorithm standardisation + controlled extension |

In our case, `BasePage` uses **both** — it provides reusable interactions (inheritance)
AND defines a standard structure for how all page interactions must behave
(Template Method). In practice for test frameworks, these two concepts overlap
and `BasePage` is the most recognisable example of the Template Method pattern in action.
