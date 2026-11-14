import { describe, expect, it } from "vitest";
import {
  adaptAfterRecall,
  baseBlockMinutes,
  breakAfter,
  chooseTask,
  schedule,
  struggleReason,
  warningSeconds,
} from "./engine";
import { needsFromScores, ZERO } from "../dimensions";

const n = (s: Partial<typeof ZERO>) => needsFromScores({ ...ZERO, ...s });
const demo = n({ focus: 4, predictability: 4 });

describe("blocks and breaks", () => {
  it("sets block length from focus need", () => {
    expect(baseBlockMinutes(n({}))).toBe(20);
    expect(baseBlockMinutes(n({ focus: 2 }))).toBe(15);
    expect(baseBlockMinutes(demo)).toBe(10);
  });
  it("gives a long break after every third block", () => {
    expect([1, 2, 3, 4, 6].map((n) => breakAfter(n).kind)).toEqual(["short", "short", "long", "short", "long"]);
  });
  it("adds 5 min and 30 s warnings only for high predictability", () => {
    expect(warningSeconds(n({ focus: 4 }))).toEqual([120]);
    expect(warningSeconds(demo)).toEqual([300, 120, 30]);
  });
  it("plans a schedule that stops at the daily cap", () => {
    const s = schedule(demo, 35);
    expect(s.filter((i) => i.type === "focus").reduce((n, i) => n + i.minutes, 0)).toBe(35);
    expect(s.at(-1)?.type).toBe("focus");
    expect(s[5]).toEqual({ type: "long", minutes: 15 });
  });
});

describe("break tasks", () => {
  it("prefers movement for high focus", () => {
    expect(chooseTask(n({ focus: 4, organising: 2 }), 0)).toBe("move_and_recall");
    expect(chooseTask(demo, 0)).toBe("move_and_recall");
  });
  it("avoids writing tasks for high organising", () => {
    expect(chooseTask(n({ organising: 4 }), 0)).not.toBe("paper_sketch");
  });
  it("prefers audio for high processing", () => {
    expect(chooseTask(n({ processing: 4 }), 0)).toBe("walk_and_listen");
  });
  it("keeps the same task type when predictability is high", () => {
    expect(chooseTask(demo, 3, "paper_sketch")).toBe("paper_sketch");
  });
  it("rotates through tied tasks for a standard profile", () => {
    const low = n({});
    expect(new Set([0, 1, 2, 3, 4].map((i) => chooseTask(low, i))).size).toBe(5);
  });
});

describe("return flow", () => {
  it("keeps length when recall is perfect", () => {
    expect(adaptAfterRecall(10, 2, 2)).toEqual({ nextMinutes: 10, simplify: false });
  });
  it("shortens by 5 and simplifies otherwise, never below 5", () => {
    expect(adaptAfterRecall(10, 1, 2)).toEqual({ nextMinutes: 5, simplify: true });
    expect(adaptAfterRecall(5, 0, 2)).toEqual({ nextMinutes: 5, simplify: true });
  });
});

describe("struggle detection", () => {
  const calm = { wrongInARow: 0, idleEvents: 0, maxReplays: 0, overloaded: false };
  it("fires on each trigger", () => {
    expect(struggleReason(calm)).toBeNull();
    expect(struggleReason({ ...calm, wrongInARow: 3 })).toBe("wrong_answers");
    expect(struggleReason({ ...calm, idleEvents: 2 })).toBe("idle");
    expect(struggleReason({ ...calm, maxReplays: 3 })).toBe("replays");
    expect(struggleReason({ ...calm, overloaded: true })).toBe("overloaded");
  });
});
