# Decisions

## Active decisions

- [arch] Front-end-only demo with all data in `lib/data.ts` (2026-11-14; superseded for the Simulation Lab by the agent decision below)
- [arch] Lecture written once, rendered in four layouts (2026-11-14)
- [arch] Client state in small `useSyncExternalStore` stores, persisted to localStorage (2026-11-14)
- [arch] Design foundations: Lexend, warm orange canvas + orange fills with dark text + deep orange text tokens, light mode only (2026-11-14, palette changed twice same day)
- Pip study buddy reads the screen-time session read-only; wardrobe lives in the profile store, not MongoDB (2026-11-14)
- [arch] Screen-time rules in one JSON file with a pure, tested engine (2026-11-14)
- [arch] Four need dimensions (0-4 scores) replace condition labels everywhere (2026-11-14)
- [arch] Demo module loaded from one JSON seed: BIOL0104 History of Life only (2026-11-14)
- [arch] Screen-time session log kept client-side; `/summary` stands in for the API (2026-11-14)
- [arch] Break planner is a deterministic function, not an AI agent (2026-11-14)
- [arch] Simulations are specs over tested templates; the engine decides prediction answers (2026-11-14)
- [arch] Simulation agent: Claude writes specs via structured outputs, checked and retried; offline fallback always available (2026-11-14)
- [arch] MCP server over stdio exposes the same simulation functions; specs travel in share links, no database (2026-11-14)
- [arch] Learning profile computed from a browser-only event log; every finding shows its evidence; suggestions apply only when the student accepts (2026-11-14)
- [arch] Planner is a deterministic function of exams, profile and habit; procrastination coach is the full one, the others are tips (2026-11-14)
- [arch] Consent gate (age band, guardian confirmation under 18) and a privacy page with export and delete; all data browser-only (2026-11-14)
- Demo clock runs 20× by default (2026-11-14)
- Product renamed Mosaic; logo is a four-tile pinwheel (see DESIGN.md) (2026-11-14)
- SimMind plan work continues on `feat/simmind` (branched from `feat/mosaic-demo` at the Simulation Lab commit); `feat/mosaic-demo` is left to its owner (2026-11-14)

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
(audio-first, pale blue page, terms), Structured (fixed numbered layout, interest examples).
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
**Decision:** Lexend only; tokens in `app/globals.css`. Soft orange canvas `#FFE8D6` with white
cards, ink `#2B2B2B` (12:1 on canvas). Orange `--brand` `#E07A2E` fills buttons, selected pills and
progress rings with dark `--brand-ink` text (4.7:1). Deeper orange `--accent` `#9A4710` carries text,
links, numbers and the focus ring (5.4:1 on canvas), because `#E07A2E` as text is only 3:1 on white.
Wrong answers moved from clay to berry red `#B42318` so they never read as the accent. Calm theme keeps
the palette with softer fills. Logo tiles are orange tints around a matcha tile. Light mode only.
Every page and Pip state audited at WCAG AA in both themes (2026-11-14).
**Why:** Owner asked for a warm orange theme. Splitting fill and text oranges keeps it warm without
failing contrast.
**Instead of:** Baby blue (replaced 2026-11-14); warm stone + deep pine (first version); one orange for
fills and text (fails AA).
**To undo:** Change tokens in one file. Rethink if a brand identity is commissioned.
**By:** agent

### Pip study buddy is a read-only observer
**Decision:** `components/pip/pip-buddy.tsx` watches session updates and reacts only to transitions
(block start, break, return), the first idle event of a block or a return from another tab (urge),
and struggle suggestions. It never calls session actions. Rules and lines live in `lib/pip.ts`
(tested). Outfit unlocks, colour and outfit are saved with the profile in localStorage.
**Why:** The brief asked not to change screen-time logic. The brief also said MongoDB, but this demo
has no backend (see the front-end-only decision); the profile store is where a user document would go.
**Instead of:** New session events; a database for one demo feature.
**To undo:** Under an hour to remove (one mount in `app-shell.tsx`). Move `pip` with the profile when a
backend arrives.
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

