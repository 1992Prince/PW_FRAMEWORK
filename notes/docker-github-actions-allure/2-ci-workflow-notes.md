# CI/CD with GitHub Actions & Playwright — Senior-Level Interview Notes

> Consolidated, cleaned-up reference built from actual project workflows (sanity, regression, BVT). Each topic has a plain-English explanation followed by a ready-to-speak interview answer.

---

## 1. Project CI Overview — How We've Structured Our Pipelines

**Explanation:**
In our project, we don't run all types of testing from a single workflow file. We maintain separate GitHub Actions YAML files for each testing purpose — sanity, regression, and BVT (Build Verification Testing) — because each has a different scope, different frequency, and a different audience. Each of these workflows can be triggered in three ways: automatically on a `push`/PR event, on a `schedule` (cron), or manually on-demand via `workflow_dispatch`. This separation keeps each pipeline focused, independently maintainable, and lets us re-run just the one that's relevant without touching the others.

**Interview Speaking Line:**
> "In our project, we maintain separate GitHub Actions workflow files for sanity, regression, and BVT, since each serves a different purpose and has different scope and timing needs. All of them support push-based triggers, scheduled cron runs, and manual on-demand triggers through `workflow_dispatch`, which gives us flexibility to run any suite whenever it's needed without depending on the others."

---

## 2. What Is a Workflow — In Plain Words

**Explanation:**
A workflow is simply an automated, configurable process defined in a YAML file inside `.github/workflows/`. It tells GitHub Actions: "when this event happens, run this sequence of jobs and steps on a clean virtual machine." For us, that means: whenever code is pushed, a PR is raised, a scheduled time hits, or someone triggers it manually — automatically install dependencies, run the Playwright test suite, collect results, and notify the team, all without any manual intervention.

**Interview Speaking Line:**
> "A workflow is an automated set of instructions defined in YAML that GitHub Actions executes in response to a trigger — it runs on a fresh, isolated environment and performs everything from checking out code to running tests to reporting results. It's what lets us achieve consistent, repeatable test execution without manual effort."

---

## 3. Trigger Events — Push, Manual, and Cron

**Explanation:**
We use three trigger types depending on the workflow's purpose:

| Trigger | When it fires | Why we use it |
|---|---|---|
| `push` | On direct push/merge to `main`/`master` | Ensures the main branch stays validated after every change |
| `pull_request` | On PR open/update targeting `main`/`master` | Acts as a gatekeeper before merge — catches regressions before they land |
| `schedule` (cron) | At a fixed time daily (e.g. `30 0 * * *` = 00:30 UTC = 6:00 AM IST) | Acts as a nightly health check, independent of any code change |
| `workflow_dispatch` | On-demand, triggered manually from the Actions tab | Lets QA/dev run a suite ad-hoc — before a release, for debugging, or to re-verify a fix |

A key point that's easy to get wrong in interviews: GitHub Actions cron always runs in **UTC**, so any IST time has to be converted (IST = UTC + 5:30).

**Interview Speaking Line:**
> "We use push and pull_request triggers to validate code as it merges into main, a scheduled cron trigger for a nightly health check that's independent of code changes, and `workflow_dispatch` for on-demand manual runs — useful before releases or when we need to re-run a fixed test without waiting for the next scheduled window. One thing to keep in mind is that GitHub's cron scheduler always runs in UTC, so we convert our required IST time accordingly."

---

## 4. Jobs, Steps, and the Post-Job Actions

**Explanation:**
A workflow is made of one or more **jobs**, and jobs can run independently in parallel or be made dependent on each other using `needs:`. In our current setup, we run everything inside a **single job** (`test`) on `ubuntu-latest` (or a containerized Playwright image), because our pipeline is linear — there's no benefit yet to splitting into multiple dependent jobs, though that's a natural next step if we introduce sharding or multi-browser matrices.

Within that single job, steps run sequentially, and they fall into two logical halves:

- **Setup → execution steps:** checkout the repo onto the runner, set up Node.js, install dependencies, install Playwright browsers, run the test suite.
- **Post-job / post-build steps:** these run *after* test execution, regardless of pass/fail, and handle result parsing, artifact archiving, and notifications.

In almost every automation pipeline, the post-job phase is where we:
1. Parse the JSON test report to get pass/fail/skip counts.
2. Archive results — HTML report, traces, screenshots, videos — as CI artifacts, with a retention period (in our case, retained for **60 days** before automatic cleanup).
3. Send an email notification to the respective stakeholders with the execution summary.

