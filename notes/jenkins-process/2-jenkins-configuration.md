## Topic 7: Build Triggers Deep Dive

Located in Freestyle → **Configure → Build Triggers** section. This decides *when* a job runs. Five main options:

### 1. Trigger builds remotely (e.g., from scripts)

- Generates a unique **URL token** for the job
- Hitting that URL (via curl, script, Postman, or another tool like Jira/Xray) triggers the build
- **Use case:** External CI/CD pipeline or test management tool needs to kick off this job programmatically

### 2. Build after other projects are built

- Chaining option — this job starts automatically once another specified job finishes
- **Use case:** Job1 = "Deploy to QA" → once it completes → Job2 = "Run Automation Regression" triggers automatically
- This is the basis of upstream/downstream job relationships (Job1 = upstream, Job2 = downstream)

### 3. Build periodically

- **This is where CRON expression scheduling lives**
- Jenkins itself runs the job at the scheduled time — regardless of whether code changed or not
- **Use case:** Nightly regression at 2 AM (`H 2 * * *`), scheduled independent of commits

### 4. GitHub hook trigger for GITScm polling

- This is the **webhook** option
- GitHub is configured to notify Jenkins the moment a push happens (via a webhook URL set on the GitHub repo side)
- Jenkins reacts **instantly** — no waiting, no polling delay
- **Use case:** Run tests automatically the moment a QA/dev commits code

### 5. Poll SCM

- Jenkins itself repeatedly checks the repo at a scheduled interval (also uses CRON-style syntax) to see if there's a new commit
- If a new commit is found, only then does it trigger a build
- **Use case:** `H/5 * * * *` → Jenkins checks repo every 5 minutes

### Poll SCM vs Webhook (classic interview question)

| | Poll SCM | Webhook (GitHub hook) |
|---|---|---|
| Who initiates | Jenkins checks repo repeatedly | GitHub notifies Jenkins |
| Efficiency | Less efficient (constant checking even with no changes) | More efficient (instant, event-driven) |
| Delay | Depends on poll interval | Near-instant |
| Setup | CRON-style schedule inside Jenkins | Webhook configured on GitHub repo side |

**How to answer in interview:**
"Build Triggers has five options. The two most common for us are 'Build periodically' — where we set a CRON expression for scheduled runs like nightly regression — and 'GitHub hook trigger,' which is webhook-based, so GitHub notifies Jenkins instantly on a commit. We also use 'Build after other projects' for chaining, like triggering regression after a QA deployment job completes. Poll SCM is the older alternative to webhooks — Jenkins checks the repo itself at intervals instead of being notified, so it's less efficient than a webhook."

---

## Topic 8: CRON Expression Mastery

This is asked constantly, so know it cold.

### The 5-field format

```
MINUTE   HOUR   DAY_OF_MONTH   MONTH   DAY_OF_WEEK
 (0-59)  (0-23)    (1-31)      (1-12)    (0-7)
```

- Day of week: 0 or 7 = Sunday
- Read order for building an expression: **Minute → Hour → Day → Month → Weekday** (small to big)

### Symbols

| Symbol | Meaning |
|---|---|
| `*` | any/all values for that field |
| `,` | multiple specific values (e.g., `9,17` = 9 AM and 5 PM) |
| `-` | range (e.g., `1-5` = Monday to Friday) |
| `/` | step — every N units (e.g., `*/15` = every 15 min) |
| `H` | Jenkins-only "hash" symbol — spreads load so multiple jobs don't all start at the exact same second |

### Jenkins CRON vs Linux CRON (interview favorite)

Jenkins adds the special `H` symbol, which Linux cron doesn't have. `H` introduces controlled randomness so that if many jobs are scheduled at the same time (e.g., `0 2 * * *` for hundreds of jobs), they don't all hit the server in the same second and overload it. Jenkins internally picks a consistent-but-random offset per job.

### Worked examples (practice reading these out loud)

**`0 2 * * *`**

- Minute=0, Hour=2, rest=* → **Every day at exactly 2:00 AM**

**`H 2 * * *`**

- Same as above but Jenkins picks a random minute near hour 2 for load distribution → **Nightly around 2 AM**

