# BudgetBuddy — Personal Expense Tracker

A fast, no-build personal finance app: track income & expenses, browse them **by month**, and explore clickable charts. Data lives in your browser (`localStorage`) — no account, no backend.

## Features

- **Dashboard** — month picker, income / expense / balance / savings-rate KPIs with vs-last-month trends, monthly budget bar
- **Monthly tracking** — daily income-vs-expense line graph, month transaction list, yearly bar + cumulative balance charts
- **Transactions** — add / search / filter (type, category, month, day) with **4 switchable views**: list, card grid, table, grouped-by-days
- **Analytics** — year overview: type pie, monthly bars, cumulative balance, daily trend (all year-filtered)
- **Clickable charts** — every bar, slice and point drills down (month → transactions, category → filtered list)
- **Settings** — global light / dark / system theme, 7 currencies, monthly budget, CSV/JSON export, JSON import, sample data
- **Shared dynamic shell** — one collapsible sidebar + theme engine for all pages, categories/currencies generated from a single source

## Quick start

No build step. Either:

1. Double-click `index.html`, or
2. Serve the folder (recommended, avoids all `file://` quirks):
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
   then open http://localhost:8080 (or 3000 for `serve`).

## Project structure

```
├── index.html          # Dashboard (month-grouped KPIs + clickable charts)
├── transactions.html   # Add / filter / 4 views
├── monthly.html        # Month detail + year overview (?month=YYYY-MM)
├── analytics.html      # Year analytics (?year via picker)
├── settings.html       # Theme, currency, budget, backup/restore
├── add.html / history.html / stats.html  # Simple legacy pages, same shell
├── css/style.css       # Whole design system (tokens + dark theme + responsive)
├── js/monthly.js       # Data engine: normalize, filter, series, settings,
│                       #   currency, categories, shared HTML helpers (BB.*)
├── js/layout.js        # Dynamic sidebar, global theme, dynamic dropdowns
├── js/transactions.js  # CRUD + filters + 4 view renderers
└── assets/             # logo.png (+ your own images)
```

## Tech

- Plain **HTML + CSS + vanilla JS** (no framework, no bundler)
- **Chart.js** (CDN) for graphs · **SweetAlert2** (CDN) for dialogs · **Inter** font
- Persistence: `localStorage` keys `transactions`, `bb_settings`, `bb_sidebar`, `bb_tx_view`
- Deep links via `URLSearchParams`: `monthly.html?month=2026-10`,
  `transactions.html?month=…&category=…`, `?day=…`, `?view=grid`

## Customize in one place

| Change | File |
|---|---|
| Categories / colors | `CATEGORIES` / `CAT_COLORS` in `js/monthly.js` |
| Currencies | `CURRENCIES` in `js/monthly.js` |
| Nav pages | `PAGES` in `js/layout.js` |
| Theme / responsive | CSS variables + media queries in `css/style.css` |

## Deploy to GitHub Pages

1. `git add -A && git commit -m "BudgetBuddy"` and push to GitHub
2. Repo → **Settings → Pages** → Deploy from branch → `main` / root
3. Open `https://<user>.github.io/<repo>/index.html`

> Note: everything is client-side; there is no secret to leak. Back up via **Settings → Export JSON**.
