# Squad Daily Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a GitHub Pages static site where each squad has `/{slug}/daily/` showing a deterministic standup facilitator, shared UI/logic, thin per-squad config pages.

**Architecture:** Browser loads `/{slug}/daily/index.html` which sets `window.SQUAD_DAILY_CONFIG` then loads `/assets/daily.css` and `/assets/daily.js`. Selection (FNV-1a, cutover, holidays, PTO) lives only in `daily.js`. Root `index.html` links all squads. Pure selection helpers are exported for Node tests via `typeof module !== "undefined"`.

**Tech Stack:** Static HTML/CSS/JS, Node.js built-in `node:test` + `node:assert` (no npm deps), GitHub Pages from repo root.

## Global Constraints

- No backend, no build step, no SPA router.
- Paths: `/{slug}/daily/` for every squad listed in the design spec.
- Shared: `CUTOVER_HOUR = 9`, AZ 2026 `HOLIDAYS`, default quotes, epoch `2026-01-01`.
- Visual parity with [episantr/daily](https://github.com/episantr/daily) (paper grain, Fraunces / JetBrains Mono / Work Sans).
- Asset URLs from squad pages must work on GitHub Pages project site base `/squad-daily/` — use root-relative paths with a configurable base or relative `../../assets/` from each `/{slug}/daily/index.html`.
- **Chosen asset path strategy:** from each squad page use `../../assets/daily.css` and `../../assets/daily.js` (works for both local file open under a static server and `https://<host>/squad-daily/{slug}/daily/`).
- Member lists and display names: exact values from `docs/superpowers/specs/2026-08-27-squad-daily-design.md`.

## File map

| File | Responsibility |
|------|----------------|
| `assets/daily.css` | All styles from reference |
| `assets/daily.js` | Holidays, selection, render, `init(config)` |
| `assets/daily.test.js` | Node tests for selection helpers |
| `{slug}/daily/index.html` | Thin shell + config (×8) |
| `index.html` | Landing links |
| `README.md` | Clone, local serve, Pages enable steps |
| `package.json` | `"test": "node --test assets/daily.test.js"` only |

---

### Task 1: Selection core + tests

**Files:**
- Create: `assets/daily.js` (logic only first; DOM render can be stubbed or included)
- Create: `assets/daily.test.js`
- Create: `package.json`

**Interfaces:**
- Consumes: none
- Produces:
  - `toKey(date: Date): string`
  - `hashDate(date: Date, suffix?: string): number`
  - `effectiveDate(now: Date, cutoverHour?: number): Date`
  - `availableTeam(team: string[], unavailable: Record<string,string[]>, date: Date): string[]`
  - `pickPrimary(team, unavailable, holidays, date): string | null`
  - `pickBackup(team, unavailable, date, primary): string | null`
  - `isWeekend(date): boolean`
  - `isHoliday(date, holidays): string | null`
  - Constants: `DEFAULT_CUTOVER_HOUR`, `DEFAULT_HOLIDAYS`, `DEFAULT_QUOTES`, `EPOCH`
  - Export via `if (typeof module !== "undefined") { module.exports = { ... } }`

- [ ] **Step 1: Write failing tests** in `assets/daily.test.js`

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  toKey,
  hashDate,
  effectiveDate,
  pickPrimary,
  pickBackup,
  availableTeam,
} = require("./daily.js");

const TEAM = ["A", "B", "C"];

describe("toKey", () => {
  it("formats local Y-M-D", () => {
    assert.equal(toKey(new Date(2026, 3, 27)), "2026-04-27");
  });
});

describe("effectiveDate", () => {
  it("stays on calendar day at/after cutover", () => {
    const d = effectiveDate(new Date(2026, 3, 27, 9, 0, 0), 9);
    assert.equal(toKey(d), "2026-04-27");
  });
  it("rolls back before cutover", () => {
    const d = effectiveDate(new Date(2026, 3, 27, 8, 59, 0), 9);
    assert.equal(toKey(d), "2026-04-26");
  });
});

describe("pickPrimary", () => {
  it("is deterministic for a fixed date", () => {
    const date = new Date(2026, 3, 27, 12);
    const a = pickPrimary(TEAM, {}, {}, date);
    const b = pickPrimary(TEAM, {}, {}, date);
    assert.equal(a, b);
    assert.ok(TEAM.includes(a));
  });
  it("excludes unavailable members", () => {
    const date = new Date(2026, 3, 27, 12);
    const off = { "2026-04-27": ["A", "B"] };
    assert.equal(pickPrimary(TEAM, off, {}, date), "C");
  });
  it("returns null when pool empty", () => {
    const date = new Date(2026, 3, 27, 12);
    const off = { "2026-04-27": ["A", "B", "C"] };
    assert.equal(pickPrimary(TEAM, off, {}, date), null);
  });
});

