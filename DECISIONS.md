# Decisions

## Active decisions

- [arch] Front-end-only demo with all data in `lib/data.ts` (2026-11-14)
- [arch] Lecture written once, rendered four ways by profile (2026-11-14)
- [arch] Client state in small `useSyncExternalStore` stores, persisted to localStorage (2026-11-14)
- [arch] Design foundations: Lexend, warm stone + deep pine tokens, light mode only (2026-11-14)
- [arch] Screen-time rules in one JSON file with a pure, tested engine (2026-11-14)
- [arch] Learner needs (4 dimensions) derived from picked profiles (2026-11-14)
- [arch] Screen-time session log kept client-side; `/summary` stands in for the API (2026-11-14)
- [arch] Break planner is a deterministic function, not an AI agent (2026-11-14)
- Demo clock runs 20× by default (2026-11-14)
- Not pushed to GitHub; local commits on `feat/neura-demo` only (owner instruction, 2026-11-14)

---

### [arch] Front-end-only demo with all data in `lib/data.ts`
**Decision:** Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion, no backend, no
auth, no AI calls. Every lecture, module, question and profile lives in `lib/data.ts`; loading
states are faked with timers.
**Why:** Hackathon pitch: it must look great and click smoothly with no network risk.
**Instead of:** A real API and model calls, which add failure points on stage.
**To undo:** Replace `lib/data.ts` imports with fetches; about a day for the current screens.
Rethink when real uploads or generated content are needed.
**By:** agent

### [arch] Lecture written once, rendered four ways by profile
**Decision:** Each lecture section stores `body` (full prose), `points` (short sentences),
`literal` (unambiguous wording), `terms` and a `check` question. `components/lecture/*-view.tsx`
choose which fields to show: Standard (notes/flashcards/quiz), ADHD (sprints and checks),
Dyslexia (audio-first, cream, terms), Autism (fixed numbered layout, interest analogy).
**Why:** Shows the core idea honestly: the same content, adapted, not four different lectures.
**Instead of:** Separate content per profile.
**To undo:** Cheap; the views are independent components. Rethink when content is generated
per learner by a model.
**By:** agent

### [arch] Client state in small `useSyncExternalStore` stores, persisted to localStorage
**Decision:** `lib/profile.tsx` (layout profile, picked profiles, interest, traits) and
`lib/screentime/session.ts` (study session) are module-level stores read with
`useSyncExternalStore`, saved to localStorage so a refresh mid-pitch keeps state.
**Why:** No provider tree, no setState-in-effect, server render uses safe defaults.
`useHydrated()` stops the saved profile animating in on load.
**Instead of:** React context + effects (flagged by the React lint rules), or a state library.
**To undo:** Under a day: swap the store internals for a server-backed store.
**By:** agent

### [arch] Design foundations
**Decision:** Lexend only; tokens in `app/globals.css` (canvas `#F5F3EE`, ink `#1C2321`, accent
`#1E6B57`, cream `#FAF4E2` for dyslexia, mark `#F3E2A8` for key terms, clay for wrong answers).
Light mode only. Full plan in `DESIGN.md`.
**Why:** Calm and readable for the audience; one accent keeps it premium, not "AI purple".
**Instead of:** Default shadcn neutrals, dark mode.
**To undo:** Change tokens in one file. Rethink if a brand identity is commissioned.
**By:** agent

### [arch] Screen-time rules in one JSON file with a pure, tested engine
**Decision:** `lib/screentime/screentime_rules.json` holds every tunable number: block lengths
by focus need (20/15/10), breaks (5, and 15 after every 3 blocks), daily cap (90), warnings
(2 min always; 5 min and 30 s when predictability is high), struggle triggers (3 wrong in a
row, idle twice, 3 replays, "I'm overloaded"; snooze once for 3 min), recall adaptation
(shorten by 5, minimum 5, simplify), task-type weights and profile-to-needs mapping.
`lib/screentime/engine.ts` is pure functions over it, covered by `engine.test.ts` (Vitest).
**Why:** Easy to tune without touching UI; logic testable without a browser.
**Instead of:** Constants spread through components.
**To undo:** Cheap. Rethink if rules become per-institution or per-student (move to a DB).
**By:** agent

### [arch] Learner needs derived from picked profiles
**Decision:** The four needs (focus, info_intake, organising, predictability; low/medium/high)
are computed from the profiles picked in onboarding: each need takes the highest level any
picked profile has (`profile_needs` in the rules file). If none are picked, the current layout
profile is used. ADHD + Autism gives the demo profile (focus high, predictability high); the
session setup dialog also has a one-click "Demo profile" toggle.
**Why:** Reuses the existing onboarding instead of a new questionnaire.
**Instead of:** Asking students to rate four dimensions directly.
**To undo:** Cheap: store needs directly. Rethink when the check is validated with students.
**By:** agent

### [arch] Screen-time session log kept client-side
**Decision:** `lib/screentime/session.ts` logs blocks (planned minutes, active seconds, how it
ended, snoozed, recall score) and breaks (kind, trigger reason, task type, off-screen
seconds). `/summary` shows screen vs off-screen time and the JSON that
`GET /session/{id}/screentime` would return. Active screen time counts only when the tab is
visible and the student isn't idle.
**Why:** The spec asked for MongoDB and an endpoint, but this demo has no backend.
**Instead of:** Adding a database and API route for a pitch.
**To undo:** About a day: POST the log on each change and serve the summary from an API route.
Trigger: real users or multi-device sessions.
**By:** agent

### [arch] Break planner is deterministic
**Decision:** `lib/screentime/planner.ts` builds break tasks (teach_back, paper_sketch,
walk_and_listen, move_and_recall, real_world_link) and the 2-question recall quiz from the
section just studied. Task type comes from `chooseTask` (weights by need; predictability high
keeps the same type unless the student changes it). Recording and photo upload are visual
only; nothing is captured or stored.
**Why:** No AI calls in the demo; same behaviour every run.
**Instead of:** An LLM break-planner agent.
**To undo:** Replace `planTask` with a model call behind the same `BreakTask` type.
**By:** agent

### Demo clock runs 20× by default
A 10-minute block takes 30 seconds, a 5-minute break 15 seconds; idle is 6 real seconds in demo
mode (90 s at real time). The setup dialog can switch to real time. Tune in `demo` in the
rules file.

### Block content mapping
Block N studies section N of the lecture (wrapping after 5). Good enough for the demo; a real
build would track what the student actually viewed.
