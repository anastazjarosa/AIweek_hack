import { describe, expect, it } from "vitest";
import { escalationDecision } from "@/lib/teacher/hitl";
import { sourcesFor } from "@/lib/coach/sources";
import { findSim } from "@/lib/sim/library";

const sources = sourcesFor({ kind: "sim", spec: findSim("heavier-falls-faster")! });

describe("human review triggers", () => {
  it("pauses formal grading and flagging decisions", () => {
    expect(escalationDecision({ message: "Give this answer a grade and flag it", history: [], sources })?.trigger).toBe("high_stakes");
  });

  it("pauses explicitly ambiguous cases", () => {
    expect(escalationDecision({ message: "This edge case is unclear", history: [], sources })?.trigger).toBe("ambiguous");
  });

  it("pauses repeated questions and low-evidence questions", () => {
    expect(escalationDecision({ message: "Why does mass change the result?", history: [{ role: "user", content: "Why does mass change the result?" }], sources })?.trigger).toBe("circular");
    expect(escalationDecision({ message: "How do I repair a bicycle?", history: [], sources })?.trigger).toBe("low_confidence");
  });

  it("lets a grounded, ordinary learning question proceed", () => {
    expect(escalationDecision({ message: "Why doesn't mass change the result?", history: [], sources })).toBeNull();
  });
});