describe("pickBackup", () => {
  it("never equals primary when pool allows", () => {
    const date = new Date(2026, 3, 27, 12);
    const primary = pickPrimary(TEAM, {}, {}, date);
    const backup = pickBackup(TEAM, {}, date, primary);
    assert.notEqual(backup, primary);
  });
});

describe("availableTeam", () => {
  it("filters by date key", () => {
    assert.deepEqual(
      availableTeam(TEAM, { "2026-04-27": ["B"] }, new Date(2026, 3, 27, 12)),
      ["A", "C"]
    );
  });
});

describe("hashDate", () => {
  it("changes with suffix", () => {
    const d = new Date(2026, 3, 27, 12);
    assert.notEqual(hashDate(d), hashDate(d, "::backup"));
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --test assets/daily.test.js
```

Expected: `Cannot find module` or missing exports.

- [ ] **Step 3: Implement selection in `assets/daily.js`**

Port FNV-1a, weekend, holiday map, previous-workday anti-repeat, pickPrimary/pickBackup from the reference `index.html` script. Include full `DEFAULT_HOLIDAYS` object from the design/reference. Do **not** require DOM yet; export helpers + constants. Include empty `function init(config) {}` stub exporting `init` so later tasks fill it.

Anti-repeat logic must use `isHoliday(date, holidays)` and weekend checks when walking `previousWorkday`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --test assets/daily.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Add `package.json`**

```json
{
  "name": "squad-daily",
  "private": true,
  "scripts": {
    "test": "node --test assets/daily.test.js"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add assets/daily.js assets/daily.test.js package.json
git commit -m "feat: add deterministic daily selection core with tests"
```

---

### Task 2: Shared CSS + DOM render

**Files:**
- Create: `assets/daily.css`
- Modify: `assets/daily.js` (implement `init` + render)

**Interfaces:**
- Consumes: helpers from Task 1
- Produces: `init(config)` where

```ts
config = {
  slug: string,
  displayName: string,
  team: string[],
  quotes?: string[],
  unavailable?: Record<string, string[]>,
  holidays?: Record<string, string>,  // optional override
  cutoverHour?: number
}
```

`init` reads `config`, uses `effectiveDate(new Date(), cutoverHour)`, updates masthead/footer/hero in the DOM (elements with ids matching the shell in Task 3).

- [ ] **Step 1: Create `assets/daily.css`**

Copy styles from reference `index.html` `<style>` block into this file unchanged in spirit (same CSS variables and class names: `.masthead`, `.hero-name`, `.closed-state`, etc.).

- [ ] **Step 2: Implement `init(config)` in `assets/daily.js`**

Expected DOM ids (must match Task 3 shell):

- `#issue-number`, `#date-stamp`, `#gazette-name`, `#hero`, `#footer-left`, `#footer-right`

Render paths:

1. Weekend → closed “Weekend”
2. Holiday → closed “Holiday” + name
3. Else → primary/backup + slot-machine animation over `config.team`, quote from `config.quotes || DEFAULT_QUOTES`

Gazette line: `THE ${config.displayName.toUpperCase()} GAZETTE` (or set text content of `#gazette-name` to that).

At end of file (browser):

```js
if (typeof window !== "undefined" && window.SQUAD_DAILY_CONFIG) {
  init(window.SQUAD_DAILY_CONFIG);
}
```

- [ ] **Step 3: Re-run unit tests**

```bash
npm test
```

Expected: PASS (DOM code must not break Node require).

- [ ] **Step 4: Commit**

```bash
git add assets/daily.css assets/daily.js
git commit -m "feat: add shared daily chronicle styles and DOM init"
```

---

### Task 3: Thin squad pages (all 8)

**Files:**
- Create: `ccss/daily/index.html`
- Create: `cds/daily/index.html`
- Create: `cps/daily/index.html`
- Create: `tam/daily/index.html`
- Create: `partnership/daily/index.html`
- Create: `miles/daily/index.html`
- Create: `business/daily/index.html`
- Create: `atm/daily/index.html`

**Interfaces:**
- Consumes: `init` via auto-boot from `SQUAD_DAILY_CONFIG`
- Produces: live pages at each slug

- [ ] **Step 1: Create one template** (example `ccss/daily/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Chronicle — Core Card Systems Solutions</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../assets/daily.css" />
</head>
<body>
  <main class="container">
    <header class="masthead">
      <div class="masthead-meta">
        <div class="masthead-meta-left">
          <span id="issue-number">NO. 001</span>
          <span id="date-stamp">—</span>
        </div>
        <div class="masthead-meta-mid">
          <span class="dot"></span>
          <span>LIVE</span>
        </div>
        <div class="masthead-meta-right">
          <span id="gazette-name">THE CORE CARD SYSTEMS SOLUTIONS GAZETTE</span>
          <span>VOL. I</span>
        </div>
      </div>
      <h1 class="masthead-title">The Daily Chronicle</h1>
      <p class="masthead-tagline">A morning serial for your daily stand-up</p>
    </header>
    <section class="hero-wrap" id="hero"></section>
    <footer class="footer">
      <span id="footer-left">EST. 2026</span>
      <span class="footer-quote">10:15 sharp — coffee's brewed, meeting's on.</span>
      <span id="footer-right">DEV. BY SQUAD</span>
    </footer>
  </main>
  <script>
    window.SQUAD_DAILY_CONFIG = {
      slug: "ccss",
      displayName: "Core Card Systems Solutions",
      team: ["Balay", "Dilaver", "Fidan Q.", "Nahid", "Nijat", "Rana"]
    };
  </script>
  <script src="../../assets/daily.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create remaining 7 pages** with exact teams from the design spec:

| slug | displayName | team |
|------|-------------|------|
| cds | Core Digital Solutions | Asgar, Durkhan, Elkhan, Farid, Fidan H., Fidan Q., Qoshgar, Jalya, Sabina, Shakir, Vahid |
| cps | Card Payment Systems | Dilaver, Kamran, Kanan, Lala, Laman, Mustafa, Nurana |
| tam | Tam Squad | Khayala, Namiq, Rafael A., Rahila, Sabina E., Sevil, Jamal |
| partnership | Partnership Cards | Darya, Kamran, Lala, Mahammad, Namig, Rafael A., Rashid, Samir, Yekaterina |
| miles | Miles Squad | Darya, Farid, Lamia, Mahabbat, Mammad, Murad, Saleh, Tahmina, Rafael M. |
| business | Business Cards | Aynur, Aytaj, Hakim, Jale C., Javid, Leyla H., Mahammad G., Mahammad N., Teller, Xayala, Xeybar, Ziyeddin |
| atm | ATM Solutions | Gullu, Rufat, Vusal, Abdulla |

Each file mirrors the template; only `<title>`, `#gazette-name` default text, and `SQUAD_DAILY_CONFIG` change.

- [ ] **Step 3: Smoke-check one page locally**

```bash
npx --yes serve -l 4173 .
# open http://localhost:4173/ccss/daily/
```

Expected: page loads, shows a facilitator name (or closed state if weekend/holiday), no 404 on CSS/JS.

- [ ] **Step 4: Commit**

```bash
git add ccss cds cps tam partnership miles business atm
git commit -m "feat: add thin daily pages for all eight squads"
```

---

### Task 4: Landing page + README

**Files:**
- Create: `index.html`
- Create: `README.md`

**Interfaces:**
- Consumes: squad slug list
- Produces: navigable root + Pages instructions

- [ ] **Step 1: Create root `index.html`**

Minimal list (reuse paper tokens lightly or keep simple):

- Heading: Squad Daily
- Unordered links: `ccss/daily/`, `cds/daily/`, … for all eight with display names as link text

- [ ] **Step 2: Create `README.md`**

Include:

1. What it is
2. `npm test`
3. Local: `npx serve .`
4. GitHub Pages: Settings → Pages → Deploy from branch `master` / root
5. URLs: `https://<user>.github.io/squad-daily/{slug}/daily/`
6. How to add a squad (new folder + landing link)

- [ ] **Step 3: Verify landing links resolve under `serve`**

Open `/` and click through at least two squads.

- [ ] **Step 4: Commit**

```bash
git add index.html README.md
git commit -m "docs: add landing page and GitHub Pages README"
```

---

### Task 5: Final verification

**Files:** none (verify only)

- [ ] **Step 1: Run `npm test`** — all pass
- [ ] **Step 2: Confirm all eight HTML files exist and contain correct `slug` + member counts:**

| slug | member count |
|------|--------------|
| ccss | 6 |
| cds | 11 |
| cps | 7 |
| tam | 7 |
| partnership | 9 |
| miles | 9 |
| business | 12 |
| atm | 4 |

```bash
for s in ccss cds cps tam partnership miles business atm; do
  test -f "$s/daily/index.html" && echo "ok $s" || echo "missing $s"
done
```

- [ ] **Step 3: Optional commit if any fixes** — only if Step 1–2 required edits

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Shared assets + thin pages | 2, 3 |
| Eight squads + exact members | 3 |
| FNV selection, cutover, holidays, backup | 1, 2 |
| GitHub Pages paths | 3, 4 (relative assets) |
| Root landing | 4 |
| No backend / no SPA | all |

No placeholders remaining. `init(config)` shape is consistent across Tasks 2–3.
