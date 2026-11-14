// The simulation agent's logic, independent of the network: ask, check, and ask again with the
// problems until the spec is valid and consistent with the real model. `ask` is injected so this
// file is unit tested without an API key; lib/ai/claude.ts supplies the real one.

import type Anthropic from "@anthropic-ai/sdk";
import { toSimSpec, type AiResult, type Feedback } from "@/lib/sim/ai-spec";
import { checkSpec, formatMetric, predictionOutcome, templateOf, type Direction, type SimSpec } from "@/lib/sim/spec";
import { designRequest, feedbackRequest, mismatchRequest, retryRequest } from "@/lib/ai/prompts";

type Message = Anthropic.Beta.BetaMessageParam;

/** One model turn. `content` is the raw assistant content, passed back unchanged on a retry. */
export type AskResult<T> = { parsed: T | null; content: Anthropic.Beta.Messages.BetaMessageContentParam; refused: boolean };
export type Ask<T> = (messages: Message[]) => Promise<AskResult<T>>;

export type DesignOutcome =
  | { kind: "ai"; spec: SimSpec; attempts: number }
  | { kind: "none"; reason: string }
  | { kind: "failed"; reason: string; errors: string[] };

export const MAX_ATTEMPTS = 3;

/** Designs a simulation for a student's question, retrying with the checker's errors. */
export async function designSim(question: string, ask: Ask<AiResult>): Promise<DesignOutcome> {
  const messages: Message[] = [{ role: "user", content: designRequest(question) }];
  let errors: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const r = await ask(messages);
    if (r.refused) return { kind: "none", reason: "That isn't something the lab can help with." };
    if (!r.parsed) {
      errors = ["the response was not valid JSON for the schema"];
    } else if (!r.parsed.fits || !r.parsed.spec) {
      return { kind: "none", reason: r.parsed.reason };
    } else {
      const check = checkSpec(toSimSpec(r.parsed.spec));
      if (!check.ok) {
        errors = check.errors;
      } else {
        const spec = check.spec;
        const outcome = predictionOutcome(spec)!;
        if (outcome.answer === r.parsed.spec.expectedAnswer) return { kind: "ai", spec, attempts: attempt };
        const metric = templateOf(spec).metrics.find((m) => m.id === spec.prediction.metric)!;
        errors = [`expectedAnswer ${r.parsed.spec.expectedAnswer} but the model shows ${outcome.answer}`];
        messages.push(
          { role: "assistant", content: r.content },
          {
            role: "user",
            content: mismatchRequest(
              metric.label.toLowerCase(),
              r.parsed.spec.expectedAnswer,
              outcome.answer,
              formatMetric(outcome.before, metric.unit),
              formatMetric(outcome.after, metric.unit),
            ),
          },
        );
        continue;
      }
    }
    messages.push({ role: "assistant", content: r.content }, { role: "user", content: retryRequest(errors) });
  }
  return { kind: "failed", reason: "The agent couldn't design a valid experiment.", errors };
}

/** Feedback on a student's explanation. Returns null when the answer can't be used. */
export async function coachFeedback(
  spec: SimSpec,
  guess: Direction,
  explanation: string,
  ask: Ask<Feedback>,
): Promise<Feedback | null> {
  const outcome = predictionOutcome(spec);
  if (!outcome) return null;
  const metric = templateOf(spec).metrics.find((m) => m.id === spec.prediction.metric)!;
  const r = await ask([
    { role: "user", content: feedbackRequest(spec, guess, outcome.answer, metric.label.toLowerCase(), explanation) },
  ]);
  if (r.refused || !r.parsed) return null;
  // Align the ideas with the spec, whatever length came back.
  const ideas = spec.keyIdeas.map((_, i) => r.parsed!.ideas[i] === true);
  return { ...r.parsed, ideas, feedback: r.parsed.feedback.trim() };
}
