// Simulation specs: the story around a template (question, sliders, prediction, explanation).
//
// Specs may come from the hand-written library or from the AI agent, so every spec is parsed and
// then checked against its template. The right answer to the prediction is never taken from the
// spec: the engine runs both conditions and compares the results itself.

import { z } from "zod";
import { templateIds, templates, valuesFor, type ParamDef, type Result, type Template, type Values } from "@/lib/sim/templates";

const text = (max: number) => z.string().trim().min(1).max(max);

export const simSpecSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase words joined by hyphens")
    .max(60),
  template: z.enum(templateIds as [string, ...string[]]),
  title: text(80),
  /** The question a student would ask, e.g. "Do heavier things fall faster?" */
  question: text(140),
  intro: text(400),
  minutes: z.number().int().min(1).max(10),
  /** Narrow or hide template parameters. Hidden ones stay at their default. */
  params: z
    .record(
      z.string(),
      z.object({
        default: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        hidden: z.boolean().optional(),
      }),
    )
    .default({}),
  prediction: z.object({
    /** Plain-language version, e.g. "Make the ball 10 times heavier. What happens to the fall time?" */
    prompt: text(220),
    param: z.string(),
    from: z.number(),
    to: z.number(),
    metric: z.string(),
  }),
  /** The full answer, shown after the student has had a go. */
  explanation: text(900),
  /** 2-4 short ideas a good explanation includes. */
  keyIdeas: z.array(text(160)).min(1).max(4),
  /** The common wrong idea this simulation targets, in the student's words. */
  misconception: text(200).optional(),
  realWorld: text(300).optional(),
});

export type SimSpec = z.infer<typeof simSpecSchema>;
export type Direction = "up" | "down" | "same";

/** Changes smaller than this share of the starting value count as "about the same". */
export const SAME_TOLERANCE = 0.05;

/** The template's parameters as this spec shows them: narrowed ranges and new defaults. */
export function paramsFor(spec: SimSpec): (ParamDef & { hidden: boolean })[] {
  const t = templates[spec.template as keyof typeof templates];
  return t.params.map((p) => {
    const o = spec.params[p.id] ?? {};
    const min = Math.max(p.min, o.min ?? p.min);
    const max = Math.min(p.max, o.max ?? p.max);
    const def = Math.min(max, Math.max(min, o.default ?? p.default));
    return { ...p, min, max, default: def, hidden: !!o.hidden };
  });
}

export const templateOf = (spec: SimSpec): Template => templates[spec.template as keyof typeof templates];

/** Starting slider values: the spec defaults, with the prediction parameter at its "from" value. */
export function startValues(spec: SimSpec): Values {
  const defaults = Object.fromEntries(paramsFor(spec).map((p) => [p.id, p.default]));
  return valuesFor(templateOf(spec), { ...defaults, [spec.prediction.param]: spec.prediction.from });
}

export function runSpec(spec: SimSpec, values: Values): Result {
  return templateOf(spec).run(valuesFor(templateOf(spec), values));
}

export function direction(before: number, after: number): Direction {
  const scale = Math.max(Math.abs(before), 1e-9);
  if (Math.abs(after - before) / scale < SAME_TOLERANCE) return "same";
  return after > before ? "up" : "down";
}

/** Runs both conditions of the prediction and returns what really happens. */
export function predictionOutcome(spec: SimSpec) {
  const base = startValues(spec);
  const p = spec.prediction;
  const before = runSpec(spec, { ...base, [p.param]: p.from }).metrics[p.metric];
  const after = runSpec(spec, { ...base, [p.param]: p.to }).metrics[p.metric];
  if (before == null || after == null || !Number.isFinite(before) || !Number.isFinite(after)) return null;
  return { before, after, answer: direction(before, after) };
}

export type SpecCheck = { ok: true; spec: SimSpec } | { ok: false; errors: string[] };

/** Parses any input (library JSON or AI output) and checks it against its template. */
export function checkSpec(input: unknown): SpecCheck {
  const parsed = simSpecSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "spec"}: ${i.message}`) };
  }
  const spec = parsed.data;
  const t = templateOf(spec);
  const errors: string[] = [];
  const known = new Set(t.params.map((p) => p.id));

  for (const [id, o] of Object.entries(spec.params)) {
    if (!known.has(id)) errors.push(`params.${id}: not a parameter of ${t.id}`);
    if (o.min !== undefined && o.max !== undefined && o.min >= o.max) errors.push(`params.${id}: min must be below max`);
  }

  const p = spec.prediction;
  const param = paramsFor(spec).find((x) => x.id === p.param);
  if (!param) errors.push(`prediction.param: ${p.param} is not a parameter of ${t.id}`);
  else {
    if (param.hidden) errors.push("prediction.param: cannot be a hidden parameter");
    for (const k of ["from", "to"] as const) {
      if (p[k] < param.min || p[k] > param.max) errors.push(`prediction.${k}: must be between ${param.min} and ${param.max}`);
    }
    if (p.from === p.to) errors.push("prediction: from and to must differ");
  }
  if (!t.metrics.some((m) => m.id === p.metric)) errors.push(`prediction.metric: ${p.metric} is not a result of ${t.id}`);

  if (!errors.length && !predictionOutcome(spec)) errors.push("prediction: the result can't be measured for these values");
  return errors.length ? { ok: false, errors } : { ok: true, spec };
}

// ---------- Formatting ----------

/** 3 significant figures, without scientific notation for everyday sizes. */
export function formatNumber(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1000) return Math.round(n).toLocaleString("en-GB");
  if (abs >= 0.001) return Number(n.toPrecision(3)).toString();
  return n.toExponential(2);
}

export function formatMetric(value: number | null | undefined, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const v = formatNumber(value);
  if (!unit) return v;
  return unit === "%" || unit === "°" ? `${v}${unit}` : `${v} ${unit}`;
}

export const directionWords: Record<Direction, string> = {
  up: "goes up",
  down: "goes down",
  same: "stays about the same",
};
