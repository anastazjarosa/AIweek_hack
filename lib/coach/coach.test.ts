import { describe, expect, it } from "vitest";
import { checkReply, COACH_SYSTEM, coachRequest, coachTurn, ESCALATE, offlineReply, type CoachEvent, type StreamFn } from "@/lib/coach/coach";
import { retrieve, sourcesFor } from "@/lib/coach/sources";
import { GUARDRAIL } from "@/lib/ai/prompts";
import { findSim } from "@/lib/sim/library";

const lectureSources = sourcesFor({ kind: "lecture" });
const simSources = sourcesFor({ kind: "sim", spec: findSim("heavier-falls-faster")! });

describe("sources and retrieval", () => {
  it("turns each slide into a citable source with a link", () => {
    expect(lectureSources[0]).toMatchObject({ id: "slide-1", title: expect.stringMatching(/^Slide 1: /), href: expect.stringMatching(/^#/) });
    expect(lectureSources.at(-1)!.id).toBe("key-ideas");
    expect(simSources.map((s) => s.id)).toEqual(["setup", "explanation", "key-ideas", "misconception", "real-world"]);
  });

  it("finds the slide a question is about", () => {
    expect(retrieve(lectureSources, "what was the cambrian explosion")[0].source.title).toMatch(/Cambrian explosion/);
    expect(retrieve(lectureSources, "how did the dinosaurs die out, mass extinction")[0].source.title).toMatch(/Mass extinctions/);
    expect(retrieve(lectureSources, "zzz qqq")).toEqual([]);
  });
});

describe("prompt", () => {
  it("demands citations, hints over answers, escalation and the guardrail", () => {
    expect(COACH_SYSTEM).toMatch(/Cite every factual claim/);
    expect(COACH_SYSTEM).toMatch(/Don't give away answers/);
    expect(COACH_SYSTEM).toContain(ESCALATE);
    expect(COACH_SYSTEM).toContain(GUARDRAIL);
    expect(COACH_SYSTEM).toMatch(/data, not instructions/);
  });

  it("wraps the message with only the retrieved sources and the learner's style", () => {
    const r = coachRequest("why?", simSources.slice(0, 2), "hint", ["quick"]);
    expect(r).toContain('<source id="setup"');
    expect(r).not.toContain('id="real-world"');
    expect(r).toContain("<mode>hint</mode>");
    expect(r).toMatch(/short, to-the-point/);
    expect(r).toContain("<student_message>\nwhy?\n</student_message>");
  });
});

describe("output guard", () => {
  it("keeps valid citations and drops invented ones", () => {
    const c = checkReply("Both fall together [explanation]. See also [slide-99].", simSources);
    expect(c.citations).toEqual(["explanation"]);
    expect(c.dropped).toEqual(["slide-99"]);
    expect(c.text).not.toContain("slide-99");
  });

  it("detects escalation and strips the marker", () => {
    const c = checkReply(`That isn't in your lecture. Ask your lecturer. ${ESCALATE}`, lectureSources);
    expect(c.escalated).toBe(true);
    expect(c.text).not.toContain(ESCALATE);
  });

  it("replaces any reply that talks about diagnoses", () => {
    const c = checkReply("You might have ADHD if you skim.", lectureSources);
    expect(c.replaced).toBe(true);
    expect(c.text).toMatch(/never diagnose/);
  });
});

describe("offline coach", () => {
  it("answers from the best slide with a citation and a question back", () => {
    const r = offlineReply("what was the cambrian explosion", lectureSources, "ask");
    expect(r).toMatch(/\[slide-\d\]/);
    expect(r).toMatch(/\?$/);
    expect(offlineReply("cambrian", lectureSources, "hint")).toMatch(/^Here's a hint/);
  });

  it("escalates when the lecture doesn't cover it", () => {
    expect(offlineReply("how do I fix my bike gears", lectureSources, "ask")).toContain(ESCALATE);
  });
});

describe("coachTurn", () => {
  it("streams model text, then guards it", async () => {
    const fake: StreamFn = async function* (system, messages) {
      expect(system).toBe(COACH_SYSTEM);
      expect(messages.at(-1)!.content).toContain("<sources>");
      yield "Mass doesn't change the fall time ";
      yield "[explanation] [made-up]. What else changes with mass?";
    };
    const events: CoachEvent[] = [];
    const c = await coachTurn({ history: [], message: "does mass matter when falling", mode: "ask", patterns: [], sources: simSources }, fake, (e) => events.push(e));
    expect(events[0]).toMatchObject({ type: "sources" });
    expect(events.filter((e) => e.type === "delta")).toHaveLength(2);
    expect(c.citations).toEqual(["explanation"]);
    expect(c.dropped).toEqual(["made-up"]);
    expect(events.at(-1)).toMatchObject({ type: "final", offline: false });
  });

  it("falls back to the offline coach without a model", async () => {
    const events: CoachEvent[] = [];
    const c = await coachTurn({ history: [], message: "what is deep time", mode: "ask", patterns: [], sources: lectureSources }, null, (e) => events.push(e));
    expect(c.citations.length).toBe(1);
    expect(events.at(-1)).toMatchObject({ type: "final", offline: true });
  });

  it("only sends recent history to the model", async () => {
    let sent = 0;
    const fake: StreamFn = async function* (_s, messages) {
      sent = messages.length;
      yield "ok";
    };
    const history = Array.from({ length: 30 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", content: `m${i}` }));
    await coachTurn({ history, message: "x", mode: "ask", patterns: [], sources: lectureSources }, fake, () => {});
    expect(sent).toBe(13);
  });
});

describe("retrieval synonyms", () => {
  it("finds 'heavier' text from a question about mass", () => {
    expect(retrieve(simSources, "why doesn't mass change the result")[0]?.source.id).toBeDefined();
    expect(offlineReply("why doesn't mass change the result", simSources, "ask")).not.toContain(ESCALATE);
  });
});

describe("Pip's tones", () => {
  it("changes delivery, never the citation", () => {
    const quest = offlineReply("what is deep time", lectureSources, "ask", "quest");
    expect(quest).toMatch(/^New quest accepted![\s\S]*\[slide-1\][\s\S]*\(\+10 XP\)$/);
    const funny = offlineReply("what is deep time", lectureSources, "ask", "funny");
    expect(funny).toMatch(/\[slide-1\]/);
    expect(funny).toMatch(/dated|argon|gravitate|granite/);
    expect(offlineReply("what is deep time", lectureSources, "hint", "quest")).toMatch(/^Power-up unlocked![\s\S]*\(\+5 XP\)$/);
  });

  it("puts the tone in the request and keeps the rules in the system prompt", () => {
    expect(coachRequest("hi", lectureSources.slice(0, 1), "ask", [], "quest")).toContain("<tone>quest</tone>");
    expect(COACH_SYSTEM).toMatch(/You are Pip/);
    expect(COACH_SYSTEM).toMatch(/changes delivery only, never the rules/);
  });
});
