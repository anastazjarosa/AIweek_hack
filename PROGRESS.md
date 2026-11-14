# Progress

**Objective:** Clickable hackathon demo of Neura: study material adapted to four learning needs
(Focus, Processing, Planning, Structure).

**Branch:** `feat/neura-demo`, local commits only. Owner said not to push or open a PR.

**Done**
- Landing, sign in, onboarding (8 statements, 0-4), "How I like to learn" sliders and
  preferences, dashboard with need scores and live difficulty signals, fake upload, lecture
  in 4 layouts with layout switcher.
- Demo module PSYC0101 Lecture 5 (memory and forgetting) from `lib/seed/`.
- Adaptive screen time: blocks, warnings, struggle-triggered breaks, off-screen tasks from the
  seed, recall quiz, daily cap, `/summary`.

**Verified (2026-11-14):** `npm test` (18 tests: rules + dimensions), `tsc`, lint, build.
Browser: onboarding to Structured layout for high focus + high structure (calmer tie-break),
preferences page, dashboard, lecture Structured and Standard (Map tab), Persona A session
(setup, overloaded break with seed task, recall quiz from seed).

**Known gaps**
- Voice input preference is stored but nothing uses it yet (screen-time behaviour was to stay
  unchanged).
- No code or design review run yet (skipped for speed at the owner's request).
- Idle trigger tested by unit test only.

**Next:** Rehearse the pitch path in a normal browser.