**Interview Speaking Line:**
> "A workflow can have one or more jobs, and jobs can be made dependent on each other using `needs`, or run independently in parallel. In our pipeline, we currently run everything in a single job — from checking out the repository on the runner all the way to post-build actions — since our flow is linear. The post-job phase is where we archive test artifacts like reports, logs, and traces with a 60-day retention policy, and send an email notification to the team with the execution summary — total, passed, failed, and skipped counts — so results are visible even without opening the Actions tab."

---

## 5. GitHub Actions Used and Their Role

**Explanation:**
GitHub Actions are reusable, pre-built units of automation that we plug into our steps instead of writing everything from scratch. The main ones in our pipeline:

| Action | Role |
|---|---|
| `actions/checkout@v4` | Clones the repository code onto the runner — without it, the runner is empty and no command can find our files |
| `actions/setup-node@v4` | Installs the required Node.js version on the runner (we use `lts/*` for the latest LTS) |
| `actions/upload-artifact@v4` | Uploads the report/results folders as downloadable CI artifacts |
| `dawidd6/action-send-mail@v3` | Sends the SMTP-based email notification with the run summary |

**Interview Speaking Line:**
> "We rely on standard, well-maintained GitHub Actions rather than writing custom scripts for common tasks — `actions/checkout` to pull the code onto the runner, `actions/setup-node` to provision the required Node version, `actions/upload-artifact` to persist our reports and traces, and a mail action to send out the execution summary. Using established actions keeps the workflow reliable and easy to maintain."

---

## 6. Passing Environment Variables / Config Values to the Framework via CI

**Explanation:**
Our Playwright framework needs runtime configuration — application URL, API URL, environment name, test user credentials, build number — and we don't hardcode these in the codebase. Instead, we define them under the job's `env:` block in the YAML, and the framework reads them (via `process.env` in the config or test setup):

```yaml
env:
  ENV:              E2E2
  APP_URL:          https://eventhub.rahulshettyacademy.com/login
  API_URL:          https://api.staging.myapp.com
  SERVICE_USER:     eventhubtestuser1@gmail.com
  SERVICE_PASSWORD: Eventhub@2026
  BUILD_NO:         ${{ github.run_number }}
```

This gives us environment portability — the same workflow file can point to staging, E2E, or prod simply by changing these values (or by wiring them to `workflow_dispatch` inputs for full flexibility), without touching a single line of test code.

**Interview Speaking Line:**
> "We inject environment-specific values — application URL, API URL, environment name, service credentials, and build number — through the `env:` block at the job level in the workflow YAML, and our Playwright config reads them via environment variables at runtime. This keeps the same workflow reusable across environments, since only the values change, not the pipeline logic or the test code."

---

## 7. Where Secrets Are Stored

**Explanation:**
Anything sensitive — passwords, API keys, SMTP credentials — is never hardcoded in the YAML or the codebase. It's stored in **GitHub repository Secrets** (Settings → Secrets and variables → Actions), which are encrypted at rest and only exposed to the workflow at runtime via `${{ secrets.SECRET_NAME }}`. For example, our email step uses a Gmail App Password stored as `secrets.GMAIL_APP_PASSWORD`, not a plaintext password.

**Interview Speaking Line:**
> "All sensitive values — like SMTP passwords or API keys — are stored in GitHub's encrypted repository Secrets, not in the YAML file itself. We reference them in the workflow using `${{ secrets.SECRET_NAME }}` syntax, so the actual value never appears in logs, in the code, or in version control."

---

## 8. Manual Trigger — `workflow_dispatch`

**Explanation:**
`workflow_dispatch` adds a "Run workflow" button in the Actions tab, letting an authorized team member trigger a run on-demand — no push or PR required. It can optionally accept **inputs** (a form filled in the UI) — for example, an `environment` or `test_target` field — which then get consumed inside the run via `${{ github.event.inputs.<name> }}`. If not wired into a step explicitly, an input is just a placeholder with no effect, so it's important to actually consume it in the run command if we want it to do something.

**Interview Speaking Line:**
> "`workflow_dispatch` gives us a manual trigger option directly from the Actions tab — useful for ad-hoc runs before a release, re-running a fix without waiting for the schedule, or letting a QA member kick off a suite without pushing code. It also supports custom inputs, like specifying an environment or a specific test tag to run, which we read inside the workflow using the `github.event.inputs` context."

