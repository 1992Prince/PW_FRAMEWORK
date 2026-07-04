## Q: How do you run your Playwright tests on LambdaTest / BrowserStack instead of your own Jenkins + GitHub Actions + Kubernetes (500-pod) grid — what's the minimum capability set these platforms need, and where exactly do you make code changes?

**A:**

**1. Why the question even comes up**
Our org already has solid infrastructure — GitHub Actions for PR-level CI and a Jenkins cluster with 500-pod parallel execution capacity for full regression. That covers Chromium, Firefox, and WebKit on Linux at scale. We'd reach for LambdaTest or BrowserStack only for things our own infra genuinely can't provide: real Safari/iOS, real Android devices, specific older Windows/macOS + browser version combos, or geo-located IPs. So in an interview, frame it as **"specialized/burst capacity on top of our existing grid"** — not a replacement.

**2. The core mechanism**
Both platforms expose a **CDP WebSocket endpoint**. Locally (and on our K8s grid) you do `chromium.launch()`; on cloud you do `chromium.connect(wsEndpoint)`. Playwright drives the same remote browser over CDP — your test code (locators, assertions, POM) doesn't change at all. Only the **browser bootstrap layer** changes.

**3. Minimum capabilities these platforms require**

| Capability | Purpose |
|---|---|
| `browserName` / `browserVersion` | Which browser to spin up |
| `platform` / `os`, `osVersion` | OS combination (Windows 11, macOS Sonoma, etc.) |
| `build` / `project` / `name` | Groups runs in their dashboard |
| `client.playwrightVersion` | Must match your local Playwright version exactly |
| `network` (LambdaTest) / `browserstack.local` | Tunnel flag if AUT is on internal/staging URLs not publicly reachable |
| `video`, `console`, `network.captureLog` | Debug artifacts on the platform side |
| Auth (`user` + `accessKey`) | Passed via env vars, never hardcoded |

Example capabilities object (LambdaTest):

```js
const capabilities = {
  'browserName': 'Chrome',
  'browserVersion': 'latest',
  'LT:Options': {
    platform: 'Windows 11',
    build: 'PW-Regression-Build',
    name: 'checkout-flow-spec',
    user: process.env.LT_USERNAME,
    accessKey: process.env.LT_ACCESS_KEY,
    network: true,
    video: true,
    console: true,
    tunnel: true,          // needed if AUT is behind VPN/internal
    tunnelName: process.env.LT_TUNNEL_NAME,
  },
};
```

**4. Code changes — sequence**

**Step 1 — Isolate browser bootstrap into a factory** (this is the only real architectural change):

```ts
// utils/browserFactory.ts
import { chromium, Browser } from '@playwright/test';

export async function getBrowser(): Promise<Browser> {
  if (process.env.RUN_ON === 'lambdatest') {
    const caps = encodeURIComponent(JSON.stringify(capabilities));
    return chromium.connect(
      `wss://cdp.lambdatest.com/playwright?capabilities=${caps}`
    );
  }
  if (process.env.RUN_ON === 'browserstack') {
    const caps = encodeURIComponent(JSON.stringify(bstackCaps));
    return chromium.connect(
      `wss://cdp.browserstack.com/playwright?caps=${caps}`
    );
  }
  // default: our existing K8s grid or local
  return chromium.launch({ headless: true });
}
```

**Step 2 — Wire it into a fixture** so `page` behaves identically regardless of target:

```ts
// fixtures/base.ts
import { test as base } from '@playwright/test';
import { getBrowser } from '../utils/browserFactory';

export const test = base.extend({
  page: async ({}, use) => {
    const browser = await getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
    await browser.close();
  },
});
```

**Step 3 — Tunnel for internal URLs** (skip if your staging/QA env is public):

```bash
# LambdaTest
./LT --user $LT_USERNAME --key $LT_ACCESS_KEY --tunnelName ci-tunnel
# BrowserStack
./BrowserStackLocal --key $BS_ACCESS_KEY --local-identifier ci-tunnel
```

Then reference `tunnelName`/`local-identifier` in capabilities.

**Step 4 — CI wiring** — just an extra job/stage in the existing GitHub Actions or Jenkins pipeline, gated by env var, so it doesn't touch the 500-pod K8s job:

```yaml
- name: Cross-browser run on LambdaTest
  if: github.event.inputs.target == 'lambdatest'
  run: RUN_ON=lambdatest npx playwright test --grep @cross-browser
  env:
    LT_USERNAME: ${{ secrets.LT_USERNAME }}
    LT_ACCESS_KEY: ${{ secrets.LT_ACCESS_KEY }}
```

**Step 5 — Report pass/fail back to the platform** (optional but expected in interviews — shows you know their dashboard isn't automatic):

```ts
await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({
  action: 'setTestStatus',
  arguments: { status: 'passed', remark: 'Checkout flow verified' },
})}`);
```

**5. What you'd say about concurrency/parallelism**
Our 500 K8s pods give us deterministic, unlimited-duration, high-concurrency capacity that we fully control. LambdaTest/BrowserStack cap concurrency by your **plan's parallel session count** (e.g., 5/20/50). So when we do use them, cross-browser/device runs are scoped to a smaller **smoke or targeted subset** (`--grep @cross-browser`), not the full suite — purely for cost and queue-time reasons.
