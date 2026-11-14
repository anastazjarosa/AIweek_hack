import { describe, expect, it } from "vitest";
import { library } from "@/lib/sim/library";
import { checkSpec, direction, formatMetric, paramsFor, predictionOutcome, startValues, type Direction } from "@/lib/sim/spec";
import { downsample, rateConstant, templates, valuesFor, type TemplateId } from "@/lib/sim/templates";

const metrics = (id: TemplateId, overrides: Record<string, number> = {}) =>
  templates[id].run(valuesFor(templates[id], overrides)).metrics as Record<string, number>;

describe("physics models match textbook formulas", () => {
  it("projectile without air: R = v² sin 2θ / g, T = 2v sin θ / g, H = v² sin² θ / 2g", () => {
    const v = 20;
    const g = 9.8;
    for (const deg of [20, 45, 70]) {
      const a = (deg * Math.PI) / 180;
      const m = metrics("projectile", { angle: deg, speed: v, gravity: g, drag: 0 });
      expect(m.range).toBeCloseTo((v * v * Math.sin(2 * a)) / g, 1);
      expect(m.flightTime).toBeCloseTo((2 * v * Math.sin(a)) / g, 2);
      expect(m.maxHeight).toBeCloseTo((v * v * Math.sin(a) ** 2) / (2 * g), 1);
    }
  });

  it("projectile: mass only matters when there is air resistance", () => {
    expect(metrics("projectile", { mass: 1 }).range).toBeCloseTo(metrics("projectile", { mass: 10 }).range, 6);
    expect(metrics("projectile", { mass: 5, drag: 0.005 }).range).toBeGreaterThan(metrics("projectile", { mass: 1, drag: 0.005 }).range);
  });

  it("free fall: t = √(2h/g) without air, slower with it", () => {
    const m = metrics("freefall", { height: 20, gravity: 9.8 });
    expect(m.fallTime).toBeCloseTo(Math.sqrt(40 / 9.8), 3);
    expect(m.impactSpeed).toBeCloseTo(Math.sqrt(2 * 9.8 * 20), 2);
    expect(metrics("freefall", { drag: 0.02 }).fallTime).toBeGreaterThan(m.fallTime);
  });

  it("free fall with air approaches terminal velocity √(mg/k)", () => {
    const m = metrics("freefall", { height: 100, mass: 0.1, drag: 0.05 });
    expect(m.impactSpeed).toBeCloseTo(Math.sqrt((0.1 * 9.8) / 0.05), 1);
  });

  it("spring: T = 2π√(m/k), damping shrinks the swing", () => {
    expect(metrics("spring", { mass: 1, stiffness: 20 }).period).toBeCloseTo(2 * Math.PI * Math.sqrt(1 / 20), 4);
    expect(metrics("spring", { mass: 4 }).period / metrics("spring", { mass: 1 }).period).toBeCloseTo(2, 6);
    expect(metrics("spring", { damping: 0 }).swingLeft).toBeCloseTo(100, 6);
    expect(metrics("spring", { damping: 0.5 }).swingLeft).toBeLessThan(20);
  });

  it("spring: overdamped has no period to report", () => {
    const r = templates.spring.run(valuesFor(templates.spring, { mass: 0.1, stiffness: 1, damping: 2 }));
    expect(r.metrics.period).toBeNull();
  });

  it("spring: the simulated motion stays bounded by the amplitude", () => {
    const r = templates.spring.run(valuesFor(templates.spring, { amplitude: 0.3 }));
    for (const [, x] of r.series[0].points) expect(Math.abs(x)).toBeLessThanOrEqual(0.3 + 1e-3);
  });
});

describe("chemistry model", () => {
  it("is calibrated to a 60 s half-life at 25 °C and 1 mol/L", () => {
    expect(metrics("reaction").halfTime).toBeCloseTo(60, 6);
    expect(metrics("reaction").doneAt60).toBeCloseTo(50, 6);
  });

  it("roughly doubles in rate for every 10 °C (Arrhenius, Ea = 50 kJ/mol)", () => {
    const ratio = rateConstant(35, false) / rateConstant(25, false);
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2.1);
  });

  it("a catalyst speeds it up without changing the final amount", () => {
    expect(rateConstant(25, true)).toBeGreaterThan(rateConstant(25, false) * 3);
    const last = (catalyst: number) => templates.reaction.run(valuesFor(templates.reaction, { catalyst })).series[0].points.at(-1)![1];
    expect(last(1)).toBeLessThanOrEqual(1);
    expect(last(1)).toBeGreaterThan(last(0));
  });
});

describe("biology models", () => {
  it("logistic growth levels off at the carrying capacity", () => {
    expect(metrics("population", { capacity: 2000 }).final).toBeCloseTo(2000, -1);
    expect(metrics("population", { rate: 1.2 }).timeToHalf).toBeLessThan(metrics("population", { rate: 0.6 }).timeToHalf);
  });

  it("predators and prey cycle and stay positive", () => {
    const r = templates.ecosystem.run(valuesFor(templates.ecosystem));
    const [rabbits, foxes] = r.series;
    for (const s of [rabbits, foxes]) for (const [, y] of s.points) expect(y).toBeGreaterThan(0);
    // At least two rabbit peaks in 40 years: it cycles rather than settling or exploding.
    const ys = rabbits.points.map((p) => p[1]);
    const peaks = ys.filter((y, i) => i > 0 && i < ys.length - 1 && y > ys[i - 1] && y >= ys[i + 1]);
    expect(peaks.length).toBeGreaterThanOrEqual(2);
    expect(r.metrics.peakRabbits!).toBeLessThan(200);
  });
});