**`30 9 * * 1-5`**

- Minute=30, Hour=9, Day of week=Mon-Fri → **Every weekday at 9:30 AM**

**`H/15 * * * *`**

- Every 15 minutes (H spreads out exactly when within each 15-min window) → common for **Poll SCM**

**`0 3 * * 0`**

- **Every Sunday at 3:00 AM** (weekly regression)

**`0 0 1 * *`**

- Day of month=1, rest wildcard except minute/hour=0 → **First day of every month, midnight**

**`0 9,17 * * *`**

- Comma = multiple times → **Every day at 9 AM AND 5 PM**

**`0 18 * * 1,4`**

- **Every Monday and Thursday at 6:00 PM**

**`30 8 * * 1-5`** + **`30 16 * * 5`** (multiple lines in the same Schedule box)

- Jenkins reads each line as a separate schedule and triggers on all of them
- Meaning: **Weekdays at 8:30 AM, PLUS an extra run every Friday at 4:30 PM**

### Shortcuts

| Shortcut | Equivalent |
|---|---|
| `@yearly` / `@annually` | `0 0 1 1 *` |
| `@monthly` | `0 0 1 * *` |
| `@weekly` | `0 0 * * 0` |
| `@daily` / `@midnight` | `0 0 * * *` |
| `@hourly` | `0 * * * *` |
| `@reboot` | runs right after Jenkins/system restart (no cron equivalent) |

### Nightly job concept (why SDETs use it)

- Full regression suites are long-running (30 min to few hours) — running them during work hours blocks resources
- So they're scheduled late night (typically 11 PM or 12 AM): `0 23 * * *` or `0 0 * * *`
- Suite runs overnight → next morning the team has results ready without waiting

**How to answer "How does `0 2 * * *` ensure nightly run?" (very common question):**
"Minute=0 means exact start of the hour, Hour=2 means 2 AM. The remaining three fields — day of month, month, day of week — are all `*`, meaning they match any value. So the only real constraint is the time, and since day/month/weekday don't restrict it, the job fires every single day at exactly 2:00 AM."

**How to answer "Can you schedule multiple times for one job?":**
"Yes — Jenkins lets you add multiple CRON lines in the same 'Build periodically' schedule box. For example, `30 8 * * 1-5` for weekday mornings, plus `30 16 * * 5` for an extra Friday afternoon run. Jenkins evaluates each line independently and triggers on all matching times."

---

## Topic 9: Post-Build Actions Deep Dive

Located in Freestyle → **Configure → Post-build Actions → Add post-build action**. This defines what Jenkins does *after* the build steps run, regardless of pass/fail (unless conditioned).

### 1. Archive the artifacts ✅ (most important)

- Saves output files (reports, logs, screenshots) into Jenkins storage so they're downloadable/viewable even after the job finishes
- Example: `playwright-report/**` archives the entire Playwright HTML report folder
- Even on failure, you can still access what was captured (useful for debugging)

### 2. Publish HTML report

- Requires the **HTML Publisher Plugin**
- Points Jenkins to a report directory + main file so it renders inside the Jenkins UI itself (not just a downloadable zip)
- Config needs: `reportDir`, `reportFiles` (e.g., `index.html`), `reportName`

### 3. Publish JUnit test result report ✅

- If your test runner outputs JUnit XML format (Playwright supports `--reporter=junit`), Jenkins parses it and shows a proper **pass/fail trend graph** on the job dashboard over multiple builds
- Very valuable for tracking flakiness/trend over time — often specifically asked about in interviews

### 4. Email Notification / Editable Email Notification ✅

- Sends build result emails to a defined recipient list
- Covered in depth in Topic 10 below

### 5. Build other projects

- Chaining — automatically triggers another job once this one finishes
- **Use case:** Deploy job → triggers → Regression job (used in MasterJob-style sequential flows)

### Less commonly used (know they exist, don't over-invest)

- Aggregate downstream test results — merges results when this job triggers other jobs
- Record fingerprints of files — file tracking across builds
- Git Publisher — Git actions like tagging after a build
- Set GitHub commit status — posts pending/success/fail status back to a GitHub PR
- Delete workspace when build is done — cleanup after archiving is complete

