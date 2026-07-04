# PageManager Pattern (Facade + Lazy Initialization)

## 1. Why Do We Need This Pattern?

As a Playwright test framework grows, the number of Page Object classes grows with it.
Without a centralised manager, every test file becomes responsible for:

- Importing each page class individually
- Instantiating each page object manually
- Passing the `page` instance to every constructor themselves

The **PageManager** pattern solves this by acting as a **single entry point** for all page
objects. It wraps the creation and caching of page objects behind a clean API, so test files
never have to deal with constructors or imports of individual page classes.

---

## 2. What Problem Does It Solve? (And What Happens Without It?)

### Problems Without PageManager

| Problem | Impact |
|---|---|
| Every spec file imports every page class it needs | Dozens of import lines per file; hard to maintain |
| Every test creates its own `new LoginPage(page)` | Page objects are instantiated multiple times unnecessarily |
| If a class is renamed or moved, every spec file breaks | Ripple effect across the entire test suite |
| No single place to control how page objects are created | Inconsistent usage patterns across the team |

### Example of the pain (without PageManager)

```js
// homepage.spec.js — before
import { Homepage }  from '../pages/Homepage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NavBar }    from '../pages/NavBar.js';

test('my test', async ({ page }) => {
  const loginPage = new LoginPage(page);   // created here
  const homepage  = new Homepage(page);    // created here
  const navBar    = new NavBar(page);      // created here
  // ...
});
```

If `Homepage.js` is renamed or moved, every spec that imports it breaks.

### What PageManager solves

- **One import** replaces many — spec files only import `PageManager` (or get it via fixture).
- **Lazy instantiation** — a page object is only created when first requested; never before.
- **Cached instances** — calling `getHomePage()` twice returns the same object, not two new ones.
- **Single point of change** — renaming or moving a page class only requires updating `PageManager.js`.

---

## 3. How We Implemented This Pattern — Step by Step

### Step 1 — Create `PageManager.js` under `src/pages/`

```js
// src/pages/PageManager.js
import { HomePage }  from './Homepage.js';
import { LoginPage } from './LoginPage.js';

export class PageManager {
    constructor(page) {
        this.page      = page;   // Playwright page instance
        this.homePage  = null;   // not created yet — lazy
        this.loginPage = null;   // not created yet — lazy
    }

    getHomePage() {
        if (!this.homePage) {                        // create only on first call
            this.homePage = new HomePage(this.page);
        }
        return this.homePage;                        // return cached instance
    }

    getLoginPage() {
        if (!this.loginPage) {
            this.loginPage = new LoginPage(this.page);
        }
        return this.loginPage;
    }
}
```

**Key points in the implementation:**
- The constructor only stores references (`null`), it does NOT create any page objects yet.
- Each `getXxxPage()` method checks if the object exists before creating it — this is **Lazy Initialization**.
- The `page` (Playwright context) is passed once to the `PageManager` constructor, not to each page class individually.

---

### Step 2 — Update the fixture to expose `pageManager`

```js
// src/fixtures/auth.fixture.js
import { PageManager } from '../pages/PageManager.js';

const test = base.extend({
  pageManager: async ({ page }, use) => {
    const pageManager = new PageManager(page);    // single manager for the test
    const loginPage   = pageManager.getLoginPage(); // get login page lazily

    await loginPage.login(config.appUrl, config.serviceUser, config.servicePassword);

    await use(pageManager);  // hand pageManager to every test that requests it
  },
});
```

**Why in the fixture?**
- The fixture runs before every test automatically.
- It handles login in one place.
- Every test receives a ready-to-use `pageManager` without any setup boilerplate.

---

### Step 3 — Use `pageManager` in spec files instead of raw page classes

```js
// src/tests/homepage.spec.js — after
test('should display homepage heading', async ({ pageManager }) => {
  const homepage = pageManager.getHomePage();   // no import, no constructor call
  await homepage.isAt();
  await homepage.verifyHomepageLoaded();
});
```

