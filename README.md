# Mosaic

Hackathon demo: a study app that turns lecture slides and textbooks into notes, flashcards,
quizzes and concept maps shaped around four learning needs: **Focus**, **Processing**,
**Planning** and **Structure**. Any mix is allowed and adaptations stack. No labels.

Front end only. No auth, no backend, no AI calls. The demo module lives in
`lib/seed/psyc0101-lecture5.json`; other mock data is in `lib/data.ts`. Loading states are faked.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Run tests with `npm test`.

## Demo click path (about 3 minutes)

1. **Landing** (`/`): in the hero, click Sprints → Listen → Structured → Standard. The same slide
   reshapes live. Then **Get started**.
2. **Sign in** (`/signin`): click **Sign in** or **Continue with Google**. No validation.
3. **Onboarding** (`/onboarding`): **Rate 8 statements** on a 0–4 scale ("Not like me" to
   "Very like me"). Two statements per need are averaged. Or **Set it myself** for sliders.
4. **Dashboard** (`/dashboard`): your four need scores and live difficulty signals.
5. **Upload**: drop any file on "Add course material" and watch the 3 processing steps.
6. **Lecture** (PSYC0101 Lecture 5, "How memory works, and why we forget"): switch **Layout**:
   - **Sprints**: timed cards, one idea each, a quick check with instant feedback.
   - **Listen**: cream page, larger text, play button per section, key terms explained.
   - **Structured**: fixed numbered layout, what you'll learn and what's next, interest examples.
   - **Standard**: key ideas, notes, flashcards, quiz, concept map, references.
   - **Skim to see it adapt**: in Standard → Notes, scroll quickly past 3 or more sections. A card
     says what it noticed ("about 3 s on sections that take about 24 s to read") and offers
     **Try Sprints** or **No thanks**. It never switches on its own.
7. **Spacing lab** (`/lecture/memory/lab`, "Try it" card at the top of every layout): predict
   which study plan remembers more, run it (days between sessions, re-read or self-test), then
   explain why. Set 3 days apart: 84% a week later vs 43% for one evening.
8. **How I like to learn** (`/preferences`): edit the four sliders, format (audio/visual/text),
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

- `lib/seed/psyc0101-lecture5.json`: the demo module (slides, notes, quiz, map, tasks, references).
- `lib/dimensions.ts`: the four needs, levels, onboarding statements, layout choice, personas.
- `lib/data.ts`: other mock data and the adapter from the seed to the lecture views.
- `components/lecture/`: the four lecture layouts.
- `lib/lab/spacing.ts`: the spacing lab's illustrative memory model and explanation word check.
- `lib/adapt.ts`: the skim signal (reading time vs text length) behind the Sprints suggestion.
- `lib/screentime/`: screen-time rules (JSON), engine and tests, break planner, session store.
- `components/session/`: focus ring, setup dialog, break overlay, recall screen.
- `DESIGN.md`: the design plan. `DECISIONS.md`: what was decided and why.
