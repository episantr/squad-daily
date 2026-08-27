# Squad Daily

Static daily stand-up facilitator pages for every squad. Each page picks a primary and backup lead for the day, handles weekends, holidays, and PTO, and presents the result in a newspaper-style “Daily Chronicle” UI.

## Tests

```bash
npm test
```

Runs the shared selection logic tests in `assets/daily.test.js`.

## Local preview

From the repository root:

```bash
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) for the landing page. Squad pages live at `/{slug}/daily/` (for example, `/ccss/daily/`).

## GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`master`** and folder **`/ (root)`**, then save.

After deployment, pages are available at:

```text
https://<user>.github.io/squad-daily/{slug}/daily/
```

Replace `<user>` with your GitHub username or organization. Examples:

- `https://<user>.github.io/squad-daily/ccss/daily/`
- `https://<user>.github.io/squad-daily/tam/daily/`

The root URL (`https://<user>.github.io/squad-daily/`) lists links to all squads.

## Adding a squad

1. Create `{slug}/daily/index.html` using an existing squad page as a template. Set `slug`, `displayName`, and `team` in `window.SQUAD_DAILY_CONFIG`.
2. Add a link on the root `index.html` landing page with the squad’s display name pointing to `{slug}/daily/`.
3. Run `npm test` and preview locally with `npx serve .`.