```js
// src/tests/login.spec.js — after
test('should land on homepage after login', async ({ pageManager }) => {
  await expect(pageManager.page).toHaveURL('https://eventhub.rahulshettyacademy.com/');
  await expect(pageManager.page).toHaveTitle('EventHub — Discover & Book Events');
});
```

---

### Adding a new page in future

When you add a new page (e.g., `CheckoutPage`):
1. Create `src/pages/CheckoutPage.js` with the page class.
2. Add one import and one getter to `PageManager.js` — that's it.
3. All spec files immediately have access via `pageManager.getCheckoutPage()`.

---

## 4. How to Explain This Pattern in an Interview

Use this structure when answering:

---

**"What design patterns does your framework use?"**

> *"In our Playwright framework, we use the **PageManager pattern**, which is an implementation of the **Facade design pattern** combined with **Lazy Initialization**."*

---

**Explain the problem it solves:**

> *"Without it, every test file had to import each page class individually and create its own instances using the `new` keyword. This meant if we had 20 spec files and 10 page classes, we'd have import statements and constructors scattered everywhere. Any refactoring — like renaming or moving a page class — would break every file that used it."*

---

**Explain the Facade aspect:**

> *"The `PageManager` acts as a **Facade**. It provides a simplified, unified interface — `getLoginPage()`, `getHomePage()` — to the complex subsystem of all our page objects. Test files don't need to know which file a page lives in or how to instantiate it. They just ask the `PageManager`."*

---

**Explain Lazy Initialization:**

> *"We also use **Lazy Initialization** inside the `PageManager`. Page objects are not created when the `PageManager` is constructed. They are created only when a test actually requests them for the first time. On subsequent calls, the already-created instance is returned from cache. This avoids unnecessary object creation and improves performance, especially in large test suites."*

---

**Explain how it integrates with Playwright fixtures:**

> *"We expose the `PageManager` through a Playwright **fixture**. The fixture is responsible for creating the `PageManager`, handling login, and then injecting the `pageManager` object into every test that needs it. This means tests have zero setup boilerplate — they just destructure `pageManager` from the test parameters and immediately call `pageManager.getHomePage()` or any other page."*

---

**Summarise the benefits:**

> *"The key benefits are:*
> - *Single place to manage all page object creation*
> - *Reduced and cleaner imports in test files*
> - *Lazy creation avoids unnecessary object instantiation*
> - *Easier maintenance — adding a new page only requires a change in one file*
> - *Consistent page object access pattern across the whole team"*

---

**Which category does the Facade pattern belong to?**

> *"The Facade pattern is a **Structural design pattern**."*

The Gang of Four (GoF) divides the 23 classic design patterns into three categories:

| Category | Purpose | Examples |
|---|---|---|
| **Creational** | How objects are **created** | Singleton, Factory, Builder, Prototype |
| **Structural** | How objects are **composed / structured** | **Facade**, Adapter, Decorator, Proxy, Composite |
| **Behavioural** | How objects **communicate / interact** | Observer, Strategy, Command, Iterator |

**Simple one-liner to say in interview:**

> *"Facade is a **Structural pattern** because it is about how we **structure** access to a complex system — it wraps multiple classes behind a single, simplified interface without changing what those classes do internally."*

---

**What is Lazy Initialization? (Simple interview definition)**

> *"Lazy Initialization is a technique where an object is **not created at the time the parent object is constructed**. Instead, it is created **only when it is actually needed for the first time**. After that first creation, the same instance is reused — it is never created again."*

**Simple analogy to use:**

> *"Think of it like a coffee machine that only grinds the beans when you actually press the brew button — not when you plug it in. The grinding (object creation) is deferred until it is truly needed."*

**In code terms (how we did it):**

```js
getHomePage() {
    if (!this.homePage) {               // first call — homePage is null, so create it
        this.homePage = new HomePage(this.page);
    }
    return this.homePage;               // second call onwards — return the cached instance
}
```

> *"The `null` check is the lazy initialization guard. The object is created once and cached. Any further calls skip the constructor and return the existing instance directly."*
