import { describe, expect, it } from "vitest";
import type { LearnEvent } from "@/lib/learner/events";
import { detectPatterns, explainMode, patterns } from "@/lib/learner/patterns";
import { computeProfile, demoHistory } from "@/lib/learner/profile";

const at = 1_700_000_000_000;
const explanations = (wrote: boolean): LearnEvent[] =>
  [0, 1, 2].map((i) => ({ t: "explanation", at: at + i, topic: "forces", sim: `s${i}`, wrote, ideas: wrote ? 2 : null, total: 3 }));

describe("learning patterns", () => {
  it("covers the patterns from the brief, each with what it notices and changes", () => {
    expect(patterns.map((p) => p.id)).toEqual(["deep", "quick", "hands-on", "listener", "fast", "practice", "bursts"]);
    for (const p of patterns) {
      expect(p.notices.length).toBeGreaterThan(10);
      expect(p.adapts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("never uses condition labels", () => {
    expect(JSON.stringify(patterns)).not.toMatch(/adhd|dyslexi|autis|dyspraxi|disorder|diagnos/i);
  });

  it("detects nothing without evidence", () => {
    expect(detectPatterns(computeProfile([]))).toEqual([]);
  });

  it("tells a deep diver from a quick-answer learner, and orders the explain step to match", () => {
    const deep = detectPatterns(computeProfile(explanations(true)));
    expect(deep.map((d) => d.pattern.id)).toEqual(["deep"]);
    expect(explainMode(deep)).toBe("deep");
    const quick = detectPatterns(computeProfile(explanations(false)));
    expect(quick.map((d) => d.pattern.id)).toEqual(["quick"]);
    expect(explainMode(quick)).toBe("quick");
    expect(explainMode([])).toBe("standard");
  });

  it("finds a mix in the demo week, each with its evidence", () => {
    const d = detectPatterns(computeProfile(demoHistory(at)));
    expect(d.map((x) => x.pattern.id)).toEqual(["deep", "hands-on", "fast", "practice", "bursts"]);
    expect(d.every((x) => x.evidence.length > 10)).toBe(true);
  });
});
