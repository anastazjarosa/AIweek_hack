import { describe, expect, it } from "vitest";
import { GENERATIONS, START_DARK, explainHits, simulate } from "./selection";

describe("simulate", () => {
  it("returns one value per generation, starting from the rare dark form", () => {
    const run = simulate(0.9, true);
    expect(run.curve).toHaveLength(GENERATIONS + 1);
    expect(run.curve[0]).toBe(START_DARK);
  });

  it("on sooty bark with birds, dark moths become almost all of the population", () => {
    expect(simulate(0.9, true).end).toBeGreaterThan(0.95);
  });

  it("matches the historical pace: about 45 generations from 2% to 98% on sooty bark", () => {
    const g = simulate(0.9, true).curve.findIndex((p) => p >= 0.98);
    expect(g).toBeGreaterThan(35);
    expect(g).toBeLessThan(50);
  });

  it("with no birds, nothing selects and the share stays put", () => {
    expect(simulate(0.9, false).end).toBeCloseTo(START_DARK, 10);
  });

  it("on pale bark, dark moths stand out and become rarer", () => {
    expect(simulate(0.1, true).end).toBeLessThan(START_DARK);
  });

  it("on bark halfway between, neither colour has an advantage", () => {
    expect(simulate(0.5, true).end).toBeCloseTo(START_DARK, 10);
  });

  it("clamps bark darkness to 0-1", () => {
    expect(simulate(5, true).bark).toBe(1);
    expect(simulate(-1, true).bark).toBe(0);
  });
});

describe("explainHits", () => {
  it("finds both ideas in a good explanation", () => {
    expect(explainHits("Birds could not spot the dark ones, so they survived and passed it on to their young")).toEqual({
      survival: true,
      inherit: true,
    });
  });

  it("finds neither in an unrelated answer", () => {
    expect(explainHits("because of the weather in general")).toEqual({ survival: false, inherit: false });
  });
});
