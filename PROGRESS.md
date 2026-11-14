# Progress

**Objective:** Clickable hackathon demo of Mosaic: study material adapted to four learning needs
(Focus, Processing, Planning, Structure).

**Branch:** `feat/mosaic-demo`, local commits only. Owner said not to push or open a PR.

**Done**
- Landing, sign in, onboarding (8 statements, 0-4), "How I like to learn" sliders and
  preferences, dashboard with need scores and live difficulty signals, fake upload, lecture
  in 4 layouts with layout switcher.
- Demo module PSYC0101 Lecture 5 (memory and forgetting) from `lib/seed/`.
- Spacing lab (`/lecture/memory/lab`): predict, run, explain with an illustrative memory model
  and a transparent word check on the explanation. Linked from every layout.
- Skim suggestion: in Standard notes, reading time vs text length; when 3+ recent sections are
  mostly skimmed (score ≥ 0.7) a card offers Sprints with the evidence. Student decides.
- Adaptive screen time: blocks, warnings, struggle-triggered breaks, off-screen tasks from the
  seed, recall quiz, daily cap, `/summary`.

**Verified (2026-11-14):** `npm test` (32 tests: rules, dimensions, spacing model, skim signal),
`tsc`, lint, build, `npm run test:e2e` (4 tests incl. lab journey and skim → Sprints).
Browser: onboarding to Structured layout for high focus + high structure (calmer tie-break),
preferences page, dashboard, lecture Structured and Standard (Map tab), Persona A session
(setup, overloaded break with seed task, recall quiz from seed).

**Known gaps**
- Voice input preference is stored but nothing uses it yet (screen-time behaviour was to stay
  unchanged).
- No code or design review run yet (skipped for speed at the owner's request); lab and skim
  suggestion were self-reviewed only.
- The skim card and the focus-session break card share the bottom-right spot; both showing at
  once is possible but unlikely.
- Out of scope by choice (from the SimMind brief): teacher/parent views, topic canvas, MCP,
  exam planner, extra lesson modes.
- Idle trigger tested by unit test only.

**Next:** Rehearse the pitch path in a normal browser.
