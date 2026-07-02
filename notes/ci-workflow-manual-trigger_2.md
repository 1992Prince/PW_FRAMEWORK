
# Manual Trigger (`workflow_dispatch`) — Deep Dive

> Follow-up notes based on actual screenshots after adding `workflow_dispatch` to `playwright.yml`. Covers: naming source, commit resolution, environment input confusion, local-docker vs CI strategy, aur specific test run karne ka tareeka.

---

## 1. "Playwright Tests" naam kahan se aa raha hai — framework se ya commit se?

**Na framework se, na commit se — yeh workflow file ke andar `name:` field se aata hai.**

Tumhari file ke top pe yeh line hai:

```yaml
name: Playwright Tests
```

Yeh **workflow-level name** hai. GitHub Actions UI mein jahan bhi is workflow ko refer karna hota hai — Actions tab ki left sidebar (Image 1 mein "Playwright Tests" dikh raha hai), run history ka title (Image 2 mein "Playwright Tests" heading), email subject mein `${{ github.repository }}` ke saath — sab yahi `name:` value use karte hain.

**Important clarifications:**

| Confusion                                              | Reality                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kya yeh Playwright framework ka koi built-in naam hai? | ❌ Nahi. Playwright framework ko iska koi concept nahi — yeh purely GitHub Actions ka`name:` key hai, jo tum khud kuch bhi likh sakte the (`"My CI"`, `"E2E Suite"`, kuch bhi) |
| Kya yeh commit message se aata hai?                    | ❌ Nahi. Commit message sirf run ke andar**subtitle** ki tarah dikhta hai (jaise Image 1 mein "Commit: 3faa95e pushed by...") — woh alag cheez hai, workflow ka naam nahi      |
| Agar`name:` field hi na hoti to?                     | GitHub Actions**filename** ko fallback ke roop mein use karta — yaani `playwright.yml` dikhta sidebar mein, `Playwright Tests` nahi                                        |

**Sidebar mein sirf ek hi workflow kyun dikh raha hai (Image 1)?**
Kyunki abhi repo mein sirf ek hi workflow file hai — `playwright.yml`. Jaise hi tum `regression.yml`, `nightly.yml` add karoge (Section D wale plan se), sidebar mein woh bhi alag-alag naam se list honge (unke apne `name:` field ke hisaab se).

**Job name vs Workflow name (alag concept, confuse mat karna):**

```yaml
name: Playwright Tests    # ← Workflow-level name (sidebar/UI mein yeh dikhta hai)
jobs:
  test:                   # ← Job-level name (run ke andar, jobs list mein yeh dikhta hai)
```

---

## 2. Manual trigger karne pe **kaunsa commit** run hoga?

Jab tum "Run workflow" click karte ho (Image 2/3), tumse ek **branch select** karwaya jaata hai — `main` (jaisa Image 3 mein hai).

**Rule simple hai:** Workflow us branch ke **latest/HEAD commit** pe run hoga — jo bhi us waqt us branch ka **most recent commit** hai jab tumne trigger click kiya.

**Iska matlab:**

- Tum kisi specific purane commit ko directly select nahi kar sakte `workflow_dispatch` UI se (sirf branch select hota hai, commit nahi)
- Agar tumne `main` select kiya, aur `main` ka current HEAD `abc123` hai, toh **`abc123` pe hi run hoga**
- Agar tumne trigger click karne ke 2 second baad hi koi aur naya commit push kar diya `main` pe, toh depend karta hai timing pe — but generally jo commit trigger ke exact moment pe HEAD tha, wahi use hota hai (GitHub is race ko snapshot leke handle karta hai)

**Specific commit pe run karna ho toh:**

1. Ek **temporary branch** banao us specific commit se (`git checkout -b test-this-commit abc123` phir push karo)
2. Us branch ko `workflow_dispatch` dropdown mein select karo
3. Kaam ho jaane ke baad branch delete kar sakte ho

**Interview line:**

> "`workflow_dispatch` se manually trigger karte waqt branch select hota hai, commit nahi — workflow us branch ke current HEAD commit pe chalta hai. Kisi specific older commit pe run karna ho toh us commit se temporary branch banakar select karna padta hai."

---

## 3. "Environment to test against: staging" — yeh kyun prefilled hai, maine toh yeh setup nahi kiya?

Yeh confusion clear karna zaroori hai — **is input ka current file mein koi actual use nahi hai**, yeh sirf ek **example/placeholder input** hai jo `workflow_dispatch` add karte waqt syntax demonstrate karne ke liye diya gaya tha:

