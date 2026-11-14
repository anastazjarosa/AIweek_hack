// Spacing lab: a simple, illustrative memory model for the predict-run-explain simulation.
// It shows the shape of the spacing effect, not real data. Pure functions, unit tested.
//
// Retention after t days with stability S (days) follows a power-law forgetting curve,
// R = 1 / (1 + t / (9S)), as used in open spaced-repetition schedulers (FSRS).
// Each review raises stability most when some, but not all, has been forgotten
// (gain ∝ R(1 - R)), so a gap helps and cramming barely does.

export type Method = "reread" | "selftest";

export const SESSIONS = 3;
export const MAX_GAP = 6;
/** The test is always this many days after the last session, so only the gap differs. */
export const TEST_DELAY = 7;
export const MAX_DAY = MAX_GAP * (SESSIONS - 1) + TEST_DELAY;

const START_STABILITY = 0.4;
const BASE: Record<Method, number> = { reread: 0.2, selftest: 0.4 };
const GAIN: Record<Method, number> = { reread: 10, selftest: 14 };

export function retention(daysSince: number, stability: number): number {
  return 1 / (1 + daysSince / (9 * stability));
}

export type Run = {
  gap: number;
  method: Method;
  /** Day of each study session. */
  sessions: number[];
  testDay: number;
  /** Retention on the test day, 0-1. */
  atTest: number;
  /** Retention every quarter day from the first session to the test. */
  curve: { day: number; r: number }[];
};

export function simulate(gap: number, method: Method): Run {
  const g = Math.max(0, Math.min(MAX_GAP, Math.round(gap)));
  const sessions = Array.from({ length: SESSIONS }, (_, i) => i * g);
  const stability = [START_STABILITY];
  for (let i = 1; i < SESSIONS; i++) {
    const prev = stability[i - 1];
    const r = retention(sessions[i] - sessions[i - 1], prev);
    stability.push(prev * (1 + BASE[method] + GAIN[method] * r * (1 - r)));
  }
  const at = (day: number) => {
    let k = 0;
    while (k + 1 < SESSIONS && sessions[k + 1] <= day) k++;
    return retention(day - sessions[k], stability[k]);
  };
  const testDay = sessions[SESSIONS - 1] + TEST_DELAY;
  const curve: Run["curve"] = [];
  for (let d = 0; d <= testDay + 1e-9; d += 0.25) curve.push({ day: d, r: at(d) });
  return { gap: g, method, sessions, testDay, atTest: at(testDay), curve };
}

// ---------- Explain step: a transparent word check, not a mark ----------

export const explainIdeas = [
  {
    id: "forgetting",
    label: "Some forgetting happens in the gap between sessions",
    pattern: /forg[eo]t|fade|gap|time between|break|drop|slip/i,
  },
  {
    id: "effort",
    label: "Recalling after a gap takes effort, so the memory lasts longer",
    pattern: /effort|hard|struggl|work|strong|last|longer|stick|stabl|deeper/i,
  },
] as const;

export const modelExplanation =
  "A gap lets some forgetting happen. Pulling the idea back then takes more effort, and that effort makes the memory last longer. Cramming reviews something you still remember, so it adds little.";

export function explainHits(text: string): Record<(typeof explainIdeas)[number]["id"], boolean> {
  return {
    forgetting: explainIdeas[0].pattern.test(text),
    effort: explainIdeas[1].pattern.test(text),
  };
}
