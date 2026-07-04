## Topic 1: Jenkins Overview & Installation

**What is Jenkins?**
Jenkins is an open-source automation server used to build, test, and deploy code automatically (CI/CD). It runs jobs — Freestyle or Pipeline — that execute your automation/build commands on schedule or trigger.

**Installation (basic, for awareness only)**

- Jenkins comes as a `.war` file. You run it with:

```
java -jar jenkins.war --httpPort=8080
```
- By default, it starts on port 8080, accessible at `http://localhost:8080`
- First-time setup asks for an unlock key (found in a local file path Jenkins shows you), then you install suggested plugins and create an admin user.

**Local vs Enterprise reality**

- **Local/practice setup:** You install Jenkins yourself, it runs on your machine, and by default you get access to 2 built-in agents (executors) — which are actually your own machine.
- **Enterprise setup:** You almost never install Jenkins yourself. It's already set up on a server, VM, or Kubernetes cluster by DevOps/Platform team. You're just given a URL and access (login credentials or SSO). Your job is to create jobs/pipelines, not maintain the server.

**How to answer in interview:**
"I understand Jenkins installation and basic setup — running the war file, default port 8080 — but in my day-to-day work, Jenkins is centrally managed by the DevOps team on [server/Kubernetes cluster], and we're given access to create and manage our own jobs and views."

---

## Topic 2: Jenkins Architecture — Master & Agents

**Master (Controller)**

- The main Jenkins server. It schedules jobs, manages configuration, serves the UI, and stores job history.
- It does NOT usually run the actual build/test commands itself in a distributed setup — it delegates that to agents.

**Agent (Node)**

- A separate machine (or container/pod) where the actual job executes.
- Agents can be:

- Your own local machine (default, when Jenkins is freshly installed)
- A dedicated Windows/Linux machine
- A Docker container
- A Kubernetes pod (spun up on demand, destroyed after execution)

**Why agents matter**

- Different jobs may need different environments — e.g., Edge browser tests need a Windows agent, Chrome/Linux-based tests need a Linux agent.
- You can **restrict a job to a specific agent** using labels (e.g., `agent { label 'playwright-agent' }` in Jenkinsfile, or "Restrict where this project can run" in Freestyle).

**Your enterprise setup (good interview talking point)**

- Jenkins is deployed on a Kubernetes cluster via a plugin.
- Agents are **ephemeral pods** — created fresh for each job run using a **pod template** that references your team's Docker image (hosted on your client's Docker Hub/registry).
- After the job finishes, the pod is destroyed — no leftover state, always a clean environment.
- Artifacts (like Playwright reports) are copied to a **shared PVC (Persistent Volume Claim)** in the cluster, accessible via a service, and the `index.html` report is also emailed to recipients.

**How to answer in interview:**
"Jenkins follows a master-agent architecture. In my project, Jenkins runs on Kubernetes, and agents are Docker-based pods created on demand using our pod template with our custom image. Once the job finishes, the pod is destroyed. Reports are copied to a PVC for shared access and also emailed as HTML attachments."

---

## Topic 3: Setting Up a New Agent/Node

**When you'd do this (mainly for local practice, but good to know)**
Path: **Manage Jenkins → Nodes → New Node**

- Give the node a name
- Choose "Permanent Agent"
- Set remote root directory, labels, and usage
- Also you can give label name to this agent, and when creating freestyle jobs or pipeline
  you can give this label name and these jobs will run only in these agents.

**Connecting the agent (local Windows machine example)**
Jenkins gives you a command like:

```
curl.exe -sO http://localhost:8080/jnlpJars/agent.jar
java -jar agent.jar -url http://localhost:8080/ ^
-secret <secret-token> ^
-name Node1 -webSocket -workDir "/home/jenkins/agent"
```

Running this connects your machine as an agent to the Jenkins master.

**If agent is Docker/Linux**
Jenkins UI shows a different, environment-specific command (with the same secret-based authentication) on the "New Node" page — you just copy-paste and run it there.

**Agent status**

- If the command is running → node shows **Online** in Jenkins dashboard
- If not run / connection dropped → node shows **Offline**

**In Kubernetes-based setups (your case)**

- You don't manually run these commands — the Kubernetes plugin handles agent (pod) creation and connection automatically based on the pod template you've configured. Pods register themselves as agents, run the job, then get destroyed.

**How to answer in interview:**
"To add an agent manually, you go to Manage Jenkins → Nodes → New Node, and Jenkins gives you a secret-based command to run on that machine — for example `java -jar agent.jar -url ... -secret ... -name Node1`. Once that command runs, the node shows as Online. In my current project though, this is automated — the Kubernetes plugin creates pod-based agents on demand using our pod template, so there's no manual node setup involved."

---

Ready for topics 4 and 5 (Freestyle vs Pipeline, and Freestyle components in sequence) whenever you want them.

---

## Topic 4: Freestyle Job vs Pipeline (Jenkinsfile) — Corrected

**Starting point: Creating a job in Jenkins**
From the Jenkins Dashboard, click **New Item** on the left. You'll see multiple job type options — Freestyle project, Pipeline, Maven project, Multibranch Pipeline, and a few others. As an SDET, you'll mostly work with two of these:

- **Freestyle project** — very common, especially for simpler or individual jobs
- **Pipeline** — used sometimes, mainly for complex/end-to-end workflows

### Freestyle Job

- Everything is configured manually through the Jenkins **UI** — you fill in details section by section (SCM, triggers, build steps, post-build actions, etc.)
- Since it's UI-based, it's simple to understand and quick to set up — good for people getting started or for straightforward jobs
- **Limitation:** Because it's just UI fields, you miss out on advanced logic — things like parallel execution, conditional stages, retries, or branching logic aren't really possible in Freestyle. You're limited to what the UI form gives you.

