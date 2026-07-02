
# Playwright CI/CD Workflow — Study Notes (playwright.yml)

> Reference file bana hai `playwright.yml` ke actual content pe based. Interview prep ke liye — simple language, real examples, apna file refer karte hue.

---

## Section A: Foundation — Workflow Anatomy

### 1. What is this workflow, in plain words

**Purpose kya hai?**

`playwright.yml` ek **GitHub Actions workflow file** hai jo repo ke `.github/workflows/` folder mein rehti hai. Iska simple sa kaam hai:

> "Jab bhi code change ho (push/PR) ya scheduled time aaye, automatically Playwright tests chala do, result nikaalo, aur team ko bata do — bina kisi manual intervention ke."

**Yeh repo mein kyun hai — 3 core reasons:**

1. **Automation** — Manually har baar terminal khol ke `npx playwright test` chalane ki zaroorat nahi. CI khud test run kar deta hai.
2. **Consistency** — Tumhare local machine pe test pass ho sakta hai lekin kisi aur ke machine pe fail ho sakta hai (different OS, node version, browser cache). CI ek **clean, identical environment** (`ubuntu-latest`) pe har baar test chalata hai — so results reliable hote hain.
3. **Early feedback + visibility** — Bugs ko production tak pahunchne se pehle hi pakad lete hain, aur poori team ko email + Actions tab ke through visibility milti hai ki kya pass/fail hua.

**Interview mein bolne layak line:**

> "Yeh ek CI workflow hai jo code push/PR/schedule pe automatically Playwright test suite run karta hai, JSON report parse karke pass/fail stats nikalta hai, artifacts upload karta hai, aur email se team ko notify karta hai — taaki manual testing effort kam ho aur fast feedback loop mile."

---

### 2. Trigger events explained

File mein 3 triggers defined hain:

```yaml
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  schedule:
    - cron: '30 0 * * *'
```

| Trigger                       | Kab fire hota hai                                                                              | Kyun rakha gaya                                                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`push`**            | Jab koi directly`main`/`master` branch pe code push karta hai (ya merge hota hai)          | Ensure karta hai ki main branch**hamesha stable** rahe — koi bhi commit jo directly gaya, uska test turant chal jaaye                                                                          |
| **`pull_request`**    | Jab koi PR`main`/`master` mein open ya update hota hai                                     | Yeh**gatekeeping** ke liye hai — merge hone se PEHLE hi pata chal jaaye ki naya code kuch tod raha hai ya nahi. Reviewer ko confidence milta hai                                               |
| **`schedule` (cron)** | Roz ek fixed time pe —`30 0 * * *` matlab UTC 00:30, jo IST mein **6:00 AM** hota hai | Yeh ek**health-check / nightly sanity** hai — bina kisi push ke bhi, agar external factor (API down, third-party dependency break, environment drift) se kuch toota hai, subah pata chal jaaye |

**Cron syntax quick recap (bahut common interview question):**

```
* * * * *
│ │ │ │ │
│ │ │ │ └── day of week (0-6, Sun=0)
│ │ │ └──── month (1-12)
│ │ └────── day of month (1-31)
│ └──────── hour (0-23)
└────────── minute (0-59)
```

`30 0 * * *` = minute 30, hour 0, har din, har month, har weekday → **daily 00:30 UTC**

⚠️ **Important gotcha:** GitHub Actions cron **hamesha UTC** mein hota hai. IST = UTC + 5:30, isliye 00:30 UTC = 6:00 AM IST. Yeh comment file mein already likha hai — interview mein yeh point zaroor mention karo, kyunki bahut log yeh confuse karte hain.

**Teen alag triggers kyun — ek hi kyun nahi?**
Kyunki teenon ka **purpose alag** hai:

- `push` → main branch protection
- `pull_request` → pre-merge gatekeeping
- `schedule` → time-based safety net (independent of any code change)

Agar sirf ek hi trigger hota, toh in teenon scenarios mein se kisi ek ka coverage miss ho jaata.

---

### 3. Job & steps breakdown

Poora workflow ek hi job `test` ke andar chal raha hai, `ubuntu-latest` runner pe, `60 min` timeout ke saath. Steps sequence mein chalte hain, upar se neeche:

```
1. Checkout code           →  actions/checkout@v4
2. Setup Node.js            →  actions/setup-node@v4
3. Install dependencies     →  npm install
4. Install Playwright browsers → npx playwright install --with-deps
5. Run Playwright tests     →  npm run conduit-sanity
6. Parse test results       →  jq se JSON report parse
7. Upload artifacts         →  playwright-report + test-results
8. Send email report        →  dawidd6/action-send-mail
```

**Har step ka role, simple words mein:**