### [arch] Simulations are specs over tested templates
**Decision:** `lib/sim/templates.ts` holds six models (projectile, free fall with drag, spring,
Arrhenius reaction rate, logistic growth, Lotka–Volterra), each unit tested against textbook
formulas. A simulation is a JSON spec (`lib/sim/spec.ts`, zod schema plus template checks): title,
intro, which sliders show and their ranges, the prediction ("change X from a to b: does metric Y go
up, down or stay the same?"), explanation and key ideas. The correct answer is never stored in the
spec: `predictionOutcome` runs both conditions and compares them (within 5% counts as the same).
**Why:** The AI agent (next part) will write specs, not code. A spec can't break the renderer or
carry a wrong answer key, and stage behaviour stays predictable.
**Instead of:** Hand-building each lab like the moth lab, or letting a model generate simulation code.
**To undo:** Cheap; specs are data. Rethink if a topic needs a model none of the templates cover
(add a template).
**By:** agent

### [arch] Simulation agent
**Decision:** `/api/sim/generate` sends the student's question to `claude-opus-5-5` (effort
medium) with a system prompt built from the template registry, and gets a spec back through
structured outputs (`lib/sim/ai-spec.ts`: sliders as a list and nulls, because structured outputs
can't express maps or number limits). `designSim` (`lib/ai/sim-agent.ts`) converts it, runs
`checkSpec`, and compares the agent's `expectedAnswer` with the engine's outcome; any problem goes
back to the model with the previous answer, up to 3 attempts. `/api/sim/feedback` (effort low)
returns which key ideas the student's explanation covers, a misconception flag and 2-3 sentences of
feedback; never a mark. Both routes: server-side refusal fallbacks (`fallbacks: "default"`),
prompt caching on the fixed system prompt, input limits, an in-memory rate limit, and the
no-diagnosis guardrail in every prompt. Generated specs are cached in memory by question.
**Why:** The agent picks and frames; tested code computes. A spec can't break the page, and the
explanation can't contradict the graph. The offline path (`closestSim` word match, self-check)
runs when there's no key, `MOSAIC_AI=off`, or any API error, so the demo can't get stuck.
**Instead of:** Letting the model write simulation code or state the answer; a separate MCP server
first (Part 3 will expose the same functions as MCP tools).
**To undo:** Delete `app/api/sim` and the ask box; the library still works. Rethink when a real
backend stores generated specs per student (the in-memory cache is per server instance).
**By:** agent

### [arch] MCP server and share links
**Decision:** `mcp/server.ts` (stdio, `@modelcontextprotocol/sdk`, run with `tsx`) registers four
tools from `lib/mcp/tools.ts`: `list_simulations`, `create_simulation`, `run_simulation`,
`check_prediction`. They call the same engine and `designSim` as the app. Experiments are returned
with an `open_url` whose query string carries the spec (`lib/sim/share.ts`, base64url JSON);
`/lab/s` decodes and `checkSpec`s it.
**Why:** "The agent builds a simulation through MCP" is real: any MCP client can build, run and
check experiments, and hand the student a link that opens in the app, with no database.
**Instead of:** An HTTP MCP endpoint inside Next (more moving parts for a demo), or storing specs
server-side.
**To undo:** Delete `mcp/` and `lib/mcp/`. Rethink when specs need ids that outlive a link (a
database), or when a remote MCP endpoint is needed (Streamable HTTP transport).
**By:** agent

### [arch] Learning profile from behaviour
**Decision:** `lib/learner/events.ts` logs what the student does (predictions, experiment runs,
explanations, quiz answers, reading time per section, audio replays, focus blocks) to
localStorage, capped at 600 events. `computeProfile` (`lib/learner/profile.ts`) turns it into
signals (focus span, what they use, depth, pace, practice trend), topic stats and weak topics,
each with an evidence sentence and a confidence level. Suggested changes can carry need-score
changes; they apply only on **Use this**. Onboarding stays as an optional starting point.
**Why:** The brief: watch behaviour instead of asking students to label themselves, and adapt to
what works rather than fixed "learning styles". Evidence makes it contestable; no label words
appear (e2e checks).
**Instead of:** Inferring from the self-rating only, or switching layouts automatically.
**To undo:** Remove the `logEvent` calls; the rest of the app doesn't depend on them. Rethink when
events go to a backend (consent and retention rules first).
**By:** agent

### [arch] Study planner and habit coach
**Decision:** `buildPlan` (`lib/planner/plan.ts`) plans each day to the last exam (max 28 days):
daily minutes split into blocks sized from the measured focus span (10-25 min, 15 for the
distraction coach); topics compete by urgency (1/sqrt(days left)) and weakness (1 + 2 × miss rate)
through a deterministic credit round robin; review within 2 days of an exam, practice for weak
topics, a 10-minute warm-up on exam day. `detectHabits` suggests a coach from behaviour (gap of 2+
days, half of focus blocks ended early, experiments re-run 6+ times). The procrastination coach is
the full one: a concrete 2-minute first step with a timer. `weeklyCheckIn` compares this week with
last week.
**Why:** The brief's first version: exam planner with a calendar and one habit coach. Pure
functions keep it testable and identical every run.
**Instead of:** An LLM writing the plan (non-deterministic, harder to trust on stage).
**To undo:** Delete `/planner` and `lib/planner`. Rethink for real calendars (iCal export) and
reminders (needs notifications and a backend).
**By:** agent

### [arch] Consent and privacy
**Decision:** `components/consent-gate.tsx` blocks app pages (not `/privacy`) until the student
picks an age band; under 18 needs a "parent or guardian agrees" confirmation. It says in plain words
what's kept (this browser only), what goes to Anthropic (the lab question and explanation text,
never the name or profile) and that Mosaic never diagnoses. `/privacy` lists every stored key
(`lib/privacy.ts`), downloads them as JSON and deletes all `mosaic-` keys. e2e starts from a
pre-consented state (`e2e/consented-state.json`); `e2e/privacy.spec.ts` tests the gate.
**Why:** Users are under 18; the brief requires parental consent and strong data privacy.
**Instead of:** Collecting a parent's email (more personal data for a demo).
**To undo:** Remove `<ConsentGate />` from the app shell. Rethink for a school rollout: signed
consent collected by the school, a data processing agreement with the AI provider, retention rules.
**By:** agent

### Demo clock runs 20× by default
A 10-minute block takes 30 seconds, a 5-minute break 15 seconds; idle is 6 real seconds in demo
mode (90 s at real time). The setup dialog can switch to real time. Tune in `demo` in the
rules file.

### Block content mapping
Block N studies section N of the lecture (wrapping after the last section). Good enough for the demo; a real
build would track what the student actually viewed.
