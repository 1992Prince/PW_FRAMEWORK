# Interview Question: Tests Pass Locally But Fail in CI — How Do You Handle It?

---

## The Problem

This is one of the most common and frustrating issues in test automation.
Tests pass perfectly on your local machine but fail when the same tests run in CI (GitHub Actions, Jenkins, etc.).

**Root causes are almost always infrastructure differences:**
- Different Node.js version
- Different browser version
- Different OS / system libraries
- Missing environment variables
- Different screen resolution or headless behaviour
- Timing differences due to slower CI machines

---

## Our Approach — Docker-First Validation

> **"We don't push to CI until the tests pass inside Docker locally — because Docker IS the CI environment."**

### The Golden Rule

```
Develop → Pass Locally → Pass in Docker Locally → Push to CI → Run/Schedule in CI
```

If tests pass in the Docker image on your machine, they will pass in CI — because **the same image is used in both places**.

---

## Step-by-Step Workflow

### Step 1 — Develop and pass tests locally

Write your tests and ensure they pass on your local machine first.

```bash
npx playwright test
```

---

### Step 2 — Build the Docker image locally

This packages your latest code, Node modules, and all Playwright browser binaries into one image.

> **Prerequisites on your local machine:**
> - Docker Desktop installed and running (Docker Engine must be up)
> - Playwright version in `Dockerfile` must match version in `package.json`
> - `headless: true` must be set in `playwright.config.js` (Docker has no display server)

```bash
# Build the image — run from the root of the project (where Dockerfile lives)
docker build -t pw-test .
```

- `-t pw-test` — names the image `pw-test`
- `.` — uses the Dockerfile in the current directory

Verify the image was created:
```bash
docker images
```

---

### Step 3 — Enter the Docker container interactively and run tests

```bash
docker run -it pw-test
```

- `-it` — interactive mode, drops you inside the container shell
- You are now inside `/app` directory (set as `WORKDIR` in Dockerfile)

Run your tests from inside the container:
```bash
npx playwright test
# or a specific tag:
npx playwright test --grep @sanity
```

If all tests pass here — you are done. Push to CI with confidence.

---

### Step 4 — If tests fail inside Docker: copy results to local for analysis

Use **volume mapping** to copy test reports, traces, and screenshots from the container back to your local machine.

```bash
# Run tests AND copy the results folder to your local project
docker run -it \
  -v "$(pwd)/src/reports:/app/src/reports" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  pw-test \
  npx playwright test
```

**What this does:**
- `-v local_path:container_path` — maps a local folder to a folder inside the container
- After the run, `playwright-report/`, `test-results/` (traces, screenshots, videos) appear in your local project
- Open the HTML report locally:

```bash
npx playwright show-report
# or for a trace:
npx playwright show-trace test-results/<test-name>/trace.zip
```

**On Windows (PowerShell), replace `$(pwd)` with `${PWD}`:**
```powershell
docker run -it `
  -v "${PWD}/src/reports:/app/src/reports" `
  -v "${PWD}/playwright-report:/app/playwright-report" `
  -v "${PWD}/test-results:/app/test-results" `
  pw-test `
  npx playwright test
```

---

### Step 5 — Fix issues, re-run in Docker, then push to CI

1. Analyse the HTML report, screenshots, traces from the volume-mapped output
2. Fix the failing tests
3. Re-build the image with the fix: `docker build -t pw-test .`
4. Re-run inside Docker and confirm all pass
5. Push to CI — the same image runs there, results will match

---

## Quick Reference — All Commands

| Action | Command |
|--------|---------|
| Build image | `docker build -t pw-test .` |
| List images | `docker images` |
| Run interactively | `docker run -it pw-test` |
| Run tests inside container | `npx playwright test` (from inside container) |
| Run with volume mapping (bash) | `docker run -it -v "$(pwd)/playwright-report:/app/playwright-report" pw-test npx playwright test` |
| Run with volume mapping (PowerShell) | `docker run -it -v "${PWD}/playwright-report:/app/playwright-report" pw-test npx playwright test` |
| View HTML report locally | `npx playwright show-report` |
| View trace locally | `npx playwright show-trace test-results/<name>/trace.zip` |

---

## Local Prerequisites Checklist

Before building the Docker image, verify:

- [ ] Docker Desktop is installed — [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- [ ] Docker Engine is running (check Docker Desktop tray icon)
- [ ] `playwright.config.js` has `headless: true` (Docker has no display — headed mode will crash the build)
- [ ] Playwright version in `Dockerfile` (`mcr.microsoft.com/playwright:vX.XX.X-noble`) matches the version in `package.json`
- [ ] All env variables needed by tests are either in `config.js` defaults or passed via `-e` flag to `docker run`

### Passing environment variables to Docker

```bash
docker run -it \
  -e APP_URL=https://staging.myapp.com \
  -e SERVICE_USER=user@myapp.com \
  -e SERVICE_PASSWORD=MyPassword \
  pw-test \
  npx playwright test
```

---

## How CI Uses the Same Image

In GitHub Actions / Jenkins, the same `mcr.microsoft.com/playwright` base image is referenced — or your built image is pushed to a container registry (Docker Hub, ECR, GCR) and pulled in CI:

```yaml
# GitHub Actions example
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.61.0-noble
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test
```

Because the **same base image** is used locally (via Docker Desktop) and in CI (via the pipeline container), the environment is identical — eliminating the "works on my machine" problem entirely.

---

## Interview-Speakable Answer

> *"One of the most common issues in automation is tests passing locally but failing in CI. My approach is to eliminate the environment difference entirely using Docker.*
>
> *I maintain a Dockerfile at the root of the framework that uses the official Playwright Docker image — the same version as in package.json. Before I push anything to CI, I build that image locally, enter it in interactive mode, and run my full test suite inside it. If tests pass there, I know they will pass in CI because the infrastructure is identical.*
>
> *If tests fail inside Docker, I use volume mapping to pull the playwright-report, screenshots, and trace files out of the container onto my local machine. I then open the HTML report and traces to do the RCA — same as I would for any CI failure. I fix the issue, rebuild the image, re-run, and only push to CI once tests are green inside Docker.*
>
> *So my pipeline is: develop → pass locally → pass in Docker locally → push to CI. This approach has eliminated 'works on my machine' issues completely from our team."*

---

## Why This Works

| Problem | Docker Solution |
|---------|----------------|
| Different Node version | Locked in Dockerfile FROM image |
| Different browser version | Playwright browsers installed inside image at fixed version |
| Different OS / libraries | Same `noble` (Ubuntu) base in both local Docker and CI |
| Missing system deps | `RUN npx playwright install --with-deps` covers all of them |
| Headed vs headless | Forced `headless: true` — consistent in both environments |