1. **`actions/checkout@v4`** — Repo ke code ko runner (fresh Ubuntu VM) ke andar clone karta hai. Isके bina koi bhi command "no such file" bolegi kyunki runner khaali hota hai.
2. **`actions/setup-node@v4`** (`node-version: lts/*`) — Runner pe Node.js install karta hai. `lts/*` matlab jo bhi latest LTS version available hai wahi use hoga (auto-updates as LTS changes).
3. **Install dependencies (`npm install`)** — `package.json` se saari dependencies (Playwright library, reporters, etc.) install karta hai.
4. **Install Playwright Browsers (`npx playwright install --with-deps`)** — Chromium/Firefox/WebKit browsers download karta hai + `--with-deps` flag OS-level dependencies (fonts, libs) bhi install karta hai jo browsers ko headless Linux pe chalane ke liye chahiye.
5. **Run Playwright tests (`npm run conduit-sanity`)** — Yeh actual test execution step hai — ek custom npm script jo probably `playwright test` ko specific config/tag ke saath call karta hai (naam se lagta hai "conduit" project ka "sanity" suite).

   - `id: test-run` diya gaya hai taaki baad ke steps isse reference kar sakein (agar zaroorat pade).
6. **Parse test results** — `if: always()` ke saath chalta hai (matlab chahe test pass ho ya fail, yeh step chalega). `jsonReport.json` file se `jq` command ke through stats nikalta hai:

   - `total` = expected + unexpected + flaky + skipped
   - `passed` = expected + flaky
   - `failed` = unexpected
   - `skipped` = skipped

   Yeh values `$GITHUB_OUTPUT` mein likhi jaati hain taaki next steps (jaise email) mein use ho sakein.
7. **Upload artifacts** — Do separate artifacts upload hote hain:

   - `playwright-report` (HTML report folder)
   - `test-results` (raw results, screenshots, traces, videos of failures)
   - `if: ${{ !cancelled() }}` — matlab agar workflow manually cancel na ho, toh chahe pass ho ya fail, artifacts upload honge
   - `retention-days: 30` — 30 din tak GitHub pe stored rahenge, phir auto-delete
8. **Send email report** — `if: always()` (hamesha chalega, chahe kuch bhi ho) — `dawidd6/action-send-mail@v3` action use karke Gmail SMTP se ek HTML email bhejta hai jisme summary (total/pass/fail/skip), repo/branch/commit info, aur workflow run ka link hota hai.

**Visual flow:**

```
Trigger (push/PR/cron)
     │
     ▼
Checkout → Setup Node → npm install → Install Browsers
     │
     ▼
Run Tests (npm run conduit-sanity)
     │
     ▼
   [always runs next, pass ya fail chahe kuch bhi ho]
     │
     ▼
Parse JSON Report (jq) → Upload Artifacts → Send Email
```

---

### 4. Naming standards & structure conventions

File mein jo naming/structure patterns use hue hain, unka logic:

| Element                  | Example from file                                                                                                         | Kyun important hai                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Job name**       | `test`                                                                                                                  | Short, clear, purpose-indicating. Actions tab pe yehi naam dikhta hai jobs list mein                                                                                                                        |
| **Step `name:`** | `"Install Playwright Browsers"`, `"Send email report"`                                                                | Human-readable — Actions tab ke UI mein yehi label dikhta hai. Agar naming vague ho (`"step1"`, `"step2"`) toh logs padhna mushkil ho jaata hai, especially failure debug karte waqt                   |
| **Step `id:`**   | `id: test-run`, `id: test-stats`                                                                                      | Sirf tab zaroori hai jab us step ke**output ko baad mein reference karna ho** (e.g., `steps.test-stats.outputs.total`). Har step ko id dene ki zaroorat nahi — sirf unko jinka output chahiye hoga |
| **Comment blocks** | `# ----` separators with section labels (`TEST EXECUTION`, `RESULT PARSING`, `ARTIFACTS`, `EMAIL NOTIFICATION`) | Long YAML files mein visual sectioning se readability badhti hai — koi bhi naya dev file kholte hi samajh jaata hai kaunsa block kya kar raha hai                                                          |

**Naming convention best practices (general standard, interview mein bolne layak):**

- Step names verb-first aur descriptive ho: `"Run Playwright tests"` not `"Test"`
- `id` sirf tab do jab actual cross-reference chahiye — unnecessary `id`s clutter badhate hain
- Job names lowercase, hyphen/underscore se separated, kaam ka short summary
- Consistent naming se **debugging fast hoti hai** — jab CI fail ho aur 50 steps ka log ho, clear names se turant pata chal jaata hai kaunsa step culprit hai

**Interview-ready summary line:**

> "Naming conventions is workflow mein readability aur maintainability ke liye follow ki gayi hain — descriptive step names Actions UI mein directly dikhte hain jisse debugging fast hoti hai, aur `id` sirf un steps ko diya gaya hai jinka output downstream steps mein consume karna hai, jaise test stats email step mein use hote hain."

---

## Section B: Execution Mechanics

### 5. How it runs under the Actions tab

Jab bhi ek trigger fire hota hai (push/PR/cron), GitHub automatically ek **"workflow run"** create karta hai jo repo ke **Actions** tab mein dikhta hai.

