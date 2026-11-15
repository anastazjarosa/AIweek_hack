// Clearly labelled sample data for demos and pitches: a class of 28 and two AI-drafted
// experiments awaiting review. Everything is built from the real library and passes checkSpec.

import { findSim } from "@/lib/sim/library";
import { checkSpec, predictionOutcome, templateOf, type Direction, type SimSpec } from "@/lib/sim/spec";
import { recordExplanation, recordPrediction } from "@/lib/teacher/classroom";

// Guess counts per experiment (up, down, same). The last one stays under the privacy threshold.
const CLASS: [string, Record<Direction, number>, number][] = [
  ["heavier-falls-faster", { up: 2, down: 18, same: 8 }, 0.42],
  ["best-throwing-angle", { up: 17, down: 9, same: 2 }, 0.55],
  ["spring-friction", { up: 15, down: 4, same: 9 }, 0.48],
  ["catalyst", { up: 20, down: 2, same: 6 }, 0.71],
  ["hotter-reacts-faster", { up: 3, down: 22, same: 3 }, 0.78],
  ["foxes-and-rabbits", { up: 16, down: 4, same: 8 }, 0.6],
  ["throwing-on-the-moon", { up: 2, down: 1, same: 0 }, 0.5],
];

export function seedSampleClass() {
  for (const [id, counts, coverage] of CLASS) {
    const spec = findSim(id);
    if (!spec) continue;
    const o = predictionOutcome(spec)!;
    const metric = templateOf(spec).metrics.find((m) => m.id === spec.prediction.metric)!.label;
    for (const guess of ["up", "down", "same"] as Direction[]) {
      for (let i = 0; i < counts[guess]; i++) recordPrediction({ simId: id, title: spec.title, metric, guess, answer: o.answer, misconception: spec.misconception }, true);
    }
    const n = counts.up + counts.down + counts.same;
    for (let i = 0; i < Math.round(n * 0.6); i++) recordExplanation(id, Math.round(coverage * spec.keyIdeas.length), spec.keyIdeas.length);
  }
}

const AI_DRAFTS: { question: string; spec: unknown }[] = [
  {
    question: "Would a hammer and a feather land together on the Moon?",
    spec: {
      id: "hammer-and-feather-moon",
      template: "freefall",
      title: "Hammer and feather on the Moon",
      question: "Would a hammer and a feather land together on the Moon?",
      intro: "On the Moon there is no air. Drop a light object and a heavy one from 2 m and time the fall.",
      minutes: 2,
      params: { drag: { default: 0, hidden: true }, gravity: { default: 1.6, hidden: true }, height: { default: 2 } },
      prediction: { prompt: "The object becomes 50 times heavier (0.1 kg to 5 kg). What happens to the time it takes to land?", param: "mass", from: 0.1, to: 5, metric: "fallTime" },
      explanation:
        "With no air, both land at the same moment. Gravity pulls harder on the heavier object, but it is also harder to speed up by the same amount, so every object falls with the same acceleration: about 1.6 m/s² on the Moon.",
      keyIdeas: ["There is no air on the Moon", "Gravity pulls harder on heavier things", "Heavier things are harder to speed up, so acceleration is the same"],
      misconception: "A hammer always falls faster than a feather.",
      realWorld: "Astronaut David Scott tried exactly this on Apollo 15 in 1971.",
    },
  },
  {
    question: "Why does bread dough rise faster somewhere warm?",
    spec: {
      id: "warm-yeast-dough",
      template: "population",
      title: "Yeast in warm dough",
      question: "Why does bread dough rise faster somewhere warm?",
      intro: "Yeast cells divide and make gas that lifts the dough. Compare yeast that divides slowly with yeast that divides faster.",
      minutes: 2,
      params: {},
      prediction: { prompt: "The yeast divides faster (growth rate 0.4 to 0.9 per hour). What happens to the time to reach half the maximum?", param: "rate", from: 0.4, to: 0.9, metric: "timeToHalf" },
      explanation:
        "Faster division means the population doubles more often, so it reaches half its maximum much sooner. Warmth speeds up the chemical reactions inside yeast cells, which is why dough rises faster in a warm place.",
      keyIdeas: ["Each yeast cell divides into two", "Faster division means more doublings per hour", "Warmth speeds up the reactions inside cells"],
      realWorld: "Bakers prove dough somewhere warm, and slow it down in the fridge overnight.",
    },
  },
];

/** The sample AI drafts, validated like any AI output. */
export function sampleDrafts(): { question: string; spec: SimSpec }[] {
  return AI_DRAFTS.map((d) => {
    const c = checkSpec(d.spec);
    if (!c.ok) throw new Error(`Invalid sample draft: ${c.errors.join("; ")}`);
    return { question: d.question, spec: c.spec };
  });
}
