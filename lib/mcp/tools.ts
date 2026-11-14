// The Simulation Lab as MCP tools. Plain async functions over the same engine and agent the app
// uses; mcp/server.ts registers them. Kept free of MCP types so they are unit tested directly.

import { z } from "zod";
import type { Ask } from "@/lib/ai/sim-agent";
import { designSim } from "@/lib/ai/sim-agent";
import type { AiResult } from "@/lib/sim/ai-spec";
import { findSim, library } from "@/lib/sim/library";
import { closestSim } from "@/lib/sim/match";
import { shareUrl } from "@/lib/sim/share";
import {
  checkSpec,
  directionWords,
  formatMetric,
  paramsFor,
  predictionOutcome,
  runSpec,
  startValues,
  templateOf,
  type SimSpec,
} from "@/lib/sim/spec";
import { templateIds, templates } from "@/lib/sim/templates";

export type ToolDeps = { ask: Ask<AiResult> | null; baseUrl: string };

/** Accepts a library id or a full spec (e.g. one returned by create_simulation). */
export const simRef = {
  simulation_id: z.string().optional().describe("id of a ready-made simulation (see list_simulations)"),
  spec: z.unknown().optional().describe("a full simulation spec, as returned by create_simulation"),
};

function resolve(args: { simulation_id?: string; spec?: unknown }): SimSpec {
  if (args.spec !== undefined) {
    const c = checkSpec(args.spec);
    if (!c.ok) throw new Error(`Invalid spec: ${c.errors.join("; ")}`);
    return c.spec;
  }
  const s = args.simulation_id ? findSim(args.simulation_id) : undefined;
  if (!s) throw new Error(`Unknown simulation_id. Call list_simulations for valid ids.`);
  return s;
}

function describe(spec: SimSpec, baseUrl: string) {
  const t = templateOf(spec);
  return {
    id: spec.id,
    title: spec.title,
    subject: t.subject,
    model: t.name,
    question: spec.question,
    intro: spec.intro,
    prediction: spec.prediction.prompt,
    sliders: paramsFor(spec)
      .filter((p) => !p.hidden)
      .map((p) => ({ id: p.id, label: p.label, unit: p.unit, min: p.min, max: p.max, default: p.default })),
    results: t.metrics.map((m) => ({ id: m.id, label: m.label, unit: m.unit })),
    open_url: shareUrl(spec, baseUrl),
  };
}

export async function listSimulations({ baseUrl }: ToolDeps) {
  return {
    simulations: library.map((s) => ({ id: s.id, title: s.title, subject: templateOf(s).subject, question: s.question, open_url: shareUrl(s, baseUrl) })),
    templates: templateIds.map((id) => ({ id, subject: templates[id].subject, name: templates[id].name, summary: templates[id].summary })),
  };
}

export async function createSimulation({ question }: { question: string }, { ask, baseUrl }: ToolDeps) {
  const q = question.trim().slice(0, 300);
  if (ask) {
    const r = await designSim(q, ask);
    if (r.kind === "ai") return { source: "ai", simulation: describe(r.spec, baseUrl), spec: r.spec };
    if (r.kind === "none") {
      const s = closestSim(q);
      return { source: "none", reason: r.reason, closest: s ? describe(s, baseUrl) : null };
    }
  }
  const s = closestSim(q);
  return s
    ? { source: "library", note: ask ? "The agent couldn't build a new one; this is the closest ready-made experiment." : "Live AI is off; this is the closest ready-made experiment.", simulation: describe(s, baseUrl), spec: s }
    : { source: "none", reason: "No ready-made experiment matches, and live AI is off.", closest: null };
}

export async function runSimulation(args: { simulation_id?: string; spec?: unknown; values?: Record<string, number> }) {
  const spec = resolve(args);
  const t = templateOf(spec);
  const known = new Set(t.params.map((p) => p.id));
  const unknown = Object.keys(args.values ?? {}).filter((k) => !known.has(k));
  if (unknown.length) throw new Error(`Unknown parameter(s): ${unknown.join(", ")}`);
  const values = { ...startValues(spec), ...args.values };
  const r = runSpec(spec, values);
  return {
    simulation: spec.id,
    values,
    results: t.metrics.map((m) => ({ id: m.id, label: m.label, value: r.metrics[m.id], text: formatMetric(r.metrics[m.id], m.unit) })),
    // A short summary of each line instead of every point.
    series: r.series.map((s) => {
      const ys = s.points.map((p) => p[1]);
      return { label: s.label, points: s.points.length, start: ys[0], end: ys.at(-1), min: Math.min(...ys), max: Math.max(...ys) };
    }),
  };
}

export async function checkPrediction(args: { simulation_id?: string; spec?: unknown; guess: "up" | "down" | "same" }) {
  const spec = resolve(args);
  const o = predictionOutcome(spec)!;
  const m = templateOf(spec).metrics.find((x) => x.id === spec.prediction.metric)!;
  return {
    prediction: spec.prediction.prompt,
    guess: args.guess,
    correct: args.guess === o.answer,
    actual: o.answer,
    summary: `${m.label} ${directionWords[o.answer]}: ${formatMetric(o.before, m.unit)} → ${formatMetric(o.after, m.unit)}.`,
    explanation: spec.explanation,
    key_ideas: spec.keyIdeas,
    // Same rule the app uses, so tutors talk about it the same way.
    tolerance_note: 'Changes under 5% count as "about the same".',
  };
}
