import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, defaultView, describeScores, levelFor, needsFromScores, personas, scoresFromAnswers, ZERO } from "./dimensions";

describe("dimensions", () => {
  it("maps 0-1 low, 2 medium, 3-4 high", () => {
    expect([0, 1, 1.5, 2, 2.5, 3, 4].map(levelFor)).toEqual(["low", "low", "medium", "medium", "high", "high", "high"]);
  });
  it("averages two statements per dimension", () => {
    expect(scoresFromAnswers([4, 2, 0, 1, 3, 3, 4, 4])).toEqual({ focus: 3, processing: 0.5, organising: 3, predictability: 4 });
  });
  it("lets any mix stack into needs", () => {
    expect(needsFromScores({ focus: 4, processing: 3, organising: 2, predictability: 4 })).toEqual({
      focus: "high",
      processing: "high",
      organising: "medium",
      predictability: "high",
    });
  });
  it("picks the calmer layout when high needs tie", () => {
    expect(defaultView({ ...ZERO, focus: 4, predictability: 4 }, DEFAULT_PREFS)).toBe("structured");
    expect(defaultView({ ...ZERO, focus: 4, processing: 4 }, DEFAULT_PREFS)).toBe("listen");
    expect(defaultView({ ...ZERO, focus: 4, predictability: 3 }, DEFAULT_PREFS)).toBe("sprints");
    expect(defaultView(ZERO, DEFAULT_PREFS)).toBe("standard");
  });
  it("lets the student's format setting win", () => {
    expect(defaultView({ ...ZERO, predictability: 4 }, { ...DEFAULT_PREFS, format: "audio" })).toBe("listen");
    expect(defaultView({ ...ZERO, processing: 4 }, { ...DEFAULT_PREFS, format: "text" })).toBe("standard");
  });
  it("names personas by their scores", () => {
    expect(describeScores({ ...ZERO, focus: 4, organising: 2 })).toBe("high focus + medium planning");
    expect(personas[0].name).toBe("Persona A: high focus + high structure");
  });
});
