# Neura

Hackathon demo: a study app that turns lecture slides and textbooks into notes, flashcards and
quizzes shaped around how a learner's brain works (ADHD, dyslexia, autism, or just strong
preferences).

Front end only. No auth, no backend, no AI calls: everything comes from `lib/data.ts`, and
loading states are faked.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Demo click path (about 3 minutes)

1. **Landing** (`/`): in the hero, click ADHD → Dyslexia → Autism → Standard. The same slide
   reshapes live. Then **Get started**.
2. **Sign in** (`/signin`): click **Sign in** or **Continue with Google**. No validation.
3. **Onboarding** (`/onboarding`): **Take a 2-minute check**, answer the 6 questions, and see
   "Your study profile". Or pick profiles directly with "I know what works for me".
4. **Dashboard** (`/dashboard`): today's plan, streak and progress. Use the **Viewing as**
   switcher at the top.
5. **Upload**: drop any file on "Add course material" (or click **Choose a file**). Watch the
   3 processing steps, then a new lecture card appears.
6. **Lecture** (`/lecture/heart-failure`): open "Heart failure". Switch profiles at the top:
   - **ADHD**: 5-minute sprint timer, one concept per card, quick check with instant feedback,
     progress bar, a small celebration at the end, "missed yesterday" banner.
   - **Dyslexia**: cream page, larger text and spacing, short sentences, a play button on
     every section, highlighted key terms with plain-English definitions on hover.
   - **Autism**: fixed numbered layout, "What you'll learn" and "What's next", literal wording,
     and an analogy using the chosen interest (Trains or Football).
   - **Standard**: notes, flashcards and quiz tabs.

The chosen profile is kept in `localStorage`, so a refresh mid-pitch keeps your place.

## Adaptive screen time

Study sessions run in focus blocks with breaks, off-screen tasks and a recall check, all shaped
by the learner's needs. Rules live in `lib/screentime/screentime_rules.json`; decisions are in
`DECISIONS.md`.

### Test it with the demo profile (focus high, predictability high)

1. Onboarding → **I know what works for me** → pick **ADHD** and **Autism** → Continue.
   (Or skip this and use the **Demo profile** toggle in step 3.)
2. Open the Heart failure lecture.
3. Click **Start focus session** (top bar). Check: needs show Focus high, Predictability high;
   10-minute blocks; heads-up at 5 min, 2 min and 30 s; the full schedule is shown. Keep
   **Demo 20×** and click **Start 10-minute block**.
4. The ring bottom-right counts down (30 real seconds). Toasts appear at "5 minutes" and
   "2 minutes" before the break.
5. Struggle triggers (any one): click **I'm overloaded**; or answer 3 quiz questions wrong
   (Standard → Quiz, or ADHD cards); or stop touching the mouse for 6 s twice; or press play
   on the same Dyslexia section 3 times. Choose **Snooze 3 min** once, then **Take a break**.
6. Break overlay: the task is **Move and recall**. Switch to **Walk and listen** to see the
   screen dim. Predictability is high, so later breaks keep the task you chose.
7. **I'm back** → 2-question recall quiz. Get one wrong: the next block becomes 5 minutes and
   simpler wording turns on (Standard notes switch to short sentences).
8. **End session** → **Screen time** in the sidebar: screen vs off-screen time, blocks, breaks,
   trigger reasons and the session log.
9. Daily cap: pick a 30-minute limit at setup; when reached the session ends with an
   off-screen summary task.

Run the rule tests with `npm test`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui-style components
(`components/ui`), lucide-react, Framer Motion. Lexend font. Motion respects
`prefers-reduced-motion`.

## Where things are

- `lib/data.ts`: all mock data, including the heart-failure lecture written once and
  rendered four ways.
- `components/lecture/`: the four lecture renderings.
- `lib/screentime/`: screen-time rules (JSON), engine and tests, break planner, session store.
- `components/session/`: focus ring, setup dialog, break overlay, recall screen.
- `DESIGN.md`: the design plan (story, palette tokens, motion storyboard).
- `DECISIONS.md`: what was decided and why.
