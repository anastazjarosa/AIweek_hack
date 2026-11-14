import { describe, expect, it } from "vitest";
import { loopStages, nextStep, streakDays, todaysFirstSession } from "@/lib/home";
import type { LearnEvent } from "@/lib/learner/events";
import { computeProfile, demoHistory } from "@/lib/learner/profile";

const now = Date.parse("2026-11-14T12:00:00Z");
const today = "2026-11-14";
const empty = computeProfile([]);

describe("nextStep", () => {
  it("sends a brand-new student to a first experiment", () => {
    const s = nextStep([], empty, [], today, null);
    expect(s).toMatchObject({ kind: "first-experiment", stage: "learn", cta: { href: "/lab/heavier-falls-faster" } });
  });

  it("prefers today's planned session when there is a plan", () => {
    const ev = demoHistory(now);
    const p = computeProfile(ev);
    const exams = [{ id: "a", topic: "forces" as const, date: "2026-11-26" }];
    const session = todaysFirstSession(exams, today, p, 40, null);
    const s = nextStep(ev, p, exams, today, session);
    expect(s.kind).toBe("planned");
    expect(s.title).toMatch(/forces and motion/);
    expect(s.cta.label).toBe("Start with 2 minutes");
  });

  it("points at the weakest topic when there's history but no plan", () => {
    const ev = demoHistory(now);
    const s = nextStep(ev, computeProfile(ev), [], today, null);
    expect(s).toMatchObject({ kind: "practise-weak", stage: "results", title: "Practise forces and motion with an experiment" });
  });

  it("asks for exam dates once things are going well", () => {
    const ev: LearnEvent[] = [{ t: "quiz", at: now, topic: "history-of-life", correct: true }];
    expect(nextStep(ev, computeProfile(ev), [], today, null).kind).toBe("add-exams");
  });
});

describe("streakDays", () => {
  const at = (daysAgo: number) => ({ t: "quiz" as const, at: now - daysAgo * 864e5, topic: "forces" as const, correct: true });
  it("counts consecutive days back from today", () => {
    expect(streakDays([at(0), at(1), at(2), at(4)], now)).toBe(3);
  });
  it("keeps yesterday's streak alive until today is over", () => {
    expect(streakDays([at(1), at(2)], now)).toBe(2);
  });
  it("is zero after a gap or with no history", () => {
    expect(streakDays([at(3)], now)).toBe(0);
    expect(streakDays([], now)).toBe(0);
  });
});

describe("loopStages", () => {
  it("shows empty stages for a new student", () => {
    const s = loopStages([], empty, [], today);
    expect(s.map((x) => x.id)).toEqual(["know", "learn", "results", "plan"]);
    expect(s.every((x) => x.empty)).toBe(true);
  });

  it("summarises the demo week in a few words per stage", () => {
    const ev = demoHistory(now);
    const s = loopStages(ev, computeProfile(ev), [{ id: "a", topic: "forces", date: "2026-11-26" }], today);
    expect(s.map((x) => x.status)).toEqual(["Focus ~10 min", "7 experiments this week", "Forces and motion needs work", "Physics exam in 12 days"]);
    expect(s.some((x) => x.empty)).toBe(false);
  });
});
