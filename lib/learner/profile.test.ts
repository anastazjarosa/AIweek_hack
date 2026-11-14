import { describe, expect, it } from "vitest";
import type { LearnEvent } from "@/lib/learner/events";
import { computeProfile, demoHistory, topicStats } from "@/lib/learner/profile";
import { topicForTemplate } from "@/lib/learner/topics";

const at = 1_700_000_000_000;
const quiz = (correct: boolean, i: number): LearnEvent => ({ t: "quiz", at: at + i, topic: "history-of-life", correct });

describe("computeProfile", () => {
  it("says nothing without evidence", () => {
    const p = computeProfile([]);
    expect(p.signals).toEqual([]);
    expect(p.adaptations).toEqual([]);
    expect(p.focusMinutes).toBeNull();
  });

  it("uses how long early-ended blocks lasted as the focus span", () => {
    const blocks: LearnEvent[] = [9, 11, 10].map((m, i) => ({ t: "focus_block", at: at + i, plannedMin: 20, activeMin: m, endedBy: "early" }));
    const p = computeProfile(blocks);
    expect(p.focusMinutes).toBe(10);
    expect(p.signals[0]).toMatchObject({ id: "focus", finding: "You focus best in blocks of about 10 minutes" });
    expect(p.adaptations[0]).toMatchObject({ id: "short", scores: { focus: 3 } });
  });

  it("doesn't suggest shorter blocks when full blocks hold", () => {
    const blocks: LearnEvent[] = [20, 20].map((m, i) => ({ t: "focus_block", at: at + i, plannedMin: 20, activeMin: m, endedBy: "timer" }));
    const p = computeProfile(blocks);
    expect(p.signals[0].finding).toBe("You keep going for your full 20-minute blocks");
    expect(p.adaptations.find((a) => a.id === "short")).toBeUndefined();
  });

  it("detects improving practice from early vs recent accuracy", () => {
    const p = computeProfile([false, false, false, true, true, true].map(quiz));
    expect(p.signals.find((s) => s.id === "practice")).toMatchObject({ finding: "Practice questions are working for you", evidence: expect.stringContaining("0% right, recent ones 100%") });
  });

  it("detects skimming from reading speed", () => {
    const reads: LearnEvent[] = [5, 6, 4].map((s, i) => ({ t: "read", at: at + i, topic: "history-of-life", words: 200, seconds: s }));
    expect(computeProfile(reads).signals.find((s) => s.id === "pace")?.finding).toBe("You move through text quickly");
  });

  it("detects depth from written explanations", () => {
    const ex: LearnEvent[] = [true, true, true].map((wrote, i) => ({ t: "explanation", at: at + i, topic: "forces", sim: "s", wrote, ideas: 2, total: 3 }));
    expect(computeProfile(ex).signals.find((s) => s.id === "depth")?.finding).toBe("You like to dig into why things happen");
  });

  it("never uses condition labels in anything it says", () => {
    const p = computeProfile(demoHistory(at));
    const text = JSON.stringify(p);
    expect(text).not.toMatch(/adhd|dyslexi|autis|dyspraxi|disorder|diagnos/i);
  });
});

describe("topicStats", () => {
  it("counts wrong predictions, wrong answers and thin explanations as misses", () => {
    const ev: LearnEvent[] = [
      { t: "prediction", at, topic: "forces", sim: "a", correct: false },
      { t: "prediction", at, topic: "forces", sim: "b", correct: true },
      { t: "explanation", at, topic: "forces", sim: "a", wrote: true, ideas: 1, total: 3 },
      { t: "explanation", at, topic: "forces", sim: "b", wrote: false, ideas: null, total: 3 },
      { t: "quiz", at, topic: "history-of-life", correct: true },
    ];
    const s = topicStats(ev);
    expect(s[0]).toMatchObject({ topic: "forces", attempts: 3, misses: 2 });
    expect(s[1]).toMatchObject({ topic: "history-of-life", attempts: 1, misses: 0 });
  });

  it("maps templates to topics", () => {
    expect([topicForTemplate("projectile"), topicForTemplate("reaction"), topicForTemplate("ecosystem")]).toEqual(["forces", "reactions", "populations"]);
  });
});

describe("demo history", () => {
  it("produces the pitch story: short focus, hands-on, weak on forces, practice improving", () => {
    const p = computeProfile(demoHistory(at));
    const ids = p.signals.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["focus", "format", "depth", "pace", "practice"]));
    expect(p.focusMinutes).toBeLessThanOrEqual(12);
    expect(p.weakTopics[0].topic).toBe("forces");
    expect(p.signals.find((s) => s.id === "format")!.finding).toMatch(/by doing/);
    expect(p.signals.find((s) => s.id === "practice")!.finding).toBe("Practice questions are working for you");
    expect(p.adaptations.map((a) => a.id)).toEqual(expect.arrayContaining(["short", "doing", "topic-forces"]));
  });

  it("is deterministic and in time order", () => {
    const a = demoHistory(at);
    expect(demoHistory(at)).toEqual(a);
    expect(a.every((e, i) => i === 0 || e.at >= a[i - 1].at)).toBe(true);
  });
});