**Kya dikhta hai wahan:**

1. **Run list** — Har run ek row hoti hai, jisme: workflow name, trigger event (push/pull_request/schedule), branch, commit message, status icon (🟡 running / ✅ success / ❌ failed), aur duration.
2. **Run details page** (kisi bhi run pe click karke) —

   - **Job list** (yahan sirf ek job hai: `test`) — click karke andar jao
   - **Step-by-step logs** — har step expand/collapse ho sakta hai, timestamp ke saath. Yehi wahi step names hain jo `name:` field mein diye the.
   - **Live logs** — agar run abhi chal raha hai, real-time output stream hota hai
3. **Artifacts section** — run page ke bottom mein, wahan `playwright-report` aur `test-results` download karne ke liye milte hain.
4. **Re-run option** — top-right corner mein "Re-run all jobs" ya "Re-run failed jobs" button hota hai — agar flaky failure lage toh bina naya commit kiye dubara chala sakte ho.

**How to read a failed run (interview-important skill):**

1. Failed run pe click karo → red ❌ wale step pe seedha jump karo (GitHub auto-highlights failed step)
2. Us step ka log expand karo — error message, stack trace dikhega
3. Agar test-level failure hai (`Run Playwright tests` step fail hua), toh **artifacts download karo** — `test-results` mein screenshots/traces/videos hote hain jo exact failure point dikhate hain
4. Agar infra-level failure hai (e.g., `npm install` fail hua — network issue, missing package), toh log directly root cause bata deta hai

**Interview line:**

> "Har push/PR/schedule trigger pe Actions tab mein ek naya workflow run create hota hai jisme step-wise logs milte hain. Failure debug karne ke liye main pehle failed step ka log dekhta hoon, phir agar test-level issue hai toh uploaded artifacts (screenshots/traces) download karke root cause analyze karta hoon."

---

### 6. How to trigger manually

**Current file mein GAP hai** — ismein `workflow_dispatch` trigger **defined nahi hai**. Isका matlab abhi is workflow ko Actions tab se manually trigger nahi kar sakte — sirf push/PR/cron se hi chalega.

**`workflow_dispatch` kya hota hai:**
Yeh ek special trigger hai jo Actions tab mein ek **"Run workflow"** button add kar deta hai, jisse koi bhi (with permission) workflow ko **on-demand, kabhi bhi** chala sakta hai — bina push ya PR kiye.

**Add karne ka syntax (gap fill karne ke liye):**

```yaml
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  schedule:
    - cron: '30 0 * * *'
  workflow_dispatch:        # <-- yeh add karna hoga
    inputs:
      environment:
        description: 'Environment to test against'
        required: false
        default: 'staging'
```

Iske baad Actions tab → workflow select karo → right side "Run workflow" dropdown dikhega, jahan se branch choose karke aur (agar inputs diye hain) parameters fill karke manually trigger kar sakte ho.

**Manual trigger ka use case:**

- Kisi specific branch pe ad-hoc test chalana bina push kiye
- Debugging ke waqt dobara test run karna (retry se alag — fresh run)
- On-demand regression run before a release, bina wait kiye scheduled cron ka
- QA/Dev team member ko bina code change ke test chalana ho toh

**Interview line:**

> "Abhi is workflow mein `workflow_dispatch` trigger missing hai, jo ek gap hai — agar add karte toh Actions tab se manually, on-demand workflow trigger kar sakte, jo specially release-before checks ya ad-hoc debugging ke liye useful hota hai."

---

### 7. Caching problem & solution

**Problem:**
Har workflow run pe do heavy steps hote hain jo **fresh se, har baar** chalte hain:

```yaml
- name: Install dependencies
  run: npm install
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
```

Iska matlab: har single push/PR/cron run pe — chahe `package.json` mein kuch change hi na hua ho — poori `node_modules` folder aur saare browser binaries (Chromium/Firefox/WebKit, jo GBs mein ho sakte hain) **naye sirey se download** hote hain. Isse:

- **Run time badhta hai** (npm install + browser download mein easily 2-5 min extra)
- **Bandwidth/cost waste** hota hai
- CI slow feel hoti hai, especially jab frequently push/PR trigger ho rahe ho