### Pipeline (Jenkinsfile)

- Purpose: cover everything Freestyle does, **plus** support advanced automation logic
- A **Jenkinsfile** is a text file (stored in your Git repo, usually at root) that defines the entire pipeline **as code**, using `stages` and `steps`
- Whatever you configured manually in Freestyle (checkout, install, test, report, email) can be written as code here — but now you also get:

- Parallel stage execution
- Conditional logic (`when` blocks)
- Retries
- Reusable/shared pipeline logic across projects
- Version control (Jenkinsfile lives in Git, so it's reviewable in PRs, just like code)

**Bottom line:**

- Freestyle → good for simple jobs, quick UI setup, but no advanced control flow
- Pipeline (Jenkinsfile) → needed for complex jobs — written in a `pipeline { stages { ... } }` structure, and this is what we cover next as its own topic (Jenkinsfile syntax, stages, post block, etc.)

**How to answer in interview:**
"From Jenkins Dashboard, when you click New Item, you get options like Freestyle project, Pipeline, Maven project, etc. We mostly use Freestyle for simpler jobs since everything is UI-configured and easy to set up — but it doesn't support advanced logic like parallel stages or conditions. For complex CI/CD flows, we use Pipeline with a Jenkinsfile, where the same setup — checkout, build, test, report — is written as code inside `stages`, and we additionally get features like parallel execution, conditional steps, and retries."

---

### Topic 5: Freestyle Job Components — In Sequence

This is the backbone of most Freestyle interview questions. Walk through it top to bottom exactly as it appears in Jenkins UI when you click **Configure**.

#### **a) General**

- Job description (free text — what the job does)
- **This project is parameterized** ← THIS is where you enable parameters (Choice/String/Boolean/Credentials)
- Discard old builds (retention policy, e.g., keep last 20)
- GitHub project URL (link only, not SCM config)
- Restrict where this project can run (agent/node label, e.g., Windows for Edge tests)

#### **b) Source Code Management (SCM)**

- Select Git
- Repo URL
- Credentials (if private repo)
- Branch to build (usually `main`)
- Additional Behaviours (e.g., "Clean before checkout")

#### **c) Build Triggers** ← THIS is where cron/schedule/webhook live

- **Trigger builds remotely** — generates a URL token; hitting that URL (via script/curl/Postman) triggers the job
- **Build after other projects are built** — chaining (upstream/downstream jobs)
- **Build periodically** — THIS is where you enter the **CRON expression** (e.g., `H 2 * * *` for nightly at 2 AM)
- **GitHub hook trigger for GITScm polling** — THIS is the webhook option; GitHub notifies Jenkins on push, job runs instantly
- **Poll SCM** — Jenkins itself checks the repo at intervals using a cron-style expression (e.g., `H/5 * * * *` = check every 5 min); different from webhook because Jenkins pulls instead of GitHub pushing

*(Poll SCM vs Webhook is a classic interview question — Poll SCM = Jenkins checks repeatedly; Webhook = GitHub notifies Jenkins instantly on commit. Webhook is more efficient.)*

#### **d) Build Environment**

- Delete workspace before build starts (clean run)
- Use secret text(s)/file(s) (inject tokens/passwords securely)
- Provide Node & npm bin/folder to PATH (needed for Playwright/Cypress)
- Add timestamps to console output (debugging)
- Terminate a build if it's stuck (avoid hung jobs)

#### **e) Build Steps**

- The actual commands: Execute Windows batch command / Execute shell / Invoke Maven/Gradle
- Example: `npm ci` → `npx playwright install --with-deps` → `npx playwright test`

#### **f) Post-build Actions**

- Archive the artifacts (save reports/logs/screenshots)
- Publish JUnit test result report (trend graphs)
- Publish HTML report (Playwright HTML report)
- Email Notification / Editable Email Notification (send results)
- Build other projects (trigger next job in chain)
- Delete workspace when build is done

**How to answer in interview (the "walk me through it" answer):**

"A Freestyle job has 6 sections in sequence: General — where I set description and enable parameters; SCM — where I connect the Git repo and branch; Build Triggers — where I configure cron scheduling or webhooks; Build Environment — where I clean workspace and set PATH/credentials; Build Steps — where I run the actual test commands; and Post-build Actions — where I archive reports and send email notifications."

---

### Topic 6: Parameterizing a Job

**Where:** General section → tick **"This project is parameterized"**

**Common parameter types:**

- **Choice Parameter** (dropdown) — e.g., `ENV` with choices `QA / STG / DEV`
- **String Parameter** (free text) — e.g., `SUITE=smoke`
- **Boolean Parameter** (checkbox) — e.g., `RUN_SMOKE = true/false`
- **Credentials Parameter** — for secrets like API tokens (pulled from Jenkins Credentials Manager)

**Accessing parameters in Build Steps:**

- Windows batch: `%ENV%` → e.g., `npx playwright test --project=%ENV%`
- Linux shell: `$ENV` → e.g., `npx playwright test --project="$ENV"`

**Running the job:**

- After saving, the job page shows **"Build with Parameters"** instead of plain "Build Now"
- You select dropdown values / enter text before triggering

**Best practices to mention:**

- Use Choice for environment (avoids typos)
- Use Credentials type for secrets, never hardcode
- Print parameter values at the start of the build (helps debugging)
- Give default values and descriptions for each parameter

**How to answer in interview:**

"I enable parameters under General → 'This project is parameterized.' For environment selection I use a Choice parameter like ENV=QA/STG/DEV, so the same job can be reused across environments. In the build step, I access it as %ENV% on Windows or $ENV on Linux, and pass it to the test command like `npx playwright test --project=%ENV%`."
