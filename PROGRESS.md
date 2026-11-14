# Progress

**Objective:** Clickable hackathon demo of Mosaic: study material adapted to four learning needs
(Focus, Processing, Planning, Structure). Content is History of Life only; warm orange theme with Pip, a study-buddy body double.

**Branch:** `feat/mosaic-demo`, pushed with a draft PR at the owner's request (2026-11-14).

**Done**
- Landing, sign in, onboarding (8 statements, 0-4), "How I like to learn" sliders and
  preferences, dashboard with need scores and live difficulty signals, fake upload, lecture
  in 4 layouts with layout switcher.
- Demo module BIOL0104 Lecture 3, "The story of life on Earth", from `lib/seed/` (8 slides,
  deep time to humans). Dashboard modules are all History of Life topics.
- Moth lab (`/lecture/history-of-life/lab`): predict, run, explain with an illustrative peppered
  moth selection model (bark darkness, birds on/off) and a transparent word check on the
  explanation. Linked from every layout.
- Skim suggestion: in Standard notes, reading time vs text length; when 3+ recent sections are
  mostly skimmed (score ≥ 0.7) a card offers Sprints with the evidence. Student decides.
- Orange theme (`#FFE8D6` canvas, `#E07A2E` fills with dark text, `#9A4710` text accent); AA
  contrast audited on every page and Pip state, default and calm themes.
- Pip (`components/pip/`, `lib/pip.ts`): original bean character, corner body double. Reacts only to
  block start (hop), break (stretch, point away, rest), return (wave), urge (first idle or tab return:
  Pop names it, Pip gives a strategy) and struggle (offers another explanation). Chat panel with
  scripted replies; full off-screen break unlocks a blind-box outfit; `/wardrobe` for outfit and
  colour. Saved in the profile store (no MongoDB: no backend in this demo).
- Adaptive screen time: blocks, warnings, struggle-triggered breaks, off-screen tasks from the
  seed, recall quiz, daily cap, `/summary`.
- Simulation Lab (`/lab`, Part 1 of the SimMind plan): spec-driven engine with six tested
  templates, 11 ready-made simulations (6 physics, 3 chemistry, 2 biology) plus the moth lab,
  predict → run (guided fair test, dashed last-run comparison) → explain (explanation, key-idea
  self-check, misconception callout). Dashboard date and greeting use the real clock.
- Simulation agent (Part 2, branch `feat/simmind`): "Ask for any experiment" on `/lab` →
  `/lab/new?q=` → Claude designs a spec (checked, consistency-checked, retried) → the same lab UI.
  AI feedback on the explanation ticks the key ideas covered. Offline fallback: closest library
  experiment and the self-check.
- MCP server (Part 3): `npm run mcp`, four tools over the same engine; share links `/lab/s?d=`.
  Verified: tool unit tests and a stdio integration test (real client lists tools, calls them).
- Learning profile (Part 4): `/profile` "What works for you" from a browser-only event log;
  findings with evidence; suggestions apply on request. Instrumented: experiments, lecture quizzes,
  skim reads, audio replays, focus blocks.
- Study planner (Part 5): `/planner` with exams, plan sized to focus span and weak topics, habit
  coach suggested from behaviour, 2-minute first step, weekly check-in.
  Verified: 128 unit tests, 20 e2e (event log from a real experiment, profile demo and Use this,
  planner demo, no label words); screenshots of profile and planner, no phone overflow.
- Consent, privacy and polish (Part 6): consent gate, `/privacy` (what's kept, what goes to the
  AI, download, delete), phone navigation under the header, dashboard plan driven by the planner.
  Verified: 128 unit tests, 25 e2e (consent for under-18s and adults, privacy export and delete,
  dashboard plan, phone navigation without overflow).

**Verified (2026-11-14, simulation agent):** 98 unit tests (agent logic with a scripted fake
model: retry on checker errors, retry on answer mismatch, give up after 3, refusal, off-topic,
unparseable; offline matcher; rate limiter; prompts list every template and carry the guardrail),
typecheck, lint, build, 15 e2e (offline ask, unrelated question, route input validation, AI
screens with stubbed responses). **Not verified: a live Claude call** (no API key on this machine).

**Verified (2026-11-14, Simulation Lab):** 69 unit tests, typecheck, lint, build, 8 e2e tests
(4 new: gallery, full heavier-falls-faster journey, fair-test prompt, every simulation renders).
Screenshots checked: gallery, projectile run and explain, predators and prey, catalyst on a phone
(no horizontal overflow).

**Verified (2026-11-14, Pip + theme):** `./scripts/check` passes: 41 unit tests, tsc, lint, build,
7 e2e incl. Pip journey, chat and reduced motion. Screenshots of every Pip state with the demo profile.
**Earlier:** `npm test` (33 tests: rules, dimensions, moth model, skim signal),
`tsc`, lint, build, `npm run test:e2e` (4 tests incl. lab journey and skim → Sprints).
Browser: onboarding to Structured layout for high focus + high structure (calmer tie-break),
preferences page, dashboard, lecture Structured and Standard (Map tab), Persona A session
(setup, overloaded break with seed task, recall quiz from seed). After the History of Life
  swap and baby blue theme (since replaced by orange): landing, dashboard, lecture and moth lab checked in the browser.

**Known gaps**
- Voice input preference is stored but nothing uses it yet (screen-time behaviour was to stay
  unchanged).
- No code or design review run (skipped at the owner's request, again for Pip and the theme).
- Untracked `AGENTS.md` appeared during the Pip session; not authored by the agent, left uncommitted.
- The skim card and the focus-session break card share the bottom-right spot; both showing at
  once is possible but unlikely.
- Out of scope by choice (from the SimMind brief): teacher/parent views, topic canvas, extra
  lesson modes.
- Idle trigger tested by unit test only.
- The live AI path has not run against the real API yet; run one question with a key before the
  pitch. Generated specs live in server memory only (lost on restart).

**Next:** live-test the AI path with a key; rehearse the pitch path. Pip can overlap content at
the bottom left on phones (owner's component, untouched).