describe("helpers", () => {
  it("downsample keeps the first and last points", () => {
    const pts = Array.from({ length: 1000 }, (_, i) => [i, i] as [number, number]);
    const d = downsample(pts, 50);
    expect(d).toHaveLength(50);
    expect(d[0]).toEqual([0, 0]);
    expect(d.at(-1)).toEqual([999, 999]);
  });

  it("valuesFor clamps overrides to the template range", () => {
    expect(valuesFor(templates.projectile, { angle: 200 }).angle).toBe(85);
  });

  it("direction uses a 5% band for 'about the same'", () => {
    expect(direction(100, 104)).toBe("same");
    expect(direction(100, 106)).toBe("up");
    expect(direction(100, 90)).toBe("down");
  });

  it("formats metrics with units", () => {
    expect(formatMetric(2.0203, "s")).toBe("2.02 s");
    expect(formatMetric(50, "%")).toBe("50%");
    expect(formatMetric(1234.5, "cells")).toBe("1,235 cells");
    expect(formatMetric(null, "s")).toBe("—");
  });
});

describe("the library", () => {
  // The engine decides each answer; this table pins them so a model change can't silently flip one.
  const expected: Record<string, Direction> = {
    "heavier-falls-faster": "same",
    "falling-through-air": "down",
    "best-throwing-angle": "down",
    "throwing-on-the-moon": "up",
    "spring-heavier-mass": "up",
    "spring-friction": "same",
    "hotter-reacts-faster": "down",
    catalyst: "up",
    concentration: "up",
    "bacteria-in-a-dish": "up",
    "foxes-and-rabbits": "up",
  };

  it("covers all three subjects with unique ids", () => {
    const subjectsUsed = new Set(library.map((s) => templates[s.template as TemplateId].subject));
    expect(subjectsUsed).toEqual(new Set(["physics", "chemistry", "biology"]));
    expect(new Set(library.map((s) => s.id)).size).toBe(library.length);
    expect(Object.keys(expected).sort()).toEqual(library.map((s) => s.id).sort());
  });

  it.each(library.map((s) => [s.id, s] as const))("%s has the expected outcome", (id, spec) => {
    expect(predictionOutcome(spec)?.answer).toBe(expected[id]);
  });

  it("starts each simulation at the prediction's 'from' value", () => {
    for (const s of library) expect(startValues(s)[s.prediction.param]).toBe(s.prediction.from);
  });
});

describe("checkSpec rejects bad specs", () => {
  const good = {
    id: "test-spec",
    template: "freefall",
    title: "T",
    question: "Q?",
    intro: "I",
    minutes: 2,
    prediction: { prompt: "P", param: "mass", from: 1, to: 5, metric: "fallTime" },
    explanation: "E",
    keyIdeas: ["K"],
  };
  const errorsFor = (patch: object) => {
    const c = checkSpec({ ...good, ...patch });
    return c.ok ? [] : c.errors.join("\n");
  };

  it("accepts a minimal valid spec and fills defaults", () => {
    const c = checkSpec(good);
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.spec.params).toEqual({});
  });

  it("rejects unknown templates, params and metrics", () => {
    expect(errorsFor({ template: "volcano" })).toMatch(/template/);
    expect(errorsFor({ params: { colour: { hidden: true } } })).toMatch(/colour: not a parameter/);
    expect(errorsFor({ prediction: { ...good.prediction, metric: "loudness" } })).toMatch(/loudness is not a result/);
    expect(errorsFor({ prediction: { ...good.prediction, param: "angle" } })).toMatch(/angle is not a parameter/);
  });

  it("rejects predictions outside the range, unchanged or on hidden sliders", () => {
    expect(errorsFor({ prediction: { ...good.prediction, to: 500 } })).toMatch(/prediction.to: must be between/);
    expect(errorsFor({ prediction: { ...good.prediction, to: 1 } })).toMatch(/must differ/);
    expect(errorsFor({ params: { mass: { hidden: true } } })).toMatch(/hidden/);
    expect(errorsFor({ params: { mass: { max: 3 } } })).toMatch(/prediction.to: must be between 0.1 and 3/);
  });

  it("rejects results that can't be measured", () => {
    // Overdamped spring: there is no period to compare.
    const c = checkSpec({
      ...good,
      template: "spring",
      params: { stiffness: { default: 1 } },
      prediction: { prompt: "P", param: "damping", from: 1.9, to: 2, metric: "period" },
    });
    expect(c.ok).toBe(false);
  });

  it("rejects malformed ids and overlong text", () => {
    expect(errorsFor({ id: "Not OK" })).toMatch(/^id:/);
    expect(errorsFor({ intro: "x".repeat(401) })).toMatch(/^intro:/);
  });

  it("narrowed ranges and defaults are applied and clamped", () => {
    const c = checkSpec({ ...good, params: { height: { min: 10, max: 50, default: 80 } } });
    expect(c.ok).toBe(true);
    if (c.ok) expect(paramsFor(c.spec).find((p) => p.id === "height")).toMatchObject({ min: 10, max: 50, default: 50 });
  });
});
