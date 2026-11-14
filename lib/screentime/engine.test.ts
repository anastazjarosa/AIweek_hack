import { describe, expect, it } from "vitest";
import {
  adaptAfterRecall,
  baseBlockMinutes,
  breakAfter,
  chooseTask,
  needsFor,
  schedule,
  struggleReason,
  warningSeconds,
} from "./engine";

const demo = needsFor(["adhd", "autism"]);

describe("needs", () => {
  it("merges picked profiles by taking the highest need", () => {
    expect(demo).toEqual({ focus: "high", info_intake: "medium", organising: "high", predictability: "high" });
  });
  it("defaults to standard when nothing is picked", () => {
    expect(needsFor([])).toEqual(needsFor(["standard"]));
  });
});

describe("blocks and breaks", () => {
  it("sets block length from focus need", () => {
    expect(baseBlockMinutes(needsFor(["standard"]))).toBe(20);
    expect(baseBlockMinutes(needsFor(["dyslexia", "autism"]))).toBe(20);
    expect(baseBlockMinutes(demo)).toBe(10);
  });
  it("gives a long break after every third block", () => {
    expect([1, 2, 3, 4, 6].map((n) => breakAfter(n).kind)).toEqual(["short", "short", "long", "short", "long"]);
  });
  it("adds 5 min and 30 s warnings only for high predictability", () => {
    expect(warningSeconds(needsFor(["adhd"]))).toEqual([120]);
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
  it("prefers movement for high focus and avoids writing for high organising", () => {
    expect(chooseTask(needsFor(["adhd"]), 0)).toBe("move_and_recall");
  });
  it("prefers audio or teach-back for high info intake", () => {
    const n = needsFor(["dyslexia"]);
    expect([chooseTask(n, 0), chooseTask(n, 1)].sort()).toEqual(["teach_back", "walk_and_listen"]);
  });
  it("keeps the same task type when predictability is high", () => {
    expect(chooseTask(demo, 3, "paper_sketch")).toBe("paper_sketch");
  });
  it("rotates through tied tasks for a standard profile", () => {
    const n = needsFor(["standard"]);
    expect(new Set([0, 1, 2, 3, 4].map((i) => chooseTask(n, i))).size).toBe(5);
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
