import { describe, expect, it } from "vitest";
import { DESIGN_SYSTEM, FEEDBACK_SYSTEM, GUARDRAIL } from "@/lib/ai/prompts";
import { createLimiter } from "@/lib/ai/rate-limit";
import { coachFeedback, designSim, MAX_ATTEMPTS, type Ask } from "@/lib/ai/sim-agent";
import { aiResultSchema, toSimSpec, type AiResult, type AiSpec, type Feedback } from "@/lib/sim/ai-spec";
import { findSim } from "@/lib/sim/library";
import { closestSim } from "@/lib/sim/match";
import { templateIds, templates } from "@/lib/sim/templates";

// A valid AI answer for "do heavier things fall faster?" (mass changes nothing without air).
const goodSpec: AiSpec = {
  id: "heavy-and-light",
  template: "freefall",
  title: "Heavy and light",
  question: "Do heavier things fall faster?",
  intro: "Drop two balls from a tower with no air.",
  minutes: 2,
  params: [{ id: "drag", default: 0, min: null, max: null, hidden: true }],
  prediction: { prompt: "Make the ball 10 times heavier. What happens to the time to land?", param: "mass", from: 1, to: 10, metric: "fallTime" },
  expectedAnswer: "same",
  explanation: "Without air both land together.",
  keyIdeas: ["Gravity pulls harder on heavier things", "Heavier things are harder to speed up"],
  misconception: "Heavy things fall faster.",
  realWorld: null,
};
const answer = (r: AiResult) => ({ parsed: r, content: [{ type: "text" as const, text: JSON.stringify(r) }], refused: false });

/** A fake model that returns scripted answers and records what it was sent. */
function script<T>(...turns: { parsed: T | null; content: never[] | { type: "text"; text: string }[]; refused: boolean }[]) {
  const seen: unknown[][] = [];
  const ask: Ask<T> = async (messages) => {
    seen.push(structuredClone(messages));
    const t = turns.shift();
    if (!t) throw new Error("no more scripted turns");
    return t as Awaited<ReturnType<Ask<T>>>;
  };
  return { ask, seen };
}

