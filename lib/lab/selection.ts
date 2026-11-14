// Moth lab: a simple, illustrative natural-selection model for the predict-run-explain simulation.
// It shows the shape of the peppered moth story, not real data. Pure functions, unit tested.
//
// Each generation, birds eat moths that stand out against the bark. A moth's survival is
// 1 − hunting × contrast, where contrast is how different its colour is from the bark (0-1).
// Colour is inherited, so the share of dark moths next generation is weighted by survival.
// With sooty bark (90% dark) this takes about 45 generations to go from 2% to 98% dark moths,
// close to the 1848–1895 change recorded around Manchester.

export const GENERATIONS = 50;
/** Share of dark moths at the start: rare, as when they were first recorded. */
export const START_DARK = 0.02;
const HUNTING = 0.2;

export type Run = {
  /** How dark the bark is, 0 (pale, lichen-covered) to 1 (soot-black). */
  bark: number;
  birds: boolean;
  /** Share of dark moths in each generation, 0-1, from generation 0 to GENERATIONS. */
  curve: number[];
  end: number;
};

export function simulate(bark: number, birds: boolean): Run {
  const b = Math.max(0, Math.min(1, bark));
  const hunting = birds ? HUNTING : 0;
  const darkSurvives = 1 - hunting * (1 - b);
  const paleSurvives = 1 - hunting * b;
  const curve = [START_DARK];
  for (let g = 1; g <= GENERATIONS; g++) {
    const p = curve[g - 1];
    curve.push((p * darkSurvives) / (p * darkSurvives + (1 - p) * paleSurvives));
  }
  return { bark: b, birds, curve, end: curve[GENERATIONS] };
}

// ---------- Explain step: a transparent word check, not a mark ----------

export const explainIdeas = [
  {
    id: "survival",
    label: "Dark moths were harder for birds to spot on dark bark, so more survived",
    pattern: /camoufla|\bhid|\bblend|\bspot|\bsee|\bnotic|\beat|surviv|predat|\bbird|stand out/i,
  },
  {
    id: "inherit",
    label: "Survivors passed their colour on to their young",
    pattern: /\bpass|offspring|\byoung|\bbab(y|ies)|inherit|\bgen(e|es|etic)\b|\bbreed|reproduc|next generation|children|parent/i,
  },
] as const;

export const modelExplanation =
  "On soot-dark bark, birds spot pale moths more easily, so dark moths survive and breed more. Colour is inherited, so each generation has a few more dark moths. Over many generations, dark becomes common. No moth chose to change: the birds and the bark did the selecting.";

export function explainHits(text: string): Record<(typeof explainIdeas)[number]["id"], boolean> {
  return {
    survival: explainIdeas[0].pattern.test(text),
    inherit: explainIdeas[1].pattern.test(text),
  };
}
