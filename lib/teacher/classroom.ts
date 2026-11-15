// Class-level, anonymous learning data and class settings. Server memory for the demo.
//
// Privacy by design: no names, no session ids, only counts per experiment. Any experiment with
// fewer than MIN_GROUP responses is hidden from the teacher, so nobody can be singled out.

import type { Direction } from "@/lib/sim/spec";

export const MIN_GROUP = 5;

export type ClassSettings = { requireApproval: boolean };
const settings: ClassSettings = { requireApproval: false };
export const getSettings = (): ClassSettings => ({ ...settings });
export function updateSettings(patch: Partial<ClassSettings>): ClassSettings {
  if (typeof patch.requireApproval === "boolean") settings.requireApproval = patch.requireApproval;
  return getSettings();
}

type SimStats = {
  simId: string;
  title: string;
  metric: string;
  answer: Direction;
  misconception?: string;
  guesses: Record<Direction, number>;
  ideas: { covered: number; possible: number; explanations: number };
  sample: boolean;
};
const stats = new Map<string, SimStats>();

export type PredictionEvent = { simId: string; title: string; metric: string; guess: Direction; answer: Direction; misconception?: string };

export function recordPrediction(e: PredictionEvent, sample = false) {
  const s = stats.get(e.simId) ?? {
    simId: e.simId,
    title: e.title,
    metric: e.metric,
    answer: e.answer,
    misconception: e.misconception,
    guesses: { up: 0, down: 0, same: 0 },
    ideas: { covered: 0, possible: 0, explanations: 0 },
    sample,
  };
  s.guesses[e.guess] += 1;
  stats.set(e.simId, s);
}

export function recordExplanation(simId: string, covered: number, possible: number) {
  const s = stats.get(simId);
  if (!s || possible <= 0) return;
  s.ideas.covered += Math.max(0, Math.min(covered, possible));
  s.ideas.possible += possible;
  s.ideas.explanations += 1;
}

export type ClassInsight = {
  simId: string;
  title: string;
  metric: string;
  answer: Direction;
  misconception?: string;
  responses: number;
  correctRate: number;
  guesses: Record<Direction, number>;
  /** The most common wrong guess and its share of the class. */
  topWrong: { guess: Direction; share: number } | null;
  ideaCoverage: number | null;
  sample: boolean;
};

/** Insights for the teacher, most misunderstood first. Small groups are withheld. */
export function classInsights(): { insights: ClassInsight[]; hidden: number } {
  const all = [...stats.values()];
  const shown = all.filter((s) => total(s) >= MIN_GROUP);
  const insights = shown
    .map((s): ClassInsight => {
      const n = total(s);
      const wrong = (Object.keys(s.guesses) as Direction[]).filter((g) => g !== s.answer).sort((a, b) => s.guesses[b] - s.guesses[a])[0];
      return {
        simId: s.simId,
        title: s.title,
        metric: s.metric,
        answer: s.answer,
        misconception: s.misconception,
        responses: n,
        correctRate: s.guesses[s.answer] / n,
        guesses: { ...s.guesses },
        topWrong: wrong && s.guesses[wrong] > 0 ? { guess: wrong, share: s.guesses[wrong] / n } : null,
        ideaCoverage: s.ideas.possible ? s.ideas.covered / s.ideas.possible : null,
        sample: s.sample,
      };
    })
    .sort((a, b) => a.correctRate - b.correctRate);
  return { insights, hidden: all.length - shown.length };
}

const total = (s: SimStats) => s.guesses.up + s.guesses.down + s.guesses.same;

/** Clears sample data only (real responses are kept). */
export function clearSample() {
  for (const [k, s] of stats) if (s.sample) stats.delete(k);
}

/** For tests. */
export function resetClassroom() {
  stats.clear();
  settings.requireApproval = false;
}
