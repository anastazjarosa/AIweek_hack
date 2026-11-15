import { beforeEach, describe, expect, it } from "vitest";
import { findSim } from "@/lib/sim/library";
import { checkSpec, predictionOutcome } from "@/lib/sim/spec";
import { classInsights, clearSample, getSettings, MIN_GROUP, recordExplanation, recordPrediction, resetClassroom, updateSettings } from "@/lib/teacher/classroom";
import { sampleDrafts, seedSampleClass } from "@/lib/teacher/sample";
import { applyEdits } from "@/lib/teacher/store";

beforeEach(resetClassroom);

const predict = (simId: string, guess: "up" | "down" | "same", n: number, answer: "up" | "down" | "same" = "same") => {
  for (let i = 0; i < n; i++) recordPrediction({ simId, title: simId, metric: "Time to land", guess, answer });
};

describe("class insights", () => {
  it("hides any experiment with fewer than MIN_GROUP responses", () => {
    predict("small", "down", MIN_GROUP - 1);
    expect(classInsights()).toEqual({ insights: [], hidden: 1 });
    predict("small", "same", 1);
    expect(classInsights().insights).toHaveLength(1);
  });

  it("puts the most misunderstood first and names the top wrong guess", () => {
    predict("easy", "same", 9);
    predict("easy", "down", 1);
    predict("hard", "down", 7);
    predict("hard", "same", 3);
    const { insights } = classInsights();
    expect(insights.map((i) => i.simId)).toEqual(["hard", "easy"]);
    expect(insights[0]).toMatchObject({ responses: 10, correctRate: 0.3, topWrong: { guess: "down", share: 0.7 } });
  });

  it("averages explanation coverage", () => {
    predict("x", "same", 5);
    recordExplanation("x", 1, 3);
    recordExplanation("x", 3, 3);
    expect(classInsights().insights[0].ideaCoverage).toBeCloseTo(4 / 6);
  });

  it("stores no identity: only counts", () => {
    predict("x", "same", 5);
    expect(Object.keys(classInsights().insights[0]).sort()).not.toContain("session");
  });
});

describe("sample class", () => {
  it("loads realistic misconceptions, keeps one group hidden, and clears cleanly", () => {
    seedSampleClass();
    const { insights, hidden } = classInsights();
    expect(hidden).toBe(1);
    const heavy = insights.find((i) => i.simId === "heavier-falls-faster")!;
    expect(heavy).toMatchObject({ responses: 28, answer: "same", topWrong: { guess: "down" } });
    expect(Math.round(heavy.topWrong!.share * 100)).toBe(64);
    predict("real-one", "same", 5);
    clearSample();
    expect(classInsights().insights.map((i) => i.simId)).toEqual(["real-one"]);
  });
});

describe("settings and review edits", () => {
  it("toggles approval before students see AI experiments", () => {
    expect(getSettings().requireApproval).toBe(false);
    expect(updateSettings({ requireApproval: true }).requireApproval).toBe(true);
  });

  it("sample drafts pass the spec checks", () => {
    expect(sampleDrafts().map((d) => d.spec.id)).toEqual(["hammer-and-feather-moon", "warm-yeast-dough"]);
  });

  it("teacher edits change wording only and are re-checked", () => {
    const spec = findSim("heavier-falls-faster")!;
    const edited = checkSpec(applyEdits(spec, { title: "Bowling ball vs football", predictionPrompt: "Which lands first?" }));
    expect(edited.ok).toBe(true);
    if (edited.ok) {
      expect(edited.spec.title).toBe("Bowling ball vs football");
      expect(edited.spec.prediction.param).toBe(spec.prediction.param);
      expect(predictionOutcome(edited.spec)?.answer).toBe("same");
    }
    expect(checkSpec(applyEdits(spec, { title: "" })).ok).toBe(false);
  });
});
