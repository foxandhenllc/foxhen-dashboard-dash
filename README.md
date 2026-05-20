# Dashboard Dash

A playable data-routing arcade game for clean rows, repairs, and quarantine decisions.

![Demo screenshot](docs/demo-screenshot.png)

## Live Demo

- Demo: [https://foxhen-dashboard-dash.vercel.app](https://foxhen-dashboard-dash.vercel.app)
- Repository: [https://github.com/foxandhenllc/foxhen-dashboard-dash](https://github.com/foxandhenllc/foxhen-dashboard-dash)

## Fully Working Behaviors

- Three-wave arcade run with simultaneous falling sample rows, escalating speed, combo scoring, quality loss, and win/loss conditions.
- Keyboard, mouse, touch, and visible lane-button controls.
- Help overlay with clear routing rules for clean, broken, duplicate, missing, bonus, shield, and corrupt sample rows.
- Power-up, bonus, and penalty drops: golden KPI bonuses, validation shields, and corrupt imports.
- Persistent best score stored locally with `localStorage`.
- End-of-run report that can be copied to the clipboard or exported as a `.txt` handoff.
- Deterministic test hooks exposed as `window.render_game_to_text` and `window.advanceTime`.
- No backend, auth, external service calls, production data, or customer work.

## Fork Notes

All data is fictional and generated in local state. To customize the game, edit the waves and drop sequence in `src/gameLogic.ts`; no credentials are needed.

## Local Run

```bash
npm install
npm run dev
npm run build
```
