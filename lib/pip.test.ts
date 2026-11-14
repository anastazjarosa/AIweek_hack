import { describe, expect, it } from "vitest";
import { ZERO } from "./dimensions";
import { earnedUnlock, outfits, pickUnlock, pipMotion, stillDuringFocus, struggleLine, urgeLines } from "./pip";

const demo = { focus: 4, processing: 1, organising: 1, predictability: 3 };

describe("pip motion", () => {
  it("reduced motion always wins: face only", () => {
    expect(pipMotion(demo, true)).toBe("none");
    expect(pipMotion(ZERO, true)).toBe("none");
  });
  it("high structure keeps Pip to minimal movement", () => {
    expect(pipMotion(demo, false)).toBe("minimal");
    expect(pipMotion({ ...demo, predictability: 2 }, false)).toBe("full");
  });
  it("high focus keeps Pip still during focus blocks", () => {
    expect(stillDuringFocus(demo)).toBe(true);
    expect(stillDuringFocus({ ...demo, focus: 2 })).toBe(false);
  });
});

describe("outfit unlocks", () => {
  it("only a full off-screen break earns an outfit", () => {
    expect(earnedUnlock({ plannedMin: 5, offscreenSec: 300 })).toBe(true);
    expect(earnedUnlock({ plannedMin: 5, offscreenSec: 120 })).toBe(false);
  });
  it("picks only locked outfits and stops when all are owned", () => {
    const owned = outfits.slice(0, 4).map((o) => o.id);
    expect(pickUnlock(owned, 0.99)).toBe(outfits[4].id);
    expect(pickUnlock([], 0)).toBe(outfits[0].id);
    expect(pickUnlock([], 0.999)).toBe(outfits[4].id);
    expect(pickUnlock(outfits.map((o) => o.id), 0.5)).toBeNull();
  });
});

describe("pip lines", () => {
  it("Pop names the urge, Pip gives a strategy with the time left", () => {
    const l = urgeLines("phone", 6 * 60);
    expect(l.pop).toMatch(/unpredictable-reward pull/);
    expect(l.pip).toMatch(/another room.*6 minutes left, then a break/);
    expect(urgeLines("tab", 50).pip).toMatch(/1 minute left/);
  });
  it("offers another explanation only for content struggle", () => {
    expect(struggleLine("wrong_answers").offerExplain).toBe(true);
    expect(struggleLine("replays").offerExplain).toBe(true);
    expect(struggleLine("overloaded").offerExplain).toBe(false);
  });
});
