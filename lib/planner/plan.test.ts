import { describe, expect, it } from "vitest";
import type { LearnEvent } from "@/lib/learner/events";
import { computeProfile, demoHistory, type TopicStat } from "@/lib/learner/profile";
import { addDays, blockMinutes, buildPlan, daysBetween, detectHabits, firstStep, minutesByTopic, weeklyCheckIn, type Exam } from "@/lib/planner/plan";

const today = "2026-11-14";
const stat = (topic: TopicStat["topic"], missRate: number): TopicStat => ({ topic, label: topic, attempts: 4, misses: Math.round(missRate * 4), missRate });

describe("dates", () => {
  it("adds days and counts between dates across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(daysBetween("2026-11-14", "2026-12-01")).toBe(17);
  });
});

describe("buildPlan", () => {
  const exams: Exam[] = [
    { id: "a", topic: "forces", date: "2026-11-26" },
    { id: "b", topic: "reactions", date: "2026-12-03" },
  ];

  it("plans every day up to the last exam, with a warm-up on exam days", () => {
    const plan = buildPlan({ exams, today, focusMinutes: 20, topicStats: [] });
    expect(plan).toHaveLength(daysBetween(today, "2026-12-03") + 1);
    const examDay = plan.find((d) => d.date === "2026-11-26")!;
    expect(examDay.examToday).toEqual(["forces"]);
    expect(examDay.sessions).toEqual([{ topic: "forces", minutes: 10, kind: "review", href: expect.any(String) }]);
    // After the forces exam, only reactions is planned.
    expect(plan.filter((d) => d.date > "2026-11-26").flatMap((d) => d.sessions).every((s) => s.topic === "reactions")).toBe(true);
  });

  it("gives weak topics more time", () => {
    const even = minutesByTopic(buildPlan({ exams, today, focusMinutes: 20, topicStats: [stat("forces", 0), stat("reactions", 0)] }));
    const weakForces = minutesByTopic(buildPlan({ exams, today, focusMinutes: 20, topicStats: [stat("forces", 0.8), stat("reactions", 0)] }));
    expect(weakForces.forces!).toBeGreaterThan(even.forces!);
  });

  it("sizes sessions to the focus span and the distraction coach", () => {
    expect(blockMinutes(8, null)).toBe(10);
    expect(blockMinutes(40, null)).toBe(25);
    expect(blockMinutes(null, null)).toBe(20);
    expect(blockMinutes(22, "distraction")).toBe(15);
    const plan = buildPlan({ exams, today, focusMinutes: 10, topicStats: [], dailyMinutes: 40 });
    expect(plan[0].sessions).toHaveLength(4);
    expect(plan[0].sessions.every((s) => s.minutes === 10)).toBe(true);
  });

  it("marks practice for weak topics and review close to the exam", () => {
    const plan = buildPlan({ exams, today, focusMinutes: 20, topicStats: [stat("forces", 0.75)] });
    expect(plan[0].sessions.find((s) => s.topic === "forces")?.kind).toBe("practice");
    const twoBefore = plan.find((d) => d.date === addDays("2026-11-26", -2))!;
    expect(twoBefore.sessions.find((s) => s.topic === "forces")?.kind).toBe("review");
  });

  it("mixes evenly matched topics within a day", () => {
    const sameDay = [
      { id: "a", topic: "forces" as const, date: "2026-11-30" },
      { id: "b", topic: "reactions" as const, date: "2026-11-30" },
    ];
    const plan = buildPlan({ exams: sameDay, today, focusMinutes: 10, topicStats: [], dailyMinutes: 60 });
    for (const d of plan.slice(0, 5)) {
      for (let i = 1; i < d.sessions.length; i++) expect(d.sessions[i].topic).not.toBe(d.sessions[i - 1].topic);
    }
  });

  it("ignores past exams and caps the plan length", () => {
    expect(buildPlan({ exams: [{ id: "x", topic: "forces", date: "2026-11-01" }], today, focusMinutes: 20, topicStats: [] })).toEqual([]);
    const far = buildPlan({ exams: [{ id: "x", topic: "forces", date: "2027-06-01" }], today, focusMinutes: 20, topicStats: [] });
    expect(far).toHaveLength(28);
  });
});

describe("habit coach", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  it("spots a gap, early-ended blocks and over-polishing from behaviour", () => {
    const ev: LearnEvent[] = [
      { t: "focus_block", at: now - 5 * 864e5, plannedMin: 20, activeMin: 8, endedBy: "early" },
      { t: "focus_block", at: now - 4 * 864e5, plannedMin: 20, activeMin: 9, endedBy: "early" },
      ...["a", "b"].flatMap((sim) => Array.from({ length: 6 }, (_, i): LearnEvent => ({ t: "experiment_run", at: now - 3 * 864e5 + i, topic: "forces", sim }))),
    ];
    expect(detectHabits(ev, now).map((h) => h.habit).sort()).toEqual(["distraction", "perfectionism", "procrastination"]);
    expect(detectHabits([], now)).toEqual([]);
  });

  it("gives a concrete two-minute first step", () => {
    expect(firstStep({ topic: "forces", minutes: 20, kind: "practice", href: "/lab" })).toMatch(/make your prediction/);
    expect(firstStep({ topic: "reactions", minutes: 20, kind: "review", href: "/lab" })).toMatch(/three things/);
  });
});

describe("weeklyCheckIn", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  it("summarises the demo week with improvements and what's next", () => {
    const ev = demoHistory(now);
    const p = computeProfile(ev);
    const c = weeklyCheckIn(ev, now, p.weakTopics, [{ id: "a", topic: "forces", date: "2026-11-26" }], "2026-11-14");
    expect(c.stats.find((s) => s.label === "Experiments")!.value).toBe("7");
    expect(c.improved.some((s) => s.startsWith("History of life"))).toBe(true);
    expect(c.next[0]).toMatch(/forces and motion/);
    expect(c.next[1]).toBe("Physics exam (Forces and motion) in 12 days.");
  });

  it("is kind about a quiet week", () => {
    const c = weeklyCheckIn([], now, [], [], "2026-11-14");
    expect(c.headline).toMatch(/quiet week/);
    expect(c.next).toEqual(["Add an exam date and the planner will build your schedule."]);
  });
});
