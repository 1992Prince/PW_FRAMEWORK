# Fluent Interface Pattern

## 1. What Is This Pattern and Which Category Does It Belong To?

The **Fluent Interface** pattern is a design technique where every method on a class
returns `this` (the current object instance) instead of `void` or some other value.
This allows the caller to **chain multiple method calls in a single expression**, making
the code read almost like a natural sentence.

### Which GoF Category?

The Fluent Interface pattern does **not fit neatly into one GoF category** — it is
considered a **general Object-Oriented Design pattern** / **API Design pattern**. However,
it is **most commonly used alongside Creational patterns**:

| Category | Examples | Fluent Interface used here? |
|---|---|---|
| **Creational** | Builder, Factory, Prototype | ✅ Yes — Builder pattern almost always uses it |
| **Structural** | Facade, Adapter, Decorator | Sometimes — e.g. query builders |
| **Behavioural** | Strategy, Command, Observer | Rarely |

> **Simple one-liner for interview:**
> *"Fluent Interface is an API design pattern that uses `return this` to enable method
> chaining. It is most closely associated with the Creational category because it is the
> mechanism that powers the Builder pattern."*

### Fluent Interface vs Builder — Key Difference

| | Fluent Interface | Builder Pattern |
|---|---|---|
| **Purpose** | Readable method chaining | Constructing a complex object step by step |
| **Terminal method** | Performs an action (`.send()`) | Returns a new object (`.build()`) |
| **Uses `return this`?** | ✅ Yes | ✅ Yes |

They are related but not the same. Builder uses Fluent Interface as its mechanism.

---

## 2. How We Implemented It — Our Real Use Case

### The Requirement

We needed a reusable utility to make HTTP API calls (GET, POST, PUT, DELETE) in our
Playwright tests. Playwright provides an `APIRequestContext` object (the `request` fixture)
but using it directly in tests means:

- Repeating `{ headers: {...}, data: {...} }` options objects in every test
- No consistent structure for forming requests
- Hard to read — method, URL, headers, and body all passed as separate arguments

### The Solution — `ApiRequestBuilder`

We created `src/utils/ApiRequestBuilder.js` — a class that wraps Playwright's
`APIRequestContext` and exposes a **fluent, chainable API** for building and sending
HTTP requests.

#### How a user uses it in a test:

```js
// Step 1 — import ApiRequestBuilder
import { ApiRequestBuilder } from '../utils/ApiRequestBuilder.js';

// Step 2 — create an instance by passing Playwright's `request` fixture
//           (request is injected automatically by Playwright via the test parameter)
const builder = new ApiRequestBuilder(request);

// Step 3 — chain the methods you need and await .send() at the very end
const response = await new ApiRequestBuilder(request)
    .post('https://api.restful-api.dev/objects')        // set HTTP method + URL
    .withHeaders({ 'Content-Type': 'application/json' }) // pass full headers object
    .withBody({ name: 'Demo Laptop', data: { year: 2024 } }) // pass JSON body object
    .send();                                              // fire the request (only async step)
```

#### Why chaining works — because every method returns `this`:

```
new ApiRequestBuilder(request)   → returns the builder instance
    .post(url)                   → sets method + url, returns this (same instance)
    .withHeaders({...})          → sets headers,       returns this (same instance)
    .withBody({...})             → sets body,          returns this (same instance)
    .send()                      → uses all stored config to fire the actual HTTP call
```

At no point does the user need to manage method, URL, headers, or body separately.
It all flows in one readable expression.

#### GET request — no body needed, just skip `.withBody()`:

```js
const response = await new ApiRequestBuilder(request)
    .get('https://api.restful-api.dev/objects')
    .withHeaders({ Accept: 'application/json' })
    .send();
```

The builder only attaches a body if `.withBody()` was called — skipping it is safe.

---

## 3. Steps to Implement the Fluent Interface Pattern

These steps apply whether you are building an **API request builder** or a
**test data builder** — the mechanics are identical.

---

### Step 1 — Create a class and store all config as private fields

```js
export class ApiRequestBuilder {
    constructor(request) {
        this._request = request; // dependency injected via constructor
        this._method  = '';      // no default — user must set it
        this._url     = '';
        this._headers = {};
        this._body    = null;
    }
}
```

- Store everything the builder needs as instance fields
- Keep them empty / null by default — the user fills them via chained methods
- Inject any external dependency (like Playwright's `request`) through the constructor

---

### Step 2 — Write setter methods that each `return this`

This is the entire secret of the pattern. Every configuration method:
1. Sets one piece of state on `this`
2. Returns `this` — the current instance

```js
get(url)    { this._method = 'get';    this._url = url; return this; }
post(url)   { this._method = 'post';   this._url = url; return this; }
put(url)    { this._method = 'put';    this._url = url; return this; }
delete(url) { this._method = 'delete'; this._url = url; return this; }

withHeaders(headersObj) { this._headers = headersObj; return this; }
withBody(bodyObj)       { this._body    = bodyObj;    return this; }
```

> **Rule**: Every method that configures the builder must end with `return this`.
> If it doesn't, the chain breaks at that point.

---

### Step 3 — Write one terminal method that does the actual work

The terminal method is the **only one that does NOT return `this`**. It uses all the
stored state to perform the final operation:

- In an **API builder** → the terminal method sends the HTTP request (`.send()`)
- In a **data builder** → the terminal method returns the constructed object (`.build()`)

```js
// API Builder terminal method
async send() {
    const options = { headers: this._headers };
    if (this._body) options.data = this._body;
    return await this._request[this._method](this._url, options);
}

// Data Builder terminal method (for reference)
build() {
    return this.data; // returns the constructed object, not `this`
}
```

---

### Step 4 — Use it in tests with a single chained expression

```js
// All synchronous setup chained together — one await only at .send()
const response = await new ApiRequestBuilder(request)
    .post(BASE_URL)
    .withHeaders({ 'Content-Type': 'application/json' })
    .withBody({ name: 'Demo Laptop' })
    .send();
```

---

### Where this pattern works best

| Use Case | Class | Terminal method |
|---|---|---|
| HTTP API calls | `ApiRequestBuilder` | `.send()` — async |
| Test data construction | `UserBuilder`, `EventBuilder` | `.build()` — sync |
| URL with query params | `UrlBuilder` | `.build()` — sync |
| Multiple page assertions | `PageAssertions` | `.assert()` — async |

---

### Where it does NOT work

**Async page object methods** — Playwright page object methods are `async` and always
return a `Promise`. Chaining them directly does not work cleanly:

```js
// ❌ Breaks — isAt() returns Promise<void>, not the page object
await homepage.isAt().verifyHomepageLoaded();

// ✅ Must do this instead — no chaining possible
await homepage.isAt();
await homepage.verifyHomepageLoaded();
```

Stick to using the Fluent Interface pattern for **synchronous configuration** with a
**single async terminal method** at the end of the chain.
