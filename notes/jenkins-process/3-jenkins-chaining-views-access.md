## Topic 14: Job Chaining / MasterJob Concept

**The core idea**
In real SDLC pipelines, jobs rarely run in isolation. Typically: **Build → Test → Deploy**, where each stage only proceeds if the previous one succeeded.

- The job that runs first = **upstream job**
- The job(s) that run after = **downstream job(s)**
- If an upstream job fails, downstream jobs don't trigger — this saves time and avoids testing/deploying broken code.

### MasterJob

A MasterJob is essentially a **collection of smaller jobs**, run in sequence, to complete one larger E2E flow.

**Example — Telecom E2E flow:**

1. `Suite-CreateLeadAndOpportunity` (job1)
2. `Suite-AddConfigurationAndSendForApproval` (job2)
3. `Suite-ApprovalAndProvision` (job3)
4. `Suite-PaymentProcess` (job4)

The MasterJob triggers these sequentially. If job1 fails, the MasterJob **aborts** the remaining steps — job2, job3, job4 never run.

**Another example (generic E2E):**

- Job1: create customer and buy product
- Job2: validate product in a different app
- Job3: validate DB data

Each job only runs if the previous one passed.

### How to configure this in Jenkins

- Post-build Actions → **"Build other projects"** — when you start typing, Jenkins auto-suggests existing job names
- You configure: *"Trigger only if build is stable"* — this ensures downstream jobs don't fire if the current job fails
- Each job can also be configured with "what previous job must pass" as its trigger condition

**Why this matters for SDET work:**

- Long E2E flows are broken into smaller, focused, independently-runnable suites (easier debugging — you know exactly which module failed)
- Saves execution time — no point running Payment validation if Lead creation already failed
- Each suite job can also be run standalone for targeted testing

**How to answer in interview:**
"We use a MasterJob pattern for E2E flows — for example, in a telecom project, I broke the flow into sequential jobs: Create Lead, Add Configuration & Approval, Provisioning, and Payment. The MasterJob chains them using 'Build other projects' with 'trigger only if stable,' so if the Lead creation job fails, the pipeline aborts and doesn't waste time running downstream steps. This also makes debugging easier since each suite is isolated and independently runnable."

---

## Topic 15: Views in Jenkins

**What is a View?**
A View is simply a way to **organize and group jobs** on the Jenkins dashboard — useful once you have many jobs (10, 50, 100+) and don't want to scroll through everything.

**Example groupings:**

- One view for Regression Jobs
- One view for Release Jobs
- One view per project/team (common in shared/enterprise Jenkins instances)

**Enterprise reality:**
Often a single Jenkins instance is shared across multiple projects/teams. Each team creates its **own View** and only builds/organizes their jobs within it — keeping things clean without touching other teams' jobs.

### How to create a View

1. Login to Jenkins Dashboard
2. Click **"+"** (New View) on the left sidebar / top of job list
3. Enter a View Name (e.g., "Regression View", "Smoke View", "Release Jobs")
4. Choose View Type — most commonly **"List View"** (shows jobs in a simple list); other options like "My View" or "Dashboard View" exist if plugins are installed
5. Select jobs to include — either manually tick checkboxes, or use a **regex/job filter** to auto-include jobs (e.g., all jobs starting with `Smoke-*`)
6. Click **OK / Apply** to save

Once saved, the View appears as a new tab at the top of the Jenkins dashboard.

**How to answer in interview:**
"A View is just a way to organize jobs on the dashboard — as an SDET lead, I'd create Views like 'Regression' or 'Smoke' so the team isn't lost when Jenkins has 100+ jobs across projects. In our case, since Jenkins is shared across multiple projects, we created our own team-specific View and only manage our jobs there, either by manually selecting them or using a regex filter like `Smoke-*` to auto-include matching jobs."

---

## Topic 16: Access Management (Who Can Trigger/View Jobs)

This is asked but usually thin in most SDET's notes — here's the level of detail expected from you (not admin-level, but "aware of it" level).

**Where it's configured:** Manage Jenkins → **Manage Users** (create/manage accounts) and **Configure Global Security** / **Manage and Assign Roles** (if Role-based plugin is installed)

### Common access control approaches

**1. Matrix-based security (built-in)**

- Manage Jenkins → Configure Global Security → enable "Matrix-based security" (or Project-based Matrix Authorization)
- You get a grid: users/groups on one side, permissions (Read, Build, Configure, Delete, Administer) on the other
- You tick which permission each user/group has — globally or per-job

**2. Role-based Authorization Strategy (plugin — more common in enterprises)**

- Install "Role-based Authorization Strategy" plugin
- Manage Jenkins → Manage and Assign Roles
- Define **roles** (e.g., `qa-lead`, `qa-engineer`, `viewer`) with specific permissions
- Assign users to roles
- Roles can be scoped globally or to specific job patterns (e.g., a role that only has access to jobs matching `Smoke-*`)

**3. Folder-level permissions**

- If jobs are organized into folders (common in larger orgs), permissions can be set per folder — so a team only sees/manages jobs within their own folder

### Typical permission levels

- **Read** — can view the job/build results
- **Build** — can trigger builds
- **Configure** — can edit job settings
- **Administer** — full control (usually reserved for leads/DevOps)

**Enterprise reality (how it usually works for you as an SDET):**

- Jenkins access is centrally managed — you request access from the DevOps/Platform team or your lead
- You're typically given **Build + Read** access to your team's jobs/View, and maybe **Configure** if you're senior/lead
- Admin-level access (creating users, managing global security) is restricted to DevOps/platform admins

**How to answer in interview:**
"Access in Jenkins is usually managed via Role-based Authorization Strategy or Matrix-based security. As a lead, I'd request the DevOps team to set up a role — say `qa-engineer` — with Read and Build permissions scoped to our team's jobs or View, so members can trigger and view results without being able to modify global Jenkins settings. Full admin access stays with the DevOps/Platform team. In practice, most companies pre-configure this, and we just request access to specific jobs or folders."