**How to answer in interview:**
"In Post-build Actions, I mainly use four things: Archive the artifacts to save the Playwright report folder, Publish HTML report so the report renders inside Jenkins UI, Publish JUnit test results for pass/fail trend graphs across builds, and Email Notification to alert the team on failures. If jobs are chained, I also use 'Build other projects' to trigger the next job in sequence."

---

## Topic 10: Email Notification Setup

Two approaches exist in Jenkins:

### Method 1: Default "E-mail Notification"

Basic, built into Jenkins — but **only sends emails on failed/unstable builds**, not on success.

**Pre-setup (Gmail-specific):**

- Google disabled "less secure app access," so you need an **App Password**:

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate an **App Password** (App: Mail, Device: Other)
4. Copy this password — used in Jenkins instead of your real Gmail password

**System-level config (Manage Jenkins → Configure System → E-mail Notification):**

- SMTP server: `smtp.gmail.com`
- Use SSL: checked
- SMTP Port: `465`
- Advanced → Username: your Gmail address
- Password: the App Password (not your login password)
- Test using "Test configuration by sending test e-mail"

**Job-level config:**

- Post-build Actions → Add "E-mail Notification"
- Enter recipients (comma-separated)
- Options: send on unstable build, notify individuals who broke the build

**Limitation:** Only fires on failure/unstable — no success notifications. This is exactly why teams move to Method 2.

### Method 2: Email Extension Plugin ("Editable Email Notification") — the enterprise standard

More flexible: custom subject/body (HTML), multiple triggers (Success/Failure/Unstable/Aborted/Always), attachments.

**Setup steps:**

1. **Install plugin:** Manage Jenkins → Plugins → search "Email Extension Plugin" → Install
2. **Add Gmail credentials:** Manage Jenkins → Credentials → Global → Add Credentials → type "Username with password" → Gmail address + App Password → give it an ID (e.g., `gmail-credentials`)
3. **Configure system-level "Extended E-mail Notification":**

- SMTP Server: `smtp.gmail.com`, Port `465`, SSL ✔️, TLS ✔️
- Credentials: select the one added above
- Default Subject: `$PROJECT_NAME - Build # $BUILD_NUMBER - $BUILD_STATUS!`
- Default Triggers: check **"Always"** so it fires on every outcome
4. **Job-level config:** Post-build Actions → "Editable Email Notification"

- Recipient list (comma-separated)
- Content Type: HTML (for styled reports)
- Subject/Content: use Jenkins variables — `$PROJECT_NAME`, `$BUILD_NUMBER`, `$BUILD_STATUS`, `$BUILD_URL`
- Attachments: e.g., `**/index.html` to attach the report directly in the email
- Triggers: choose Always, Failure, etc.

**Common enterprise reality (matches your setup):**
In most companies, plugin + SMTP is **already configured at system level** by DevOps. As an SDET, you typically only:

- Add "Editable Email Notification" under Post-build Actions in your job
- Fill in recipients, subject, content
- Optionally attach the report (e.g., `**/index.html`)

**How to answer in interview:**
"Jenkins has two email options — the default 'E-mail Notification,' which only fires on failures, and the 'Email Extension Plugin,' which is more flexible and lets you trigger on Always/Success/Failure with custom HTML content and attachments. In enterprise setups, the SMTP and plugin config is usually already done at system level, so as an SDET I just add 'Editable Email Notification' in Post-build Actions, set recipients, subject, and attach the report — for example the Playwright `index.html` — so the team gets the result summary directly in their inbox."

---

Ready for topics 11–12 (Jenkinsfile syntax + real pipeline example) whenever you want to continue.

---

## Topic 11: Jenkinsfile & Declarative Pipeline Syntax

**What is a Jenkinsfile?**
A text file named `Jenkinsfile`, stored in the root of your automation repo. It contains the entire pipeline logic **as code**, and Jenkins reads and executes it automatically.

```
playwright-framework/
├── tests/
├── package.json
├── playwright.config.ts
└── Jenkinsfile
```

### Basic Declarative Pipeline structure

