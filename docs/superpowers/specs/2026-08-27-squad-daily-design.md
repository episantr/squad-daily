# Squad Daily — Design Spec

**Date:** 2026-08-27  
**Status:** Draft for review  
**Reference:** [episantr/daily](https://github.com/episantr/daily) (Card Core Solutions “Daily Chronicle”)

## Goal

Expose a deterministic daily standup facilitator page for every squad at:

```text
https://<user-or-org>.github.io/squad-daily/{squad}/daily/
```

Same UX as the reference: newspaper-style “Daily Chronicle”, primary + backup lead, weekend/holiday/PTO closed states, slot-machine name reveal.

## Non-goals

- Backend, auth, or database
- Per-user calendar integrations
- Editing members from the UI (config is code)
- Changing selection algorithm beyond the reference behavior

## Approach (chosen)

**Per-squad folder + shared assets** (not a SPA router, not full HTML copies).

| Option | Verdict |
|--------|---------|
| Single SPA + client routes | Rejected — GitHub Pages refresh/`/{squad}/daily` needs real paths or 404 hacks |
| Full `index.html` copy per squad | Rejected — holiday/UI fixes multiply |
| **Thin page per squad + shared JS/CSS** | **Chosen** — native Pages URLs, one place for logic/UI |

## Repository layout

```text
/
  index.html                 # Landing: links to all squad dailies
  assets/
    daily.css                # Shared styles (from reference)
    daily.js                 # Shared selection + render logic
  ccss/daily/index.html
  cds/daily/index.html
  cps/daily/index.html
  tam/daily/index.html
  partnership/daily/index.html
  miles/daily/index.html
  business/daily/index.html
  atm/daily/index.html
  docs/superpowers/specs/…
```

Each squad `index.html` is a thin shell: loads shared CSS/JS and passes a small config object (or inline `window.SQUAD_DAILY_CONFIG`).

## Config shape (per squad)

```js
{
  slug: "ccss",
  displayName: "Core Card Systems Solutions",
  team: ["Balay", "Dilaver", /* … */],
  quotes: [ /* optional; fall back to shared defaults */ ],
  unavailable: { /* optional "YYYY-MM-DD": ["Name"] */ }
}
```

Shared (in `daily.js`, not per squad unless overridden later):

- `CUTOVER_HOUR = 9`
- Azerbaijan 2026 `HOLIDAYS` (from reference)
- Default `QUOTES`
- Epoch `2026-01-01` for issue numbers
- Masthead title: “The Daily Chronicle”; gazette line uses `displayName`

## Selection behavior (parity with reference)

1. Effective date respects `CUTOVER_HOUR` (before 09:00 → previous calendar day).
2. Weekend → “Press Closed / Weekend”.
3. Holiday → “Press Closed / Holiday” + holiday name.
4. Pool = `team` minus `unavailable` for that date.
5. Empty pool → “Full House Off”.
6. Primary = FNV-1a(`YYYY-MM-DD`) % pool; if equals previous workday’s primary and pool &gt; 1, take next index.
7. Backup = FNV-1a(`YYYY-MM-DD` + `::backup`) over pool without primary.
8. Quote cycles by primary’s index in the full `team` list (or default quotes).

## Squads & URL slugs

| Slug | Display name | Members |
|------|----------------|---------|
| `ccss` | Core Card Systems Solutions | Balay, Dilaver, Fidan Q., Nahid, Nijat, Rana |
| `cds` | Core Digital Solutions | Asgar, Durkhan, Elkhan, Farid, Fidan H., Fidan Q., Qoshgar, Jalya, Sabina, Shakir, Vahid |
| `cps` | Card Payment Systems | Dilaver, Kamran, Kanan, Lala, Laman, Mustafa, Nurana |
| `tam` | Tam Squad | Khayala, Namiq, Rafael A., Rahila, Sabina E., Sevil, Jamal |
| `partnership` | Partnership Cards | Darya, Kamran, Lala, Mahammad, Namig, Rafael A., Rashid, Samir, Yekaterina |
| `miles` | Miles Squad | Darya, Farid, Lamia, Mahabbat, Mammad, Murad, Saleh, Tahmina, Rafael M. |
| `business` | Business Cards | Aynur, Aytaj, Hakim, Jale C., Javid, Leyla H., Mahammad G., Mahammad N., Teller, Xayala, Xeybar, Ziyeddin |
| `atm` | ATM Solutions | Gullu, Rufat, Vusal, Abdulla |

Notes:

- Same person may appear in multiple squads; selection is independent per squad page.
- Partnership spelling normalized: `Rafael A.`, `Samir` (confirmed).

## Hosting

- GitHub Pages from this repo (`/docs` or root — **prefer root** / `main` branch, folder `/`).
- No build step; static HTML/CSS/JS only.
- Root `index.html` lists all squads with links to `/{slug}/daily/`.

## Visual / UX

Preserve reference look: paper grain, Fraunces / JetBrains Mono / Work Sans, masthead + hero + footer, animations. Per-squad difference is primarily the gazette name and the team pool.

## Success criteria

- Each `/{slug}/daily/` loads without a router and shows that squad’s facilitator.
- Same date + same squad → same primary/backup for all visitors.
- Shared holiday/cutover/UI changes require editing only `assets/`.
- Adding a squad = new thin folder + config + landing link.

## Open follow-ups (post-v1)

- Per-squad `unavailable` calendars when provided
- Custom quotes per squad if desired
- Company-wide closure days beyond AZ public holidays