---

## 9. Caching — The Problem and Our Approach

**Explanation:**
Without caching, every single run — even if nothing changed in `package.json` — re-downloads all node modules and re-installs Playwright's browser binaries from scratch, adding several minutes and wasting bandwidth. This is a known gap we're actively addressing rather than one we've fully solved:

- **`actions/setup-node`'s built-in cache** (`cache: 'npm'`) — caches `~/.npm` keyed on `package-lock.json`, so `npm install` is much faster when the lockfile hasn't changed.
- **`actions/cache` for Playwright browsers** — explicitly caching `~/.cache/ms-playwright`, keyed by the lockfile hash, and skipping the install step entirely when there's a cache hit.

The trade-off: first run (cache miss) sees no benefit, and cache keys must be tied to the lockfile hash so a version bump correctly invalidates stale cache.

**Interview Speaking Line:**
> "Right now our workflow re-installs dependencies and Playwright browsers on every run, which adds unnecessary time. We're addressing this by introducing npm caching through `actions/setup-node`'s built-in cache option, and explicit caching of the Playwright browser binaries using `actions/cache`, keyed on the `package-lock.json` hash so the cache invalidates correctly whenever versions change. This is an ongoing optimization rather than something we've fully rolled out yet."

---

## 10. JSON Report Parsing for the Email Summary

**Explanation:**
Playwright's JSON reporter produces a `jsonReport.json` file after every run, containing structured stats. We parse it with `jq` in a post-test step to extract the numbers we need:

```bash
TOTAL=$(jq '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' $REPORT_FILE)
PASSED=$(jq '.stats.expected + .stats.flaky' $REPORT_FILE)
FAILED=$(jq '.stats.unexpected' $REPORT_FILE)
SKIPPED=$(jq '.stats.skipped' $REPORT_FILE)
```

Key terminology: `expected` = normal pass, `unexpected` = actual failure, `flaky` = failed then passed on retry (counted as passed, but tracked separately as a quality signal), `skipped` = intentionally not run. These values are written to `$GITHUB_OUTPUT` so the email step downstream can consume them.

**Interview Speaking Line:**
> "After the test run, we parse Playwright's JSON report using `jq` to extract total, passed, failed, and skipped counts — where passed includes both expected passes and flaky tests that passed on retry, and failed maps to Playwright's `unexpected` category. We write these values to `GITHUB_OUTPUT` so they're available to the email notification step later in the same job."

---

## 11. Email Notification Flow — Required Parameters

**Explanation:**
The email step runs with `if: always()`, so it fires whether the run passed or failed — which is essential, because failure is exactly when the team most needs to know. The required data points that go into a meaningful summary:

- **Execution summary:** total, passed, failed, skipped counts, and overall job status (color-coded pass/fail).
- **Run metadata:** repository name, branch, commit SHA (linked), who triggered it, and a direct link to the Actions run.
- **SMTP config:** server address/port, sender username, and the password pulled from repository Secrets — never plaintext.

Deliberately excluded: detailed per-test breakdowns, screenshots, videos, or full logs — those live in the uploaded artifacts, not the email, to keep it a quick-glance notification rather than a heavy payload.

**Interview Speaking Line:**
> "Our email step is configured with `if: always()` so it fires on both pass and fail. It includes a summary — total, passed, failed, skipped, and overall status — plus run metadata like branch, commit, triggering actor, and a direct link to the Actions run. We deliberately keep it lightweight and don't attach detailed logs or screenshots — anyone who needs deeper investigation downloads the artifacts instead."

---

## 12. Our CI Strategy — Scheduled + Manual, Per Workflow

**Explanation:**
Each of our three workflows — sanity, regression, and BVT — is independently scheduled and also supports manual triggering:

| Workflow | Trigger | Typical duration | Purpose |
|---|---|---|---|
| Sanity / BVT | `push` / `pull_request` + optional manual | ~10 min | Fast feedback on core flows for every commit/PR |
| Regression | `schedule` (periodic) + `workflow_dispatch` | Longer (60 min timeout) | Deep, full-suite confidence before releases |
| Nightly | `schedule` (daily, off-hours) | Full suite | Catches environment drift independent of code changes |

Running the full regression suite on every push would slow down developer velocity, so we deliberately keep the fast suite tied to push/PR and push the heavier suite to schedule/manual triggers.

