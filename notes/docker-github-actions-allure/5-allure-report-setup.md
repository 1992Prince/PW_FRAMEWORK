
# Allure Report Setup with Playwright

## Steps

### 1. Install `allure-playwright`

Visit the package page for reference: [allure-playwright - npm](https://www.npmjs.com/package/allure-playwright)

Install using a package manager of your choice. For example, with npm:

```bash
npm install -D allure-playwright
```

### 2. Add the reporter in your Playwright config

```js
reporter: [["line"], ["allure-playwright"]],
```

### 3. Run your tests

When the test run completes, the result files will be generated in the `./allure-results` directory.

### 4. Install the Allure CLI

```bash
npm install -D allure-commandline
```

### 5. Generate the HTML report

```bash
npx allure generate ./allure-results --clean -o ./allure-report
```

- `--clean` wipes any old report from the `allure-report` folder before generating a new one.
- `-o ./allure-report` sets the output folder where the report will be generated (defaults to `./allure-report` anyway).

### 6. Open the report

```bash
npx allure open ./allure-report
```

Don't just double-click `index.html` — Allure's report uses `fetch`/XHR to load its JSON data files, which browsers block under `file://`. You need to serve it, and `allure open` spins up a local server for that purpose.

---

## Interview Q&A

**Q: Have you configured Allure report in your framework?**

**A:** No — Playwright already gives good built-in HTML reports along with other reporter formats (line, JSON, JUnit, etc.), so we wanted to keep the framework light and avoid an extra dependency/tool to maintain.

For execution charts and trends, all our execution metrics go into ELK (Elasticsearch + Kibana). We build monthly, weekly, and release-wise execution metrics dashboards from there instead of relying on Allure's built-in trend graphs.

That said, if the framework does need to integrate Allure reporting, the steps above can be followed one by one to set it up.
