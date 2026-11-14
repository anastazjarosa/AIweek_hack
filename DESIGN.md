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
  | `--canvas` | `#FFE8D6` | soft orange page |
  | `--surface` | `#FFFFFF` | cards and reading panels |
  | `--ink` | `#2B2B2B` | body text (12:1 on canvas) |
  | `--muted` | `#5E4A3C` | secondary text (7:1 on canvas) |
  | `--line` | `#F0CDB2` | rules, borders |
  | `--brand` | `#E07A2E` | orange fills: primary buttons, selected pills, progress rings, CTA band |
  | `--brand-hover` | `#EB8C46` | hover on brand fills |
  | `--brand-ink` | `#2B2B2B` | text on orange (4.7:1) |
  | `--accent` | `#9A4710` | deep orange: links, numbers, labels, focus ring (5.4:1 on canvas) |
  | `--accent-soft` | `#FDDCC2` | selected backgrounds |
  | `--paper` | `#FFF4EA` | Listen layout reading surface |
  | `--mark` | `#FFE08A` | key-term highlight |
  | `--clay` | `#B42318` | wrong-answer feedback only |
  | `--night` / `--glow` | `#1E1813` / `#F7B27A` | walk-and-listen dark break, light accent on it |
  Calm theme: same palette, softer fills (`--brand` `#F2A66B`), no CSS animation. All text passes
  WCAG AA in both themes (audited every page and Pip state). Light mode only.
- **Name and mark.** Mosaic: many small pieces arranged into one picture, like four needs in
  any mix. The mark is four tiles in orange tints, deep to pale (one per need), around a small matcha tile (the
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
  | Moth lab run | the experiment happening | curve draws left to right, 600ms ease-out | Run | line appears at once |
| Skim suggestion | the app noticed how you read | 200ms rise and fade, light card (break cards are dark) | skim score ≥ 0.7 | instant |
| Break suggestion / warning toast | the app noticed, gently | 200ms rise and fade | struggle trigger / warning point | instant |
| Pip block start | a study buddy settles in | small hop (squash and stretch, 0.7s) | new focus block | face only |
| Pip during focus | someone studying beside you | slow breathing; high focus: still, reading | focus phase | still |
| Pip break | step away from the screen | stretch, then points off-screen, then rests | break starts | sleepy face |
| Pip return | welcome back | wave (4 swings) | break ends | joyful face |
| Pip urge | names the pull, offers a plan | Pop appears beside Pip, two bubbles | first idle / tab return | Pop appears without movement |
| Outfit reveal | a reward for a full off-screen break | box wiggles; Pip pops out | 2.2s after return | box opens instantly |
- **References.** Technique only: Linear's restraint in type sizes and 1px rules; Headspace's
  warm, soft surfaces. No layouts or copy taken.

## Pip, the study buddy

- **Character.** An original matcha-green bean (peach, lavender also) with stubby arms, big dot eyes
  and a sprout. Angel side "Pip" has a small halo and soft glow; cheeky side "Pop" has tiny horns, a
  grin and a tail. Inline SVG in `components/pip/pip-figure.tsx`; no humanoid or baby figure.
- **Restraint.** Fixed bottom-left. Moves only at transitions. High structure halves movement; high
  focus keeps it still and reading during blocks; reduced motion or calm theme means no movement,
  face only. Bubbles only at transitions, urges, struggle, or when tapped; they fade after 5-9 s.