**Solution 1: `actions/setup-node` ka built-in cache**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: lts/*
    cache: 'npm'
```

Bas ek line `cache: 'npm'` add karne se, GitHub Actions `~/.npm` cache directory ko `package-lock.json` ke hash se key karke automatically cache/restore karta hai. Agar lockfile same hai (dependencies unchanged), `npm install` bahut fast ho jaata hai kyunki packages cache se aate hain, dobara internet se download nahi hote.

**Solution 2: Explicit `actions/cache` for Playwright browsers**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

- name: Install Playwright Browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

Yahan trick yeh hai: browsers `~/.cache/ms-playwright` mein install hote hain. Hum us path ko cache karte hain, key `package-lock.json` ke hash se bandhte hain (taaki jab Playwright version change ho, cache automatically invalidate ho jaaye), aur **install step ko conditionally skip** karte hain agar cache already hit ho gaya.

**Cost/time tradeoff (interview mein zaroor bolna):**

- ✅ Pro: Significantly faster runs (especially browser install jo sabse zyada time leta hai)
- ✅ Pro: Kam bandwidth usage, GitHub Actions minutes save hote hain (agar private repo hai toh billing bhi kam)
- ⚠️ Con: Cache **stale ho sakta hai** agar key sahi se invalidate na ho — isliye hashFiles(lockfile) use karna important hai
- ⚠️ Con: Cache ka apna storage limit hota hai (GitHub per-repo ~10GB), purane caches auto-evict hote hain
- ⚠️ Con: First run (cache miss) pe koi speed benefit nahi milta — sirf subsequent runs fast hote hain

**Interview-ready summary:**

> "Abhi workflow mein caching implement nahi hai, isliye har run pe `npm install` aur Playwright browser install dobara se hote hain jo time aur bandwidth waste karta hai. Fix ke liye `actions/setup-node` ke built-in `cache: 'npm'` option aur `actions/cache` action (Playwright browsers ke liye, `package-lock.json` hash-based key ke saath) use kar sakte hain — isse repeat runs mein install step significantly fast ho jaata hai, bas cache key ko lockfile se tie karna zaroori hai taaki version change pe stale cache use na ho."

---

## Quick Recap Table (Section A + B)

| # | Topic                 | One-line takeaway                                                                                   |
| - | --------------------- | --------------------------------------------------------------------------------------------------- |
| 1 | What is this workflow | Automated CI runner for Playwright tests — push/PR/cron pe trigger hota hai                        |
| 2 | Triggers              | push (main protection), PR (gatekeeping), cron (nightly safety net)                                 |
| 3 | Steps                 | checkout → setup-node → install deps → install browsers → run tests → parse → upload → email |
| 4 | Naming                | Descriptive names for readability,`id` only where output is reused                                |
| 5 | Actions tab           | Run list → step logs → artifacts → re-run option                                                 |
| 6 | Manual trigger        | `workflow_dispatch` missing — gap to fix for on-demand runs                                      |
| 7 | Caching               | No cache currently — add`cache: 'npm'` + `actions/cache` for Playwright browsers               |

---

## Section C: Reporting & Notifications

### 8. JSON report parsing logic

Playwright, jab `jsonReport` reporter configured ho (playwright.config mein), test run ke baad ek `jsonReport.json` file generate karta hai jisme **poore run ka structured summary** hota hai — kitne test chale, kitne pass/fail/skip hue, timing, errors, sab kuch machine-readable JSON format mein.

Workflow ka yeh step us file ko parse karta hai:

```yaml
REPORT_FILE="test-results/jsonReport.json"

TOTAL=$(jq '.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped' $REPORT_FILE)
PASSED=$(jq '.stats.expected + .stats.flaky' $REPORT_FILE)
FAILED=$(jq '.stats.unexpected' $REPORT_FILE)
SKIPPED=$(jq '.stats.skipped' $REPORT_FILE)
```

**`jq` kya hai:** Command-line JSON processor — bash mein directly JSON fields ko query/extract karne ke liye. `jq '.stats.expected'` matlab JSON object ke andar `stats` key ke andar `expected` field ka value nikalo.

**Yeh 4 numbers ka matlab (Playwright ki terminology, interview mein confuse mat hona):**

| Term                     | Matlab                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`expected`**   | Test**pass hua jaisa expect tha** — normal green pass. (e.g. test likha tha pass hone ke liye, aur pass hua)                                                                                 |
| **`unexpected`** | Test**fail hua jabki pass hona expect tha** — yeh actual **failure** hai. Isi ko humne `FAILED` bola                                                                                 |
| **`flaky`**      | Test pehle fail hua, phir Playwright ke built-in**retry mechanism** (`retries` config) ki wajah se **re-run pe pass** ho gaya. Flaky ka matlab hai "unreliable but eventually passed" |
| **`skipped`**    | Test**intentionally skip** kiya gaya — `test.skip()` ya conditional skip logic ki wajah se, chala hi nahi                                                                                  |

**Kyun `PASSED = expected + flaky`?**
Kyunki flaky test **end mein pass** hua (retry ke baad), toh usse bhi "passed" ki category mein count karna business-sense rakhta hai — lekin alag se track bhi kiya jaata hai kyunki flaky tests ek **quality red flag** hote hain (retry pe pass hona instability signal hai).

**Kyun `TOTAL` mein sab 4 add ho rahe hain?**
Kyunki `expected`, `unexpected`, `flaky`, `skipped` — yeh 4 hi mutually exclusive categories hain jisme har test fall karta hai. Sabko add karke total test count milta hai.

**Interview trap question:** *"flaky aur passed mein kya difference hai?"*

> "Flaky bhi ultimately pass hi hota hai, lekin usne pehle fail karke phir retry pe pass kiya — jo indicate karta hai test ya application mein instability hai (timing issue, race condition, environment flakiness). Isliye humesha `flaky` count ko monitor karna chahiye, chahe woh 'passed' bucket mein aata ho."

**`$GITHUB_OUTPUT` ka role:**

```bash
echo "total=$TOTAL" >> $GITHUB_OUTPUT
```

Yeh special file hai jisme koi bhi step apna output likh sakta hai, jo phir **next steps mein** `steps.test-stats.outputs.total` jaise syntax se accessible ho jaata hai — email step isी ka use karta hai.

---

### 9. Email notification flow

**Trigger condition:**

```yaml
- name: Send email report
  if: always()
```

`if: always()` ka matlab hai yeh step **hamesha chalega** — chahe pehle ke steps pass hue ho ya fail. Normally agar koi step fail ho jaaye, GitHub Actions **baaki saare steps skip** kar deta hai (default behavior). `always()` isko override karta hai.

**Yeh kyun zaroori hai:** Agar tests fail hue, tabhi toh sabse zyada zaroori hai ki team ko **turant pata chale** — agar email bhi skip ho jaaye failure ki wajah se, toh purpose hi fail ho gaya. Isliye email step ko `always()` diya gaya hai.

**Email mein kya data jaata hai (do parts):**

**Part 1 — Test Summary (dynamic, `test-stats` output se):**

- Total Tests
- Passed (green highlight)
- Failed (red highlight)
- Skipped (grey highlight)
- Job status (`success`/`failure`) — color-coded (`#28a745` green ya `#dc3545` red) using GitHub Actions expression: `${{ job.status == 'success' && '#28a745' || '#dc3545' }}`

**Part 2 — Run Metadata (GitHub context variables se):**

- Repository name (`github.repository`) — with clickable link
- Branch (`github.ref_name`)
- Commit SHA (`github.sha`) — with clickable link to commit
- Triggered by (`github.actor`) — kisne push/PR kiya
- Workflow Run link (`github.run_id`) — direct link to full Actions run page

**Kya email mein NAHI jaata:**

- Detailed test-by-test breakdown (kaunsa specific test fail hua, kyun)
- Screenshots, videos, traces
- Full logs

Yeh sab sirf **artifact download karke** milta hai — email sirf ek **quick-glance summary + link** hai, taaki receiver ko decide karne mein help mile ki deeper investigation chahiye ya nahi.

**Mail setup mechanics:**

```yaml
uses: dawidd6/action-send-mail@v3
with:
  server_address: smtp.gmail.com
  server_port: 465
  username: princepandey155@gmail.com
  password: ${{ secrets.GMAIL_APP_PASSWORD }}
```

- Gmail SMTP use ho raha hai (port 465 = SSL)
- Password kabhi bhi plaintext mein nahi — `${{ secrets.GMAIL_APP_PASSWORD }}` GitHub repo ke **encrypted Secrets** se aata hai (Settings → Secrets and variables → Actions)
- Yeh **Gmail App Password** hai, normal Gmail password nahi (Google 2FA accounts ke liye alag app-specific password generate karwata hai)

**Interview line:**

> "Email step `if: always()` ke saath configured hai taaki test pass ho ya fail, notification zaroor jaaye — especially failure case mein yeh critical hai. Email mein sirf high-level summary (total/pass/fail/skip counts) aur run metadata jaata hai, saath mein Actions run ka direct link — detailed debugging ke liye artifacts download karne padte hain, jo email mein attach nahi hote (size/security reasons se)."

---

### 10. Artifacts & retention

```yaml
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30

- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: test-results
    path: test-results/
    retention-days: 30
```

**Do separate artifacts kyun, ek kyun nahi:**

| Artifact                        | Contains                                                                                                                                                | Use case                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`playwright-report`** | Playwright ka**HTML report** — visual, interactive, browser mein khol ke dekh sakte ho. Har test ka status, duration, steps, screenshots inline  | **Human-friendly** review — QA/dev isko download karke browser mein khol ke poora run visually explore karta hai, jaise ek dashboard                                   |
| **`test-results`**      | **Raw output** — failure screenshots, videos, trace files (`.zip` traces jo Playwright Trace Viewer mein khulte hain), aur `jsonReport.json` | **Deep debugging** — trace viewer se exact step-by-step replay dekh sakte ho ki test kahan aur kyun fail hua (DOM snapshots, network calls, console logs sab included) |

Alag rakhne ka fayda: agar sirf **quick visual check** karna hai toh `playwright-report` hi download karo (halka, fast). Agar **root-cause debugging** chahiye kisi specific failure ka, toh `test-results` mein jaake trace file kholo.

**`if: ${{ !cancelled() }}` ka matlab:**

- Agar workflow **manually cancel** kiya gaya (kisi ne beech mein rok diya), toh artifacts upload **skip** honge — kyunki incomplete/garbage data hoga
- Lekin agar tests **pass ya fail** hue (cancel nahi hue), artifacts **hamesha** upload honge — chahe result kuch bhi ho

**`retention-days: 30` ka matlab:**
GitHub 30 din tak yeh artifacts apne storage mein rakhega, uske baad **automatically delete** kar dega (storage cost control ke liye). Agar kisi purane run ka data chahiye 30 din baad, toh woh accessible nahi hoga — isliye important findings ko waqt pe download/document karna zaroori hai.

**Artifact vs Email — core difference (interview classic):**

|                     | **Email**                              | **Artifact**                                        |
| ------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Kya milta hai       | High-level summary numbers + metadata + link | Full raw data — HTML report, screenshots, videos, traces |
| Kab access hota hai | Turant inbox mein, push notification jaisa   | Manually Actions tab pe jaake download karna padta hai    |
| Retention           | Permanent (jab tak email delete na karo)     | Sirf 30 din, phir auto-delete                             |
| Use case            | "Kya pass hua ya fail?" — quick awareness   | "Kyun fail hua?" — deep investigation                    |
| Size                | Halka (KB)                                   | Heavy (MBs, especially videos/traces)                     |

**Interview-ready summary:**

> "Email sirf ek **notification layer** hai — turant pata chalta hai pass/fail hua ya nahi, bina Actions tab khole. Artifacts **investigation layer** hain — jab fail hone ka reason dhoondna ho, tab `playwright-report` (visual overview) ya `test-results` (raw traces/screenshots/videos) download karte hain. 30-day retention isliye hai kyunki GitHub storage free nahi hota infinitely — long-term important results ko separately archive karna chahiye agar zaroorat ho."

---

## Section D: Strategy & Real-World Usage

### 11. Multiple workflows strategy

**Question:** Sanity, regression, aur nightly — inke liye **ek hi file mein multiple triggers** rakhein, ya **alag-alag `.yml` files**?

**Answer: Alag files better hain**, aur yahan detailed reasoning hai:

**Approach 1 — Single file, multiple triggers (NOT recommended for this case):**

```yaml
on:
  push: ...
  pull_request: ...
  schedule:
    - cron: '...'  # sanity
    - cron: '...'  # regression
    - cron: '...'  # nightly
```

Problem: Sabka **same job/steps** chalega — lekin sanity, regression, aur nightly runs mein actually **different needs** hoti hain (different test tags, different browsers, different timeout, alag notification recipients). Single file mein yeh sab conditionally likhna (`if` checks har jagah) file ko **complex aur unreadable** bana deta hai.

**Approach 2 — Separate files per purpose (RECOMMENDED):**

```
.github/workflows/
  ├── sanity.yml       (fast, every push/PR)
  ├── regression.yml   (full suite, scheduled/manual)
  └── nightly.yml      (cron, off-hours full run)
```

**Pros of separate files:**

- ✅ **Clarity** — har file ka ek hi clear purpose hai, naam se hi pata chal jaata hai
- ✅ **Independent configuration** — alag timeout, alag test command (`npm run sanity` vs `npm run regression`), alag email recipients possible
- ✅ **Independent triggers** — sanity `push`/`PR` pe, regression sirf `schedule`/manual pe — bina ek dusre ko affect kiye
- ✅ **Parallel execution** — agar dono trigger ho jaayein same time pe, dono independently, parallel chal sakte hain (Actions tab mein alag-alag dikhte hain)
- ✅ **Selective re-run** — sirf nightly fail hua? Sirf usko re-run karo, sanity ko touch nahi karna padta
- ✅ **Easier maintenance** — kisi ek workflow mein change karna hai (jaise sirf regression ka browser list badalna) toh baaki files untouched rehte hain

**Cons of separate files:**

- ⚠️ Thoda **duplication** hota hai (checkout, setup-node, install steps har file mein repeat) — lekin isko **reusable workflows** (`workflow_call`) ya **composite actions** se solve kar sakte hain
- ⚠️ Zyada files manage karne padte hain — but yeh minor hai compared to benefits

**Interview line:**

> "Main separate `.yml` files prefer karta hoon har purpose (sanity/regression/nightly) ke liye, kyunki inki needs alag hoti hain — different triggers, different test scope, different timing. Single file mein sab kuch conditionally likhna maintainability kharab kar deta hai. Duplication ka concern reusable workflows ya composite actions se address ho sakta hai."

---

### 12. Your CI strategy design

Yahan ek **clear, interview-ready strategy** design kar rahe hain teen workflows ke liye:

**Workflow 1: `sanity.yml` — Fast feedback**

- **Trigger:** `push` (main/master) + `pull_request` (main/master)
- **Scope:** Chhota, critical-path test subset — login, core flows — jo **5-10 min** mein chal jaaye
- **Purpose:** Har commit/PR pe turant confidence — "kya main change ne kuch basic tod diya?"
- **Timeout:** Short (e.g., 15-20 min)

**Workflow 2: `regression.yml` — Full coverage**

- **Trigger:** `schedule` (e.g., weekly, ya har major branch merge ke baad) + `workflow_dispatch` (manual, before releases)
- **Scope:** Poora test suite — saare modules, edge cases, cross-browser
- **Purpose:** Release se pehle ya periodically **deep confidence** — koi bhi regression pakadna jo sanity ne miss kiya
- **Timeout:** Longer (60 min, jaisa current file mein hai)

**Workflow 3: `nightly.yml` — Off-hours health check**

- **Trigger:** `schedule` (daily cron, off-peak hours — jaisa current file 6 AM IST karta hai)
- **Scope:** Full ya near-full suite, including **environment-sensitive** tests (third-party integrations, external API dependency checks)
- **Purpose:** Bina kisi push ke bhi, agar external factor (API change, cert expiry, env drift) se kuch tootа hai, subah team ko pata chal jaaye — pehle kisi customer ke complain karne se
- **Timeout:** Longer, since full suite

**Trigger mapping summary table:**

| Workflow   | On every push? | On PR?                           | On schedule?       | Manual (`workflow_dispatch`)? |
| ---------- | -------------- | -------------------------------- | ------------------ | ------------------------------- |
| Sanity     | ✅ Yes         | ✅ Yes                           | ❌ No              | ✅ Optional (debugging)         |
| Regression | ❌ No          | ❌ No (unless release-branch PR) | ✅ Weekly/periodic | ✅ Yes (before releases)        |
| Nightly    | ❌ No          | ❌ No                            | ✅ Daily           | ✅ Optional                     |

**Kyun yeh design sahi hai (reasoning for interview):**

- Har push/PR pe **poora regression suite** chalana **wasteful aur slow** hoga — developer productivity kam ho jaayegi (PR merge mein delay)
- Isliye sirf **fast sanity** har push/PR pe, aur **heavy regression** ko schedule/manual pe daal diya — yeh **shift-left + resource-efficient** balance hai
- Nightly alag isliye hai kyunki uska purpose **time-based drift detection** hai, code-change-based nahi

**Interview line:**

> "Meri strategy mein sanity workflow har push aur PR pe chalta hai kyunki woh fast hai aur turant feedback deta hai. Regression sirf schedule ya manual trigger pe chalta hai kyunki woh heavy hai aur har commit pe chalana developer velocity ko slow kar dega. Nightly ek independent daily health-check hai jo code change se decoupled hai — external factors ki wajah se hone waale breakages catch karne ke liye."

---

### 13. How dev team leverages this workflow in their CI

**1. PR Gatekeeping:**
Jab koi developer PR banata hai, `pull_request` trigger automatically sanity tests chala deta hai. Reviewer ko PR page pe hi **green ✅ / red ❌ check** dikh jaata hai (GitHub status checks). Agar failing hai, reviewer merge se pehle developer ko fix karne bolta hai — **broken code main branch mein jaane se pehle hi ruk jaata hai**.

Isse aage, repo mein **branch protection rule** set kiya jaa sakta hai: "Is check ke pass hue bina merge allowed hi nahi" — isse gatekeeping enforce ho jaati hai, sirf suggestion nahi rehti.

**2. Fast Feedback Loop:**
Developer ko apne local machine pe poora suite chalane ki zaroorat nahi — push karte hi CI khud test kar deta hai, aur email/PR check ke through **minutes mein** pata chal jaata hai kuch tootа toh nahi. Isse context-switching kam hoti hai — developer turant apne hi change pe wapas focus kar sakta hai jab tak result aaye.

**3. Nightly Health-check ka purpose:**
Din ke andar developers zyada tar apna hi feature area touch karte hain, poore system ka coverage nahi milta har push pe. Nightly run **poore application ka full-suite check** karta hai, independent of any specific developer's change — isse **cross-module regressions ya environment drift** (jaise ek third-party API silently break ho gaya) subah hi pakde jaate hain, na ki jab koi customer complain kare.

**4. Artifact-based debugging workflow for devs:**
Jab koi test fail hota hai CI mein (jo developer ke local mein reproduce na ho — flaky/env-specific issue), toh:

1. Developer email/PR check se pata karta hai failure hua
2. Actions tab pe jaake `test-results` artifact download karta hai
3. Trace file (`.zip`) ko Playwright Trace Viewer mein khol ke **exact failure moment** dekhta hai — DOM state, network calls, console logs, screenshots, sab kuch
4. Isse **"works on my machine"** problem solve hoti hai — CI ka exact context reproduce ho jaata hai bina us environment ko manually replicate kiye

**Interview line:**

> "Dev team is workflow ko primarily do tareeke se use karti hai — PR gatekeeping ke through, jahan branch protection rules ensure karte hain ki failing sanity check ke saath koi merge na ho, aur artifact-based debugging ke through, jahan trace files download karke exact CI failure ko locally replicate kiye bina reason samjha jaa sakta hai. Nightly run ek safety net hai jo code-change-independent issues catch karta hai."

---

## Section E: Interview Prep Wrap-up

### 14. Common interview Q&A

**Q1: Cron UTC mein kyun hota hai, aur IST se kaise convert karte ho?**

> A: GitHub Actions cron scheduler hamesha **UTC timezone** use karta hai, chahe repo/team kahin bhi ho — yeh consistency ke liye hai across globally distributed teams. IST = UTC + 5:30, isliye agar 6 AM IST pe chalana hai, cron expression `30 0 * * *` (00:30 UTC) hoga. Convert karte waqt hamesha subtract 5:30 karo IST se UTC nikalne ke liye.

**Q2: `if: always()` kyun use kiya, normal behavior kya hota agar na dete?**

> A: Default behavior mein, agar koi step fail ho jaaye, GitHub Actions **baaki saare subsequent steps skip** kar deta hai. Lekin humein result parsing aur email notification **hamesha** chahiye — chahe test pass ho ya fail (especially fail case mein hi toh sabse zyada zaroorat hai batane ki). `if: always()` is default-skip behavior ko override karta hai.

**Q3: `playwright-report` aur `test-results` — do alag artifacts kyun upload kiye, ek kyun nahi?**

> A: Dono ka **different purpose** hai — `playwright-report` ek human-friendly HTML dashboard hai quick visual review ke liye, jabki `test-results` mein raw debugging data (traces, screenshots, videos, JSON) hota hai deep root-cause analysis ke liye. Alag rakhne se jisko jo chahiye woh selectively download kar sakta hai, bina heavy unnecessary data ke saath.

**Q4: Scaling issues — jaise-jaise test suite badhega, is workflow mein kya problems aa sakti hain?**

> A: Kuch potential issues:
>
> - **Run time badhega** — bina caching ke, `npm install` + browser install ka overhead fixed hai, lekin actual test execution time suite size ke saath linearly badhega. Solution: **test sharding** (`--shard` flag, multiple parallel jobs)
> - **Single job bottleneck** — abhi sab kuch ek hi `test` job mein sequential chal raha hai. Solution: **matrix strategy** se multiple browsers/shards ko parallel jobs mein split karna
> - **60-min timeout** — agar suite itna bada ho jaaye ki 60 min cross ho jaaye, workflow forcefully fail ho jaayega. Timeout ko badhana padega ya sharding se speed up karna padega
> - **Artifact storage** — bade suites mein zyada screenshots/videos generate honge, 30-day retention ke andar bhi storage cost badh sakta hai
> - **Flaky test accumulation** — jitna bada suite, utne zyada flaky tests risk — CI reliability pe asar padta hai, retry strategy tune karni padegi

**Q5: `--with-deps` flag kyun use kiya browser install mein?**

> A: `npx playwright install --with-deps` sirf browser binaries hi nahi, balki unke liye zaroori **OS-level system dependencies** (fonts, shared libraries jaise libgtk, libnss, etc.) bhi install karta hai jo headless Linux runner (`ubuntu-latest`) pe browsers ko properly run karne ke liye chahiye hote hain. Bina isके, browser launch fail ho sakta hai missing-library errors ke saath.

**Q6: Agar tumhe is workflow mein ek sabse bada improvement karna ho, kya karoge?**

> A (apna strategic answer, confidently bolna): "Sabse pehle **caching add karoonga** (`npm` cache + Playwright browser cache) kyunki woh sabse zyada time bachaata hai har run mein. Dusra, **`workflow_dispatch`** add karoonga manual trigger ke liye. Teesra, agar suite bada hai, **sharding/matrix strategy** consider karoonga parallel execution ke liye speed ke liye."

---

## Quick Recap Table (Section C, D, E)

| #  | Topic                 | One-line takeaway                                                      |
| -- | --------------------- | ---------------------------------------------------------------------- |
| 8  | JSON report parsing   | `jq` se stats nikalte hain; expected+flaky=passed, unexpected=failed |
| 9  | Email flow            | `if: always()` — summary + metadata jaata hai, detailed data nahi   |
| 10 | Artifacts & retention | Report=visual, results=raw debug data; 30-day auto-delete              |
| 11 | Multiple workflows    | Separate files per purpose — clarity + independent config             |
| 12 | CI strategy           | Sanity=every push/PR, regression=schedule/manual, nightly=daily cron   |
| 13 | Dev team usage        | PR gatekeeping + fast feedback + artifact-based debugging              |
| 14 | Interview Q&A         | UTC cron, always(), artifact split, scaling, --with-deps, improvements |

---

*Poora reference ready hai — Sections A se E tak. Ab practice ke liye: khud se bina file dekhe har topic ko 2-3 lines mein bolne ki koshish karo, phir yahan check karo.*
