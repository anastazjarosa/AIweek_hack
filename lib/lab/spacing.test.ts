import { describe, expect, it } from "vitest";
import { MAX_GAP, SESSIONS, TEST_DELAY, explainHits, retention, simulate } from "./spacing";

describe("retention", () => {
  it("starts at 1 and falls over time", () => {
    expect(retention(0, 1)).toBe(1);
    expect(retention(1, 1)).toBeGreaterThan(retention(5, 1));
  });
});

describe("simulate", () => {
  it("spreads sessions by the gap and tests a week after the last one", () => {
    const run = simulate(3, "reread");
    expect(run.sessions).toEqual([0, 3, 6]);
    expect(run.testDay).toBe(6 + TEST_DELAY);
    expect(run.curve.at(-1)!.day).toBeCloseTo(run.testDay);
  });

  it("clamps the gap to the slider range", () => {
    expect(simulate(-2, "reread").sessions).toEqual([0, 0, 0]);
    expect(simulate(99, "reread").sessions.at(-1)).toBe(MAX_GAP * (SESSIONS - 1));
  });

  it("shows the spacing effect: spread sessions beat cramming by a clear margin", () => {
    const crammed = simulate(0, "reread").atTest;
    const spread = simulate(3, "reread").atTest;
    expect(spread - crammed).toBeGreaterThan(0.25);
  });

  it("shows the testing effect: self-testing never does worse than re-reading", () => {
    for (let gap = 0; gap <= MAX_GAP; gap++) {
      expect(simulate(gap, "selftest").atTest).toBeGreaterThanOrEqual(simulate(gap, "reread").atTest);
    }
  });

  it("keeps every retention value between 0 and 1", () => {
    for (const r of simulate(MAX_GAP, "selftest").curve.map((p) => p.r)) {
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});

describe("explainHits", () => {
  it("finds both ideas in a good explanation", () => {
    expect(explainHits("You forget a bit in the gap, so remembering takes effort and it sticks")).toEqual({
      forgetting: true,
      effort: true,
    });
  });

  it("finds neither in an unrelated answer", () => {
    expect(explainHits("because it is better")).toEqual({ forgetting: false, effort: false });
  });
});