```
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building the project...'
            }
        }
        stage('Test') {
            steps {
                echo 'Running tests...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying project...'
            }
        }
    }

    post {
        success {
            echo 'Job succeeded!'
        }
        failure {
            echo 'Job failed!'
        }
        always {
            echo 'Job completed (success or failure).'
        }
    }
}
```

### Block-by-block breakdown

**`pipeline { }`** — the main wrapper block; everything lives inside this.

**`agent`** — tells Jenkins *where* (which machine/node) to run the job.

- `agent any` → run on any available Jenkins agent
- **`agent { label 'playwright-agent' }`** → run only on an agent tagged with that specific label (e.g., a Windows node set up for Playwright, or a specific pod template in Kubernetes)
- This is exactly how you'd restrict a pipeline job to a particular node — the pipeline equivalent of "Restrict where this project can run" in Freestyle.

**`environment { }`** — define environment variables usable across the pipeline

```
environment {
    CI = 'true'
}
```

**`stages { }`** — a container holding multiple `stage` blocks. Each stage = one logical step of your pipeline (Checkout, Install, Test, Report — like chapters of your automation run).

**`steps { }`** — inside each stage, this is where the actual commands go (`sh`, `bat`, `echo`, etc.)

```
stage('Run Tests') {
    steps {
        sh 'npx playwright test'
    }
}
```

**`post { }`** — defines what happens *after* the pipeline runs, based on outcome:

- `success` → runs only if all stages passed
- `failure` → runs if any stage failed
- `always` → runs regardless of outcome (cleanup, archiving, etc.)

### Common Jenkinsfile commands cheat sheet

| Command | Meaning |
|---|---|
| `sh 'command'` | run shell command (Linux/Mac agent) |
| `bat 'command'` | run command on Windows agent |
| `echo 'text'` | print message to console |
| `git 'url'` | checkout repo |
| `publishHTML(...)` | publish HTML (Playwright) report |
| `cleanWs()` | clean workspace after build |

**How to answer in interview (minimal syntax to write on whiteboard):**
"A Declarative Jenkinsfile starts with `pipeline { agent any }`, then a `stages` block containing individual `stage` blocks — each with a `steps` block for actual commands like `sh` or `bat`. At the end, a `post` block handles success/failure/always actions like sending notifications or cleaning the workspace. If I need a job to run on a specific machine — say a Windows node for Playwright — I replace `agent any` with `agent { label 'playwright-agent' }`, matching the label configured on that node."

---

## Topic 12: Real Pipeline Example (Playwright)

### Example 1 — Basic Playwright pipeline (Linux agent, HTML report)

```
pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/user/playwright-framework.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Run Playwright Tests') {
            steps {
                sh 'npx playwright test --reporter=html'
            }
        }
        stage('Publish Report') {
            steps {
                publishHTML(target: [
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright HTML Report'
                ])
            }
        }
    }

    post {
        always {
            echo 'Cleaning workspace...'
            cleanWs()
        }
    }
}
```

### Example 2 — Windows agent, specific label, headed run, artifact archiving

This is closer to a real enterprise setup — using a labeled agent, batch commands, environment variable set inline, and both archiving + publishing:

```
pipeline {
    agent { label 'playwright-agent' }   // change label to match your node, e.g. "win-agent"

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/1992Prince/pw-e2e-framework.git'
            }
        }
        stage('Install & Playwright Setup') {
            steps {
                bat """
                call npm ci
                call npx playwright install --with-deps
                """
            }
        }
        stage('Run Playwright Tests') {
            steps {
                bat """
                set "ENV=prod_config"
                call npx playwright test --project=advantage-app --headed --reporter=html
                """
            }
        }
        stage('Archive & Publish Report') {
            steps {
                archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true
                publishHTML([
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright HTML Report',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', onlyIfSuccessful: false, fingerprint: true
        }
        failure {
            echo "Build failed. Check console output and the archived report."
        }
        success {
            echo "Build succeeded. Playwright HTML report is published."
        }
    }
}
```

**Key points to notice and explain if asked:**