**Interview Speaking Line:**
> "Each of our workflows has its own trigger strategy suited to its purpose — sanity and BVT run on every push and PR for fast feedback, while regression runs on a schedule and also supports manual on-demand triggers, typically used before a release. This keeps day-to-day development fast while still giving us deep, periodic confidence through the heavier suite."

---

## 13. Handling Partial Regression Failures — Fix, Tag, Re-trigger

**Explanation:**
When a full regression run executes, say, 50 tests and 30 fail, we don't re-run the entire suite blindly, and we also don't cherry-pick and re-run a single test case in isolation — that defeats the purpose of regression coverage. Our approach:

1. Triage the failures using the uploaded artifacts (traces, screenshots, JSON report).
2. Fix genuine issues locally.
3. Tag the affected/fixed tests (e.g. `@regressionFix` or similar Playwright tag) and update the workflow's run command or `--grep` pattern to target that tag.
4. Trigger just that tagged subset via `workflow_dispatch` to confirm the fix, before merging back into the next full scheduled regression run.

This keeps regression a controlled, suite-level exercise rather than developers manually re-running one-off test cases, while still giving fast confirmation that fixes actually resolved the failures.

**Interview Speaking Line:**
> "When a regression run has failures — say 30 out of 50 — we don't just re-run a single failing test case in isolation, since that isn't representative of the suite's health. We fix the issue locally first, tag the relevant tests, update the workflow to target that tag using Playwright's `--grep` pattern, and trigger a manual run to confirm the fix. Once confirmed, it goes back into the next full scheduled regression run — so we maintain suite-level integrity rather than validating changes one test at a time."

---

## 14. How Dev Teams Leverage Our Workflows

**Explanation:**
Our workflows aren't only used by QA — the dev team integrates them into their own post-deployment pipelines. Specifically:

- The **smoke/BVT workflow completes in about 10 minutes** and covers major functionality — login, core navigation, critical happy paths — giving developers **instant feedback** right after a deployment, before anyone manually checks the build.
- Because URLs, environment, build number, and release version are all **parameterized** (via `env:` values or `workflow_dispatch` inputs) rather than hardcoded, the same workflow can be reused across environments and triggered by the dev team's own deployment pipeline with the correct values passed in.
- Common parameters passed in: application URL, service username/credentials, environment name, build number, and release version.
- This tight feedback loop means a broken deployment is caught within minutes, not discovered later through manual testing or customer reports.

**Interview Speaking Line:**
> "Our BVT/smoke workflow completes in around 10 minutes and covers the major functional flows, so it gives the dev team near-instant feedback right after a deployment. Since we parameterize values like URL, environment, build number, and release version instead of hardcoding them, the same workflow gets reused across the dev team's deployment pipelines — they simply pass in their own values and get immediate pass/fail visibility on their build."

---

## Quick Recap — All Topics in Sequence

| # | Topic | One-line takeaway |
|---|---|---|
| 1 | CI overview | Separate YAML per purpose (sanity/regression/BVT); push + cron + manual triggers |
| 2 | Workflow definition | Automated YAML-defined process triggered by an event |
| 3 | Trigger events | push (branch protection), PR (gatekeeping), cron (nightly, UTC-based), manual (on-demand) |
| 4 | Jobs & post-job actions | Single job today; post-build = archive artifacts (60-day retention) + email summary |
| 5 | Actions used | checkout, setup-node, upload-artifact, send-mail — each with a distinct role |
| 6 | Env variables | Passed via job-level `env:` block, framework reads via `process.env` |
| 7 | Secrets | Stored in GitHub encrypted Secrets, referenced via `${{ secrets.X }}` |
| 8 | Manual trigger | `workflow_dispatch`, optionally with custom inputs |
| 9 | Caching | Not fully solved yet — npm cache + Playwright browser cache in progress |
| 10 | JSON report parsing | `jq` extracts total/passed/failed/skipped from Playwright's JSON reporter |
| 11 | Email flow | `if: always()`; summary + metadata only, no heavy attachments |
| 12 | CI strategy | Each workflow independently scheduled + manually triggerable |
| 13 | Partial failure handling | Fix locally → tag → re-trigger tagged subset, never a single isolated TC |
| 14 | Dev team usage | Fast BVT (~10 min) + parameterized inputs reused in dev's own pipelines |