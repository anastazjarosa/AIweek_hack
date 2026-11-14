# Progress

**Objective:** Clickable hackathon demo of Neura (adaptive study app for neurodivergent learners).

**Branch:** `feat/neura-demo`, local commits only. Owner said not to push or open a PR.

**Done**
- Landing, sign in, onboarding (pick or 6-question check), dashboard with fake upload,
  lecture in 4 renderings, profile switcher.
- Adaptive screen time: focus blocks, warnings, struggle-triggered breaks with snooze-once,
  off-screen break tasks, recall quiz that shortens the next block and simplifies wording,
  daily cap with an off-screen summary task, `/summary` page with the session log.

**Verified (2026-11-14):** `npm test` (13 rule tests), `tsc`, lint and `npm run build` pass.
Browser checks: full click path, all four lecture views, phone width (no horizontal scroll),
demo-profile session (warnings, overloaded + snooze, scheduled break, task change, dim,
recall 1/2 → 5-min block + simplify, 3 wrong → early break, daily cap → final task, summary).

**Known gaps**
- Idle trigger tested by unit test only; in the browser the block ended first.
- No code or design review run yet (skipped for speed at the owner's request).
- Recording and photo upload are visual only.

**Next:** Rehearse the pitch path in a normal browser (the in-app preview pane throttles
animation).