```yaml
workflow_dispatch:
  inputs:
    environment:
      description: 'Environment to test against'
      required: false
      default: 'staging'
```

**Iska matlab step-by-step:**

- `inputs:` ke andar tum **custom form fields** define kar sakte ho jo "Run workflow" button click karne pe UI mein dikhte hain (Image 3 mein exactly yehi text box hai)
- `default: 'staging'` — isliye box mein "staging" pehle se likha hua aata hai (tum overwrite kar sakte ho, ya empty chhod sakte ho)
- **Lekin** — is input value ka actual istemal kahin nahi ho raha tumhare test run step mein! Abhi `run: npm run conduit-sanity` bas fixed command hai, yeh `environment` input ko read hi nahi kar raha

**Toh yeh field hai kyun, agar use hi nahi ho raha?**
Kyunki yeh ek **placeholder example** tha jo maine pehle diya tha "syntax dikhane ke liye" — real project mein iska matlab hota agar tumhare paas actually multiple environments hote (staging/prod/qa) jinke against tests point kar sakte ho (base URL alag-alag). Tumhare current setup mein aisa multi-env concept nahi hai, isliye:

**Options tumhare paas:**

1. **Remove kar do** agar zaroorat nahi:
   ```yaml
   workflow_dispatch:   # bas itna hi likh do, inputs hata do
   ```
2. **Actually wire kar do** agar future mein multi-env chahiye:
   ```yaml
   - name: Run Playwright tests
     run: npm run conduit-sanity -- --base-url=${{ github.event.inputs.environment }}
   ```

   (yeh depend karega tumhare test framework mein base URL kaise configure hota hai — `.env` file, config param, etc.)
3. **Repurpose kar do** kisi useful cheez ke liye — jaise Section 5 mein neeche discuss kar rahe hain, specific test file/tag input ke liye

**Interview trap:** Agar interviewer poochhe "yeh environment input kya karta hai", galti se mat bolna "ismein environment switch hoti hai" — sach bolna: *"Abhi yeh ek unused placeholder input hai jo maine wire nahi kiya; agar zaroorat ho toh isse base URL ya config select karne ke liye actually consume kiya jaa sakta hai run command mein."* Honest answer confident answer se better hota hai jab tumhe pata ho ki gap hai.

---

## 4. SDET Strategy: Local Docker parity vs CI

Tumhari observation **bilkul sahi hai aur yeh ek solid SDET practice hai**:

> "Hum har test ko CI workflow mein directly ek-ek karke debug nahi karte — hum local Docker image mein run karte hain jo CI infra ke similar hoti hai, aur agar wahan pass ho jaaye toh CI mein bhi pass hoga."

**Yeh kyun ek best practice hai, aur kaise kaam karta hai:**

**Problem jo yeh solve karta hai:**

- CI runs **slow** hote hain (queue time, checkout, npm install, browser install — sab milake minutes lagte hain)
- Har chhoti debugging iteration ke liye CI trigger karna (push → wait → check logs → repeat) **bahut time-consuming** hai
- Local machine (Windows/Mac) ka environment **CI runner se different** hota hai (`ubuntu-latest` — Linux) — kabhi kabhi test local pe pass, CI pe fail (environment-specific flakiness)

**Solution: CI-identical Docker image locally use karo**

```bash
docker run -it --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.4X.0-jammy npx playwright test
```

- Playwright ki official Docker image use karo jisme **wahi Ubuntu base + wahi browser versions** hain jo GitHub's `ubuntu-latest` runner pe hote (ya jitna close ho sake match karo)
- Isse local pe hi CI jaisa **exact environment** milta hai — fast iteration + high confidence ki jo local pass hua woh CI mein bhi pass hoga

**Workflow (real SDET process):**

```
1. Code change karo locally
2. Docker container mein test run karo (CI-parity environment)
3. Pass? → Push/PR karo, confidently expect karo CI bhi pass hoga
4. Fail? → Debug locally hi (fast iteration, koi CI wait nahi), fix karo, dobara docker mein test karo
5. Sirf jab locally confident ho, tabhi push karo — CI ko sirf "final gate" ki tarah use karo, primary debugging tool ki tarah nahi
```

**Interview line:**

