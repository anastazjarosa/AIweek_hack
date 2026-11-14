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

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui-style components
(`components/ui`), lucide-react, Framer Motion. Lexend font. Motion respects
`prefers-reduced-motion`.

## Where things are

- `lib/data.ts`: all mock data, including the heart-failure lecture written once and
  rendered four ways.
- `components/lecture/`: the four lecture renderings.
- `DESIGN.md`: the design plan (story, palette tokens, motion storyboard).
