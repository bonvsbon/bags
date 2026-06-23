# เงินเหลือ · Ngern Luea

A Thai personal-finance app, implemented in **React + Vite** from the Claude Design
export `Ngern Luea.dc.html`. The original design ran on Claude Design's proprietary
`dc-runtime`; this is a clean, dependency-free port that you own.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## What's inside

A tabbed showcase with three views (top control bar):

- **Mobile App** — a 392×812 phone mockup with light/dark theme, holding all screens:
  Onboarding (4 steps), Home (3 hero variants A/B/C), Add Transaction (working keypad),
  Transactions (grouped list + empty state), Plan, Bills, Accounts, Goals, More, Settings.
  Plus bottom nav, a detail bottom-sheet, and toast.
- **Web Dashboard** — the desktop dashboard layout (sidebar, weekly chart, right panel).
- **Design System** — colors, type scale, buttons, fields, progress/badges, and states.

## Structure

```
src/
  main.jsx · App.jsx            top control bar + view switch
  store.js                      state model + computeVals() (ported 1:1 from the design)
  lib/css.js                    parses the design's inline-style strings into React styles
  components/                   MobileStage, BottomNav, Sheet, Toast
  screens/                      Onboarding, Home, AddTransaction, Transactions,
                                Plan, Bills, Accounts, Goals, More, Settings
  tabs/                         WebDashboard, DesignSystem
design-src/                     imported reference (.dc.html, support.js, _state-model.js)
```

Design tokens live as CSS variables in `src/index.css` (light defaults + a
`.nl-phone[data-theme="dark"]` override). The brand green is `#2f7d5b`; the font is
Noto Sans Thai (loaded non-blockingly in `index.html`).

`design-src/` is reference only and is not part of the app build.
