# Mosaic

Hackathon demo: a study app that turns lecture slides and textbooks into notes, flashcards,
quizzes and concept maps shaped around four learning needs: **Focus**, **Processing**,
**Planning** and **Structure**. Any mix is allowed and adaptations stack. No labels.

No auth and no database. The Simulation Lab has two server routes that call Claude
(`/api/sim/generate`, `/api/sim/feedback`); everything else runs in the browser. The demo module
lives in `lib/seed/biol0104-history-of-life.json`; other mock data is in `lib/data.ts`. Lecture
loading states are faked.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live AI
npm run dev
```

Open http://localhost:3000. Unit tests: `npm test`. Browser tests: `npm run test:e2e`.

**AI and offline mode.** With `ANTHROPIC_API_KEY` set, "Ask for any experiment" on `/lab` has
Claude (`claude-opus-5-5`) design a new simulation and gives AI feedback on explanations. Without a
key, or with `MOSAIC_AI=off`, the app opens the closest ready-made experiment and uses a self-check
instead. API failures fall back the same way, so the demo never gets stuck.

**MCP server.** `npm run mcp` starts the Simulation Lab as an MCP server on stdio with four tools:
`list_simulations`, `create_simulation` (question → experiment, via Claude when a key is set),
`run_simulation` and `check_prediction`. Each experiment comes with an `open_url`
(`/lab/s?d=…`) that opens it in the app. Claude Code picks it up from `.mcp.json`. For Claude
Desktop, add to `claude_desktop_config.json` (use the absolute path to this folder):

```json
{
  "mcpServers": {
    "mosaic-simulation-lab": {
      "command": "npx",
      "args": ["tsx", "C:/path/to/AIweek_hack/mcp/server.ts"],
      "env": { "ANTHROPIC_API_KEY": "…", "MOSAIC_URL": "http://localhost:3000" }
    }
  }
}
```

Then ask Claude: "Build me an experiment about why heavier things don't fall faster, then check
my guess that the heavy one lands first."

## Demo click path (about 3 minutes)

The first app page asks for consent once (age band; under-18s confirm a parent or guardian
agrees). `/privacy` shows what's stored, downloads it and deletes it.


1. **Landing** (`/`): in the hero, click Sprints → Listen → Structured → Standard. The same slide
   reshapes live. Then **Set up my layout**.
2. **Sign in** (`/signin`): click **Sign in** or **Continue with Google**. No validation.
3. **Onboarding** (`/onboarding`): **Rate 8 statements** on a 0–4 scale ("Not like me" to
   "Very like me"). Two statements per need are averaged. Or **Set it myself** for sliders.
4. **Dashboard** (`/dashboard`): your four need scores and live difficulty signals.
5. **Upload**: drop any file on "Add course material" and watch the 3 processing steps.
6. **Lecture** (BIOL0104 Lecture 3, "The story of life on Earth"): switch **Layout**:
   - **Sprints**: timed cards, one idea each, a quick check with instant feedback.
   - **Listen**: pale blue page, larger text, play button per section, key terms explained.
   - **Structured**: fixed numbered layout, what you'll learn and what's next, interest examples.
   - **Standard**: key ideas, notes, flashcards, quiz, concept map, references.
   - **Skim to see it adapt**: in Standard → Notes, scroll quickly past 3 or more sections. A card
     says what it noticed ("about 3 s on sections that take about 24 s to read") and offers
     **Try Sprints** or **No thanks**. It never switches on its own.
7. **Moth lab** (`/lecture/history-of-life/lab`, "Try it" card at the top of every layout):
   predict how many peppered moths will be dark after 50 generations on sooty bark, run it
   (bark darkness, birds on or off), then explain why. Sooty bark: 2% → 99% dark. No birds: stays 2%.
   **Simulation Lab** (`/lab`, in the sidebar): 11 more experiments across physics, chemistry and
   biology, all predict → run → explain. Try "Heavy ball, light ball": guess that the heavy ball
   lands first, run 1 kg then **Set it for me** (10 kg), and both land at 2.02 s.
   **Ask for any experiment** (top of `/lab`): type "Why don't heavier things fall faster?" and the
   agent builds a new experiment. Write an explanation at the end for AI feedback.
8. **What works for me** (`/profile`): the learning profile, built from behaviour (experiments,
   quiz answers, reading speed, focus blocks). Click **Load a demo week** for a full profile:
   focus about 10 minutes, learns by doing, weak on forces, practice improving. **Use this** applies
   a suggestion; nothing changes on its own.
9. **Study planner** (`/planner`): **Load demo exams and a demo week**. The plan sizes sessions to
   the focus span and gives forces extra time; **Start with 2 minutes** is the procrastination
   coach's tiny first step; the weekly check-in shows what improved and what's next.
10. **How I like to learn** (`/preferences`): edit the four sliders, format (audio/visual/text),
   voice input and calm theme, or load a demo persona.

## How needs drive the app

- Levels: 0–1 low, 2 medium, 3–4 high.
- Lecture layout: the student's format setting wins; otherwise the highest "high" need picks
  the layout (Focus → Sprints, Processing → Listen, Structure → Structured). Ties go to the
  calmer layout (Structured, then Listen, then Sprints).
- Stacking: high Processing adds audio to the Sprints and Structured layouts; screen-time rules
  combine all four needs.

## Adaptive screen time

Focus blocks with breaks, off-screen tasks and a recall check. Rules live in
`lib/screentime/screentime_rules.json`; decisions are in `DECISIONS.md`.

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
- `DESIGN.md`: the design plan. `DECISIONS.md`: what was decided and why.