- Multiple commands inside one `bat`/`sh` block (using triple-quoted string) so environment variables set in one line (like `set "ENV=prod_config"`) persist for the next command in the *same* block. If you split them into separate `bat` steps, the variable would be lost between steps (each `bat`/`sh` call is a fresh shell).
- `archiveArtifacts` appears twice — once explicitly after tests, and again in `post { always }` to guarantee artifacts are captured even if a stage fails before reaching the normal archive step.

### Advanced variant — Allure reports instead of HTML

```
stage('Run Playwright Tests') {
    steps {
        sh 'npx playwright test --reporter=line,allure-playwright'
    }
}
stage('Generate Allure Report') {
    steps {
        sh 'npx allure generate allure-results --clean -o allure-report'
    }
}
stage('Publish Allure Report') {
    steps {
        allure([
            includeProperties: false,
            jdk: '',
            results: [[path: 'allure-results']]
        ])
    }
}
```

**Execution flow (what actually happens when Jenkins runs this):**

1. Jenkins reads the Jenkinsfile
2. Allocates an agent matching the label (or any, if unrestricted)
3. Clones the Git repo
4. Installs Node.js + dependencies
5. Runs Playwright tests
6. Generates and publishes the report (HTML or Allure)
7. Marks the build ✅ or ❌ based on exit status

**How to answer in interview:**
"Here's a typical Jenkinsfile for our Playwright pipeline: it checks out code, runs `npm ci` and `playwright install` to set up dependencies, runs the tests with the HTML reporter, then archives and publishes the report using `publishHTML`. If the project needs Windows-specific execution — say for Edge browser tests — I'd use `agent { label 'win-agent' }` and switch `sh` to `bat`. The `post` block ensures cleanup and archiving happen regardless of pass/fail."

---

## Topic 13: Jenkins Plugins for Automation

Plugins extend Jenkins beyond its core capability. These are the ones most relevant to SDET/automation work:

| Plugin | Purpose |
|---|---|
| **NodeJS Plugin** | Enables running Node-based commands (`npm install`, `npx playwright`) — needed since Jenkins core doesn't know Node.js by default |
| **HTML Publisher Plugin** | Enables `publishHTML(...)` step — required to render Playwright's HTML report inside Jenkins UI |
| **Allure Jenkins Plugin** | Enables the `allure(...)` pipeline step — publishes Allure reports with rich, interactive dashboards |
| **Git Plugin** | Enables Git-based checkout (`git branch:`, `git url:`) — almost always pre-installed |
| **Email Extension Plugin** | Enables "Editable Email Notification" — flexible, HTML-based, multi-trigger emails (as covered in Topic 10) |
| **Credentials Plugin** | Enables secure storage/injection of secrets, tokens, passwords (used for SCM auth, email auth, API tokens) |
| **Kubernetes Plugin** | (Your enterprise setup) — spins up pod-based agents dynamically from a pod template, destroys them after job completion |
| **TestNG Plugin** | If using Java/TestNG-based frameworks (Selenium), parses and displays TestNG XML results |
| **JUnit Plugin** | Parses JUnit XML output for pass/fail trend graphs (Playwright supports `--reporter=junit`) |

**How plugins fit into the bigger picture:**
Most of these are usually already installed/configured at the system level in an enterprise Jenkins instance (by DevOps). As an SDET, you typically just consume plugin features inside your Jenkinsfile or Freestyle Post-build Actions — you rarely install them yourself, though you should know **which plugin enables which feature**, since that's a common interview question ("what plugin does `publishHTML` need?" → HTML Publisher Plugin).

**How to answer in interview:**
"The core plugins we rely on are the NodeJS plugin for running npm/playwright commands, HTML Publisher for rendering the Playwright report inside Jenkins, and Allure plugin when we use Allure reporting instead. We also use the Email Extension plugin for customizable notifications, and since our Jenkins runs on Kubernetes, the Kubernetes plugin manages our on-demand pod agents. Most of these are pre-configured by the DevOps team; my role is mainly to reference them correctly inside my Jenkinsfile or Post-build Actions."

---

Next up: Topic 14 (Job Chaining / MasterJob), 15 (Views), 16 (Access Management) — let me know when to continue.