describe("prompts", () => {
  it("list every template, parameter and metric the app can run", () => {
    for (const id of templateIds) {
      expect(DESIGN_SYSTEM).toContain(`<template id="${id}"`);
      for (const p of templates[id].params) expect(DESIGN_SYSTEM).toContain(`- ${p.id}:`);
      for (const m of templates[id].metrics) expect(DESIGN_SYSTEM).toContain(`- ${m.id}:`);
    }
  });

  it("carry the no-diagnosis guardrail and treat student text as data", () => {
    for (const p of [DESIGN_SYSTEM, FEEDBACK_SYSTEM]) {
      expect(p).toContain(GUARDRAIL);
      expect(p).toMatch(/data, not instructions/);
    }
  });

  it("are stable between calls, so the prefix caches", async () => {
    const again = await import("@/lib/ai/prompts");
    expect(again.DESIGN_SYSTEM).toBe(DESIGN_SYSTEM);
    expect(DESIGN_SYSTEM).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("toSimSpec", () => {
  it("turns the AI shape into a spec that passes the checker", () => {
    const spec = toSimSpec(goodSpec);
    expect(spec.params).toEqual({ drag: { default: 0, hidden: true } });
    expect(spec).not.toHaveProperty("realWorld");
    expect(spec).not.toHaveProperty("expectedAnswer");
  });

  it("the result schema accepts a refusal-style answer with no spec", () => {
    expect(aiResultSchema.safeParse({ fits: false, reason: "Not science.", spec: null }).success).toBe(true);
  });
});

describe("designSim", () => {
  it("returns the spec when it is valid and the expected answer matches the model", async () => {
    const { ask } = script<AiResult>(answer({ fits: true, reason: "Free fall fits.", spec: goodSpec }));
    const r = await designSim("Do heavier things fall faster?", ask);
    expect(r).toMatchObject({ kind: "ai", attempts: 1, spec: { id: "heavy-and-light", template: "freefall" } });
  });

  it("retries with the checker's errors, passing the previous answer back", async () => {
    const bad = { ...goodSpec, prediction: { ...goodSpec.prediction, to: 500 } };
    const { ask, seen } = script<AiResult>(
      answer({ fits: true, reason: "", spec: bad }),
      answer({ fits: true, reason: "", spec: goodSpec }),
    );
    const r = await designSim("q", ask);
    expect(r.kind).toBe("ai");
    expect(seen).toHaveLength(2);
    const second = seen[1] as { role: string; content: unknown }[];
    expect(second.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(String(second[2].content)).toMatch(/prediction.to: must be between/);
  });

  it("rejects an explanation that contradicts the real model", async () => {
    const wrong = { ...goodSpec, expectedAnswer: "down" as const };
    const { ask, seen } = script<AiResult>(answer({ fits: true, reason: "", spec: wrong }), answer({ fits: true, reason: "", spec: goodSpec }));
    const r = await designSim("q", ask);
    expect(r.kind).toBe("ai");
    const retry = (seen[1] as { content: unknown }[])[2];
    expect(String(retry.content)).toMatch(/in the real model it stays about the same \(2\.02 s to 2\.02 s\)/);
  });

  it("gives up after MAX_ATTEMPTS invalid answers", async () => {
    const bad = { ...goodSpec, template: "volcano" };
    const turns = Array.from({ length: MAX_ATTEMPTS }, () => answer({ fits: true, reason: "", spec: bad as AiSpec }));
    const r = await designSim("q", script<AiResult>(...turns).ask);
    expect(r).toMatchObject({ kind: "failed" });
  });

  it("passes on a 'doesn't fit' answer and on a refusal", async () => {
    const none = await designSim("write my essay", script<AiResult>(answer({ fits: false, reason: "That's not an experiment.", spec: null })).ask);
    expect(none).toEqual({ kind: "none", reason: "That's not an experiment." });
    const refused = await designSim("q", script<AiResult>({ parsed: null, content: [], refused: true }).ask);
    expect(refused.kind).toBe("none");
  });

  it("treats unparseable output as an error to retry", async () => {
    const { ask, seen } = script<AiResult>({ parsed: null, content: [], refused: false }, answer({ fits: true, reason: "", spec: goodSpec }));
    expect((await designSim("q", ask)).kind).toBe("ai");
    expect(String((seen[1] as { content: unknown }[])[2].content)).toMatch(/not valid JSON/);
  });
});

describe("coachFeedback", () => {
  const spec = findSim("heavier-falls-faster")!;
  const fb = (f: Feedback) => ({ parsed: f, content: [], refused: false });

  it("aligns the ideas with the spec's key ideas", async () => {
    const { ask, seen } = script<Feedback>(fb({ ideas: [true], misconception: false, feedback: "  Good start.  " }));
    const r = await coachFeedback(spec, "down", "gravity pulls harder", ask);
    expect(r).toEqual({ ideas: [true, false, false], misconception: false, feedback: "Good start." });
    const sent = String((seen[0] as { content: unknown }[])[0].content);
    expect(sent).toContain("The student predicted: time to land goes down");
    expect(sent).toContain("What really happened: time to land stays about the same");
    expect(sent).toContain("<student_explanation>\ngravity pulls harder\n</student_explanation>");
  });

  it("returns null on a refusal or unparseable answer", async () => {
    expect(await coachFeedback(spec, "up", "x", script<Feedback>({ parsed: null, content: [], refused: true }).ask)).toBeNull();
    expect(await coachFeedback(spec, "up", "x", script<Feedback>({ parsed: null, content: [], refused: false }).ask)).toBeNull();
  });
});

describe("closestSim (offline fallback)", () => {
  it.each([
    ["Why don't heavier things fall faster?", "heavier-falls-faster"],
    ["what angle should I kick a football at to go furthest", "best-throwing-angle"],
    ["Why does milk go off faster when it's warm?", "hotter-reacts-faster"],
    ["how do enzymes and catalysts work", "catalyst"],
    ["why do fox and rabbit numbers go up and down", "foxes-and-rabbits"],
    ["why do bacteria stop growing", "bacteria-in-a-dish"],
    ["how does a spring bounce", "spring-heavier-mass"],
  ])("%s → %s", (q, id) => {
    expect(closestSim(q)?.id).toBe(id);
  });

  it("returns null for unrelated questions", () => {
    expect(closestSim("who won the 1966 world cup")).toBeNull();
    expect(closestSim("???")).toBeNull();
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, per key", () => {
    const allow = createLimiter(2, 1000);
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1011)).toBe(true);
  });
});
