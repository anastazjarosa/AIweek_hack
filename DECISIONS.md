# Decisions

## Active decisions

- [arch] Front-end-only demo with all data in `lib/data.ts` (2026-11-14)
- [arch] Lecture written once, rendered in four layouts (2026-11-14)
- [arch] Client state in small `useSyncExternalStore` stores, persisted to localStorage (2026-11-14)
- [arch] Design foundations: Lexend, baby blue fills + deep blue text tokens, light mode only (2026-11-14, palette changed same day)
- [arch] Screen-time rules in one JSON file with a pure, tested engine (2026-11-14)
- [arch] Four need dimensions (0-4 scores) replace condition labels everywhere (2026-11-14)
- [arch] Demo module loaded from one JSON seed: BIOL0104 History of Life only (2026-11-14)
- [arch] Screen-time session log kept client-side; `/summary` stands in for the API (2026-11-14)
- [arch] Break planner is a deterministic function, not an AI agent (2026-11-14)
- Demo clock runs 20× by default (2026-11-14)
- Product renamed Mosaic; logo is a four-tile pinwheel (see DESIGN.md) (2026-11-14)
- Not pushed to GitHub; local commits on `feat/mosaic-demo` only (owner instruction, 2026-11-14)

---

### [arch] Front-end-only demo with all data in `lib/data.ts`
**Decision:** Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion, no backend, no
auth, no AI calls. The demo module lives in `lib/seed/`, other mock data in `lib/data.ts`; loading
states are faked with timers.
**Why:** Hackathon pitch: it must look great and click smoothly with no network risk.
**Instead of:** A real API and model calls, which add failure points on stage.
**To undo:** Replace `lib/data.ts` imports with fetches; about a day for the current screens.
Rethink when real uploads or generated content are needed.
**By:** agent

### [arch] Lecture written once, rendered in four layouts
**Decision:** Each lecture section stores `body` (transcript), `points` (short, literal
sentences), `terms` and a `check` question. `components/lecture/*-view.tsx` choose which fields
to show: Standard (notes, flashcards, quiz, map), Sprints (timed cards and checks), Listen
(audio-first, cream, terms), Structured (fixed numbered layout, interest examples).
**Why:** Shows the core idea honestly: the same content, adapted, not four different lectures.
**Instead of:** Separate content per layout.
**To undo:** Cheap; the views are independent components. Rethink when content is generated
per learner by a model.
**By:** agent

### [arch] Client state in small `useSyncExternalStore` stores, persisted to localStorage
**Decision:** `lib/profile.tsx` (need scores, preferences, layout, interest) and
`lib/screentime/session.ts` (study session) are module-level stores read with
`useSyncExternalStore`, saved to localStorage so a refresh mid-pitch keeps state.
**Why:** No provider tree, no setState-in-effect, server render uses safe defaults.
`useHydrated()` stops the saved layout animating in on load.
**Instead of:** React context + effects (flagged by the React lint rules), or a state library.
**To undo:** Under a day: swap the store internals for a server-backed store.
**By:** agent

### [arch] Design foundations
**Decision:** Lexend only; tokens in `app/globals.css`. Baby blue `--brand` `#A8D5F7` fills buttons
and selected pills with navy `--brand-ink` text (10:1). Deeper blue `--accent` `#2867A6` carries text,
strokes, borders and data bars, where baby blue would be unreadable (1.6:1 on white). Pale blue
canvas `#F3F8FD`, navy ink `#14243B`, pale blue `--paper` for the Listen layout, yellow mark for key
terms, clay for wrong answers. Light mode only. Full plan in `DESIGN.md`.
**Why:** Owner asked for baby blue. Splitting fill and text blues keeps it soft without failing contrast.
**Instead of:** Warm stone + deep pine (first version, replaced 2026-11-14); one baby blue accent for
everything (fails WCAG for text and borders).
**To undo:** Change tokens in one file. Rethink if a brand identity is commissioned.
**By:** agent

### [arch] Screen-time rules in one JSON file with a pure, tested engine
**Decision:** `lib/screentime/screentime_rules.json` holds every tunable number: block lengths
by focus need (20/15/10), breaks (5, and 15 after every 3 blocks), daily cap (90), warnings
(2 min always; 5 min and 30 s when predictability is high), struggle triggers (3 wrong in a
row, idle twice, 3 replays, "I'm overloaded"; snooze once for 3 min), recall adaptation
(shorten by 5, minimum 5, simplify) and task-type weights by need.
`lib/screentime/engine.ts` is pure functions over it, covered by `engine.test.ts` (Vitest).
**Why:** Easy to tune without touching UI; logic testable without a browser.
**Instead of:** Constants spread through components.
**To undo:** Cheap. Rethink if rules become per-institution or per-student (move to a DB).
**By:** agent

### [arch] Four need dimensions replace condition labels
**Decision:** No condition labels anywhere (UI, data, storage, logs, prompts). Students have
four 0-4 scores: focus (Focus), processing (Processing), organising (Planning),
predictability (Structure); 0-1 low, 2 medium, 3-4 high (`lib/dimensions.ts`). Onboarding
averages two statements per need; "How I like to learn" edits sliders plus optional format,
voice input and calm theme. Any mix stacks. On conflicts the calmer option wins (layout order
Structured, Listen, Sprints) and the student's settings always win (format picks the layout).
`info_intake` was renamed `processing` in the screen-time rules; screen-time behaviour is
unchanged. Old label-based presets were migrated once into five score-named personas and the
label fields deleted; v1 localStorage keys are removed on load. Wording uses "needs" and
"preferences" only. Any agent prompt must include `PLANNER_GUARDRAIL`
(`lib/screentime/planner.ts`): never infer, guess or mention a medical condition or diagnosis.
**Why:** Needs describe what to adapt without labelling people, and any mix is expressible.
**Instead of:** Condition presets.
**To undo:** Not intended. Rethink if students ask for more dimensions.
**By:** owner request, implemented by agent

### [arch] Demo module loaded from one JSON seed
**Decision:** `lib/seed/biol0104-history-of-life.json` holds BIOL0104 Lecture 3, "The story of life
on Earth" (deep time to humans, natural selection). The app is History of Life only: the earlier
psychology/memory and medicine content was removed at the owner's request. The seed has
slides, notes, key ideas, quiz, visual map, off-screen tasks and references, plus two fields
the existing layouts need (`glossary` for key terms, `interest_examples` for the Structured
layout). `lib/data.ts` adapts it to the section model; break tasks come from its
`offscreen_tasks`. Non-demo dashboard lectures are not linked.
**Why:** One file to swap for another module; only established findings, debated points
marked "researchers debate". The concept map's columns come from `visual_map.groups`.
**Instead of:** Hard-coding lecture content in components.
**To undo:** Cheap: point the adapter at another seed file.
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
**Decision:** `lib/screentime/planner.ts` takes break tasks (teach_back, paper_sketch,
walk_and_listen, move_and_recall, real_world_link) from the module seed and builds the
2-question recall quiz from the section just studied. Task type comes from `chooseTask` (weights by need; predictability high
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
