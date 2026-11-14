# Mosaic design plan

## Story

- **Audience and job.** Students who learn differently, described by four needs (focus,
  processing, planning, structure), and hackathon judges watching a 3-minute pitch. Job: believe that the *same*
  lecture can be reshaped for a brain, then click "Get started".
- **Mechanism.** One uploaded lecture becomes four layouts: sprints with
  instant checks, audio-first readable notes, predictable literal structure, or standard notes.
- **Claim.** "Study material that fits your brain."
- **Proof.** The product itself, live: one lecture concept that the visitor reshapes with
  a switch in the hero, and the full lecture view doing the same.
- **Metaphor.** None borrowed. The product is the picture: the concept card changing shape.

## Plan

- **Point of view.** Calm and steady, for a student at 11pm with three lectures they haven't
  opened. Nothing shouts; one thing at a time.
- **Bold move.** The hero is not an illustration but a working concept card with a four-way
  layout switch. Expresses "fits your brain" by letting the visitor watch it happen.
- **Type.** Lexend only: its whole reason for existing is reading ease, which is the product's
  promise. Display weight 300 with tight tracking; body 400; labels 500. Three sizes per view.
- **Palette (tokens in `app/globals.css`).**
  | Token | Value | Role |
  |---|---|---|
  | `--canvas` | `#F5F3EE` | warm stone page |
  | `--surface` | `#FFFFFF` | cards |
  | `--ink` | `#1C2321` | text |
  | `--muted` | `#5B625E` | secondary text (≈6:1 on canvas) |
  | `--line` | `#E3DFD6` | rules, borders |
  | `--accent` | `#1E6B57` | deep pine: primary action, progress, selection (<10% of page) |
  | `--accent-soft` | `#E4EFEA` | selected backgrounds |
  | `--cream` | `#FAF4E2` | Listen layout reading surface |
  | `--mark` | `#F3E2A8` | key-term highlight |
  | `--clay` | `#A9502B` | wrong-answer feedback only |
  Light mode only (a demo on a projector; dark mode not designed).
- **Name and mark.** Mosaic: many small pieces arranged into one picture, like four needs in
  any mix. The mark is four tiles in pine tints (one per need) around a small warm tile (the
  learner), in `components/logo.tsx` and `app/icon.svg`.
- **Imagery.** Product UI only (concept cards, sprint timer, audio bar). lucide icons used
  sparingly for navigation and controls, never decorative per feature.
- **Layout.** 12-column, max 1180px, left-aligned. Landing: hero (claim left, live card right)
  → four needs as ruled columns → how it works (3 real ordered steps) → CTA → footer.
- **Motion storyboard.** Global `MotionConfig reducedMotion="user"`.
  | Moment | What it shows | Technique | Trigger | Reduced motion |
  |---|---|---|---|---|
  | Layout switch (hero + lecture) | same content reshaping | crossfade + 6px rise, 220ms ease-out; selected pill slides (`layoutId`) | click switcher | instant swap |
  | Onboarding question change | progress forward | 16px slide, 200ms | answer | instant |
  | Upload processing | work happening on *your* file | steps tick in sequence, bar fills | drop/select file | steps still tick, no slide |
  | Sprint check feedback | instant feedback | colour change 150ms | answer | instant colour |
  | Sprint complete | small reward | check scales 0.8→1, ring of dots | last card done | static check |
  | Break overlay opens | you are stepping away | 400ms fade over the page | block ends / break accepted | instant |
  | Walk-and-listen dim | the screen is not for now | background fades to near-black, 700ms | task type | instant colour |
  | Spacing lab run | the experiment happening | curve draws left to right, 600ms ease-out | Run | line appears at once |
| Skim suggestion | the app noticed how you read | 200ms rise and fade, light card (break cards are dark) | skim score ≥ 0.7 | instant |
| Break suggestion / warning toast | the app noticed, gently | 200ms rise and fade | struggle trigger / warning point | instant |
- **References.** Technique only: Linear's restraint in type sizes and 1px rules; Headspace's
  warm, soft surfaces. No layouts or copy taken.
