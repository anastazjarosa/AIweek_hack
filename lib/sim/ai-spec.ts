// The shape the AI agent returns, and its conversion into a SimSpec.
//
// Structured outputs can't express open-ended maps or number limits, so the AI fills a simpler
// schema (sliders as a list, null for "not set"). toSimSpec turns it into the app's SimSpec,
// which then goes through the same checkSpec as the hand-written library.

import { z } from "zod";
import { templateIds } from "@/lib/sim/templates";

export const aiSpecSchema = z.object({
  id: z.string().describe("lowercase words joined by hyphens, e.g. 'why-ice-floats'"),
  template: z.enum(templateIds as [string, ...string[]]),
  title: z.string().describe("short, friendly title, at most 6 words"),
  question: z.string().describe("the student's question, tidied up, ending with a question mark"),
  intro: z.string().describe("1-2 sentences setting the scene for the experiment"),
  minutes: z.number().int().describe("1-5"),
  params: z.array(
    z.object({
      id: z.string().describe("a parameter id of the chosen template"),
      default: z.number().nullable(),
      min: z.number().nullable(),
      max: z.number().nullable(),
      hidden: z.boolean(),
    }),
  ),
  prediction: z.object({
    prompt: z.string().describe("names the change and asks what happens to the metric, without hinting at the answer"),
    param: z.string(),
    from: z.number(),
    to: z.number(),
    metric: z.string(),
  }),
  expectedAnswer: z.enum(["up", "down", "same"]).describe("which way you expect the metric to move; the engine checks this"),
  explanation: z.string(),
  keyIdeas: z.array(z.string()).describe("2-4 short ideas"),
  misconception: z.string().nullable(),
  realWorld: z.string().nullable(),
});

export const aiResultSchema = z.object({
  fits: z.boolean().describe("false when no template really models the question, or it is not a science learning question"),
  reason: z.string().describe("one sentence: why this template fits, or why none does"),
  spec: aiSpecSchema.nullable(),
});

export type AiSpec = z.infer<typeof aiSpecSchema>;
export type AiResult = z.infer<typeof aiResultSchema>;

/** Converts the AI's shape into SimSpec input for checkSpec. */
export function toSimSpec(a: AiSpec): Record<string, unknown> {
  const params: Record<string, { default?: number; min?: number; max?: number; hidden?: boolean }> = {};
  for (const p of a.params) {
    params[p.id] = {
      ...(p.default != null && { default: p.default }),
      ...(p.min != null && { min: p.min }),
      ...(p.max != null && { max: p.max }),
      ...(p.hidden && { hidden: true }),
    };
  }
  return {
    id: a.id,
    template: a.template,
    title: a.title,
    question: a.question,
    intro: a.intro,
    minutes: Math.min(10, Math.max(1, Math.round(a.minutes))),
    params,
    prediction: a.prediction,
    explanation: a.explanation,
    keyIdeas: a.keyIdeas.slice(0, 4),
    ...(a.misconception && { misconception: a.misconception }),
    ...(a.realWorld && { realWorld: a.realWorld }),
  };
}

export const feedbackSchema = z.object({
  ideas: z.array(z.boolean()).describe("one entry per key idea, in order: true if the student's explanation expresses it"),
  misconception: z.boolean().describe("true if the explanation contains the misconception or another clear scientific error"),
  feedback: z.string().describe("2-3 sentences, at most 60 words"),
});

export type Feedback = z.infer<typeof feedbackSchema>;