> "As an SDET, main CI ko primary debugging tool ki tarah use nahi karta kyunki har iteration slow hoti hai. Main CI-jaisi Docker image (Playwright ki official image, jo `ubuntu-latest` ke close hai) locally use karta hoon test development aur debugging ke liye — fast feedback loop milta hai. CI ko sirf final verification gate ki tarah treat karta hoon, jahan main confident hokar push karta hoon ki test pass hoga kyunki environment parity maintain ki hai."

---

## 5. Agar CI workflow mein sirf ek SPECIFIC test run karna ho, toh kaise?

Yeh ek **real, practical need** hai — poora suite chalane ki bajaye, kabhi sirf ek specific test/file/tag CI pe run karna ho (debugging ke liye, ya kisi specific scenario verify karne ke liye).

**Abhi current file mein yeh possible NAHI hai**, kyunki:

```yaml
run: npm run conduit-sanity
```

Yeh ek **fixed command** hai — hardcoded, koi flexibility nahi kis test ko run karna hai.

**Solution: `workflow_dispatch` input add karo jo specific test path/pattern accept kare**

```yaml
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  schedule:
    - cron: '30 0 * * *'
  workflow_dispatch:
    inputs:
      test_target:
        description: 'Specific test file/path or grep pattern (leave empty to run full sanity suite)'
        required: false
        default: ''
```

**Aur run step ko conditionally modify karo:**

```yaml
- name: Run Playwright tests
  id: test-run
  run: |
    if [ -n "${{ github.event.inputs.test_target }}" ]; then
      npx playwright test "${{ github.event.inputs.test_target }}"
    else
      npm run conduit-sanity
    fi
```

**Yeh kaise kaam karta hai:**

- Agar `workflow_dispatch` se trigger karte waqt `test_target` field mein kuch fill kiya (e.g., `tests/login.spec.ts` ya `--grep "@smoke"`), toh **sirf woh specific test/pattern** run hoga
- Agar khaali chhod diya (default), toh **normal `conduit-sanity` full suite** chalega — jaisa `push`/`PR`/`schedule` trigger pe hamesha hota hai
- `push`/`PR`/`schedule` triggers mein `github.event.inputs.test_target` **exist hi nahi karta** (kyunki woh sirf `workflow_dispatch` event ka part hai), toh `-n` check automatically false ho jaayega aur full suite chalega — **existing behavior break nahi hoga**

**Alternative — Playwright ke `--grep` flag se tag-based selective run:**
Agar tumhare tests mein tags hain (jaise `test('login flow @smoke', ...)`), toh input mein tag pattern do:

```yaml
run: npx playwright test --grep "${{ github.event.inputs.test_target }}"
```

Isse tum pura tag-group bhi selectively CI pe chala sakte ho, na ki sirf ek file.

**Real-world use case examples:**

- Kisi specific flaky test ko CI environment mein isolate karke baar-baar run karna (retry pattern samjhne ke liye)
- Ek naye feature ka test hi CI pe verify karna, bina poora suite wait kiye
- Kisi bug fix ko specific test ke against turant CI pe confirm karna, before full regression trigger karna

**Interview line:**

> "Abhi workflow hardcoded `npm run conduit-sanity` chalata hai, jo specific test run karne ki flexibility nahi deta. Isko solve karne ke liye main `workflow_dispatch` mein ek optional `test_target` input add karoonga, jo agar diya jaaye toh `npx playwright test <path>` ya `--grep <pattern>` se sirf woh specific test/tag chalayega, aur agar khaali ho toh default full sanity suite chalega — isse existing push/PR/schedule behavior unaffected rehta hai, aur manual trigger ko flexible bana diya."

---

## Quick Recap Table

| # | Question                                  | Answer in one line                                                                                |
| - | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1 | "Playwright Tests" naam kahan se?         | Workflow file ke top`name:` field se — framework/commit se nahi                                |
| 2 | Manual trigger pe kaunsa commit run hota? | Selected branch ka HEAD commit us waqt jab trigger click hua                                      |
| 3 | "staging" env input kyun hai?             | Unused placeholder example — abhi kahin consume nahi ho raha, remove/wire/repurpose kar sakte ho |
| 4 | Local Docker vs CI strategy               | CI-identical Docker image se locally debug karo, CI ko sirf final gate ki tarah use karo          |
| 5 | Specific test CI pe kaise run karein?     | `workflow_dispatch` mein optional `test_target` input add karo, run step ko conditional banao |

---

*Yeh file `playwright-ci-workflow-notes.md` ka companion/follow-up hai — us file mein `workflow_dispatch` ka gap identify kiya tha (Section 6), yeh file usी ko implement karne ke practical nuances cover karti hai.*
