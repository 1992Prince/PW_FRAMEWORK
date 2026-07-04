
# Top CI Interview Questions for SDET — With Model Answers

> Curated to the questions that actually separate a mid-level SDET from a senior one. Each has a short explanation of *why* it's asked, followed by a ready-to-speak answer.

---

## 1. Explain your CI strategy end-to-end

**Why it's asked:** Interviewers want to see you think in terms of *purpose-driven pipelines*, not one giant workflow doing everything.

**How to answer:** Map each workflow to a business need — release confidence, dev feedback, daily health check — and tie it to the right trigger.

**Interview Speaking Line:**

> "Our CI strategy is split by purpose, not bundled into one workflow. We have a regression YAML that runs a full suite and is triggered before releases — either on schedule or manually via `workflow_dispatch`. Separately, we have a smoke/BVT workflow that the dev team consumes right after their own deployments, which completes quickly and gives instant pass/fail feedback. On top of that, we run a scheduled job every morning to validate overnight builds, and occasionally a nightly job for off-hours, environment-drift checks. Keeping these separate means each pipeline stays fast for its purpose and we're not forcing a 10-minute smoke check and a 60-minute regression suite into the same trigger."

---

## 2. A test fails in CI but passes locally — how do you handle it?

**Why it's asked:** This is the classic "environment parity" question. It tests whether you actually understand *why* CI and local differ, not just that you re-run it.

**How to answer:** Explain your Docker-parity workflow step by step — you don't push straight from local to CI; you validate in a CI-identical container first.

**Interview Speaking Line:**

> "We don't push code straight from local development into GitHub and let the schedule pick it up. After developing a change locally, we build a Docker image using the exact same base image our CI uses, copy the code into it, and run the tests in interactive mode inside that container. Only once tests pass in that CI-parity environment do we push to GitHub and let the scheduled or triggered run pick it up. This removes most 'works on my machine' issues, since differences in OS, browser versions, or installed dependencies are usually what cause CI-only failures — running in the same image locally eliminates that gap before the code ever reaches CI."

---

## 3. How do you manage secrets, environment parameters, and artifact retention?

**Why it's asked:** Tests security hygiene and whether you think about traceability/audit, not just "does the pipeline run."

**How to answer:** Cover three things clearly — where secrets live, how environment values are passed, and what happens to artifacts after the retention window.

**Interview Speaking Line:**

> "Secrets like credentials and SMTP passwords are stored in GitHub's encrypted repository Secrets and referenced in the workflow using `${{ secrets.NAME }}` — they never appear in the YAML or in logs. Environment-specific parameters — URL, environment name, build number, release version — are passed through the job's `env:` block or as `workflow_dispatch` inputs, so the same workflow is reusable across environments without code changes. For artifacts, we retain reports, traces, and logs in CI for 60 days. Beyond convenience, that's also our safety window — after each execution, the team downloads the report and attaches it to ALM or Jira as evidence against the corresponding test cycle or defect. So even after the 60-day CI retention expires, the proof of execution still exists in ALM/Jira and can be referenced later if we need to validate what happened in a past run."

---

## 4. How do you handle flaky tests in CI?

**Why it's asked:** Every real CI pipeline has flaky tests eventually — this checks whether you have a *process* for them rather than just ignoring failures.

**How to answer:** Distinguish flaky from genuine failure, mention retries as a stopgap, and describe how you track and eventually fix root cause instead of permanently relying on retries.

**Interview Speaking Line:**

> "We configure retries at the framework level so a test that fails once and passes on retry is marked flaky rather than failed — that keeps the pipeline from blocking on transient timing or environment issues. But we don't treat retries as a permanent fix. Flaky counts are tracked separately in our report, and if a test shows up as flaky repeatedly across runs, we treat that as a quality signal and investigate the root cause — usually a timing issue, an unstable locator, or an environment dependency — rather than just letting retries mask it indefinitely."

---

## 5. How would you scale this pipeline as the test suite grows?

**Why it's asked:** Senior-level question — checks if you're thinking ahead about run time, cost, and maintainability, not just today's setup.

**How to answer:** Mention sharding/matrix parallelization, caching, and splitting jobs — concrete, not vague.

**Interview Speaking Line:**

> "As the suite grows, the biggest risk is run time creeping past our timeout and slowing feedback. My approach would be to introduce Playwright's `--shard` flag combined with a matrix strategy, so tests split across multiple parallel jobs instead of running sequentially in one job. I'd also add caching for `npm install` and the Playwright browser binaries, since those are fixed overhead on every run regardless of suite size. If a single job becomes a bottleneck, I'd separate setup, execution, and reporting into distinct dependent jobs using `needs`, so we get better visibility into where time is actually being spent."

---

## 6. How do you ensure broken code doesn't reach the main branch?

**Why it's asked:** Tests understanding of PR gatekeeping and branch protection — a core CI/CD governance concept.

**How to answer:** Tie the sanity/BVT trigger to PR checks and branch protection rules, not just "we run tests."

**Interview Speaking Line:**

> "Our sanity/BVT workflow runs on every pull_request targeting main, and we've set a branch protection rule that requires this check to pass before a merge is even allowed — so it's enforced, not just a suggestion. If the check fails, the reviewer sees a red status directly on the PR and blocks the merge until it's fixed. That way, broken code is stopped before it reaches main rather than being caught after the fact."

---

## Quick Recap

| # | Question                 | One-line takeaway                                                                                       |
| - | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1 | CI strategy              | Purpose-split workflows — regression (release), smoke/BVT (dev feedback), daily/nightly (health check) |
| 2 | CI vs local mismatch     | Validate in a CI-identical Docker image locally before pushing — never push straight from local        |
| 3 | Secrets/params/artifacts | Secrets encrypted in GitHub, params via`env`/inputs, 60-day CI retention backed by ALM/Jira archival  |
| 4 | Flaky tests              | Retries as a stopgap, but track and root-cause repeat flakiness — don't rely on retries permanently    |
| 5 | Scaling                  | Sharding + matrix parallelization + caching + job separation                                            |
| 6 | Branch protection        | PR-gated sanity/BVT check enforced via branch protection rule                                           |
