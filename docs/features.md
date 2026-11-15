# Feature notes

Detailed notes on the lecture layouts, needs and focus sessions (moved from the original README).

## How needs drive the app

- Levels: 0–1 low, 2 medium, 3–4 high.
- Lecture layout: the student's format setting wins; otherwise the highest "high" need picks
  the layout (Focus → Sprints, Processing → Listen, Structure → Structured). Ties go to the
  calmer layout (Structured, then Listen, then Sprints).
- Stacking: high Processing adds audio to the Sprints and Structured layouts; screen-time rules
  combine all four needs.

## Adaptive screen time

Focus blocks with breaks, off-screen tasks and a recall check. Rules live in
`lib/screentime/screentime_rules.json`; decisions are in `docs/DECISIONS.md`.

### Test it with Persona A (high focus + high structure)

1. **How I like to learn** → Demo personas → **Persona A**. (Or the Persona A button in the
   session setup dialog.)
2. Open the lecture and click **Start focus session**. Check: Focus high, Structure high;
   10-minute blocks; heads-up at 5 min, 2 min and 30 s; the full schedule is shown. Keep
   **Demo 20×** and start.
3. The ring bottom-right counts down (30 real seconds), with heads-up toasts.
4. Struggle triggers (any one): **I'm overloaded**; 3 wrong quiz answers in a row; no mouse
   or keyboard for 6 s twice; or playing the same Listen section 3 times. Snooze once, then
   **Take a break**.
5. Break: the task is **Move and recall** (from the module's off-screen tasks). Switch to
   **Walk and listen** to see the screen dim. Later breaks keep the task you chose.
6. **I'm back** → 2-question recall quiz. Get one wrong: the next block is 5 minutes and
   simpler wording turns on.
7. **End session** → **Screen time**: screen vs off-screen time and the session log.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui-style components
(`components/ui`), lucide-react, Framer Motion, Vitest. Lexend font. Motion respects
`prefers-reduced-motion` and the calm theme.

## Where things are

- `lib/seed/biol0104-history-of-life.json`: the demo module (slides, notes, quiz, map, tasks, references).
- `lib/dimensions.ts`: the four needs, levels, onboarding statements, layout choice, personas.
- `lib/data.ts`: other mock data and the adapter from the seed to the lecture views.
- `components/lecture/`: the four lecture layouts.
- `lib/lab/selection.ts`: the moth lab's illustrative natural-selection model and explanation word check.
- `lib/sim/`: Simulation Lab. `templates.ts` holds six tested models (projectile, free fall, spring,
  reaction rate, population growth, predators and prey); `spec.ts` validates a simulation spec and
  works out the right answer to its prediction; `library.ts` holds the ready-made simulations;
  `match.ts` is the offline question matcher. `components/sim/` renders any spec.
- `lib/ai/`: the simulation agent. `prompts.ts` (built from the templates), `sim-agent.ts` (ask,
  check, retry; unit tested with a fake model), `claude.ts` (the real API calls, server only).
- `lib/learner/`: the event log (`events.ts`, browser only) and the behaviour-based profile
  (`profile.ts`: focus, format, depth, pace, practice, weak topics, suggested changes).
- `lib/planner/`: `plan.ts` (exam plan, habit detection, first steps, weekly check-in) and the
  planner store.
- `mcp/server.ts` + `lib/mcp/tools.ts`: the MCP server and its tools; `lib/sim/share.ts` builds
  the `/lab/s?d=…` links.
- `lib/adapt.ts`: the skim signal (reading time vs text length) behind the Sprints suggestion.
- `lib/screentime/`: screen-time rules (JSON), engine and tests, break planner, session store.
- `components/session/`: focus ring, setup dialog, break overlay, recall screen.
- `docs/DESIGN.md`: the design plan. `docs/DECISIONS.md`: what was decided and why.
