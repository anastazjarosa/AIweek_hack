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

/** A step in the agent pipeline, streamed to the student so the guardrails are visible. */
export type TraceEvent =
  | { step: "designer"; attempt: number; text: string }
  | { step: "proposal"; text: string }
  | { step: "verifier"; ok: boolean; text: string }
  | { step: "result"; ok: boolean; text: string };

/** Designs a simulation for a student's question, retrying with the checker's errors. */
export async function designSim(question: string, ask: Ask<AiResult>, trace: (e: TraceEvent) => void = () => {}): Promise<DesignOutcome> {
  const messages: Message[] = [{ role: "user", content: designRequest(question) }];
  let errors: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    trace({ step: "designer", attempt, text: attempt === 1 ? "Designer agent is choosing a tested model" : `Designer agent is fixing the spec (try ${attempt})` });
    const r = await ask(messages);
    if (r.refused) {
      trace({ step: "result", ok: false, text: "Declined by the safety system" });
      return { kind: "none", reason: "That isn't something the lab can help with." };
    }
    if (!r.parsed) {
      errors = ["the response was not valid JSON for the schema"];
      trace({ step: "verifier", ok: false, text: "Output didn't match the schema, sent back" });
    } else if (!r.parsed.fits || !r.parsed.spec) {
      trace({ step: "result", ok: false, text: "No tested model fits this question" });
      return { kind: "none", reason: r.parsed.reason };
    } else {
      trace({ step: "proposal", text: `Proposed “${r.parsed.spec.title}” on the ${r.parsed.spec.template} model` });
      const check = checkSpec(toSimSpec(r.parsed.spec));
      if (!check.ok) {
        errors = check.errors;
        trace({ step: "verifier", ok: false, text: `Spec check failed: ${check.errors[0]}${check.errors.length > 1 ? ` (+${check.errors.length - 1} more)` : ""}` });
      } else {
        const spec = check.spec;
        const outcome = predictionOutcome(spec)!;
        if (outcome.answer === r.parsed.spec.expectedAnswer) {
          trace({ step: "verifier", ok: true, text: "Engine ran the fair test and agrees with the explanation" });
          trace({ step: "result", ok: true, text: "Experiment ready" });
          return { kind: "ai", spec, attempts: attempt };
        }
        trace({ step: "verifier", ok: false, text: `Engine disagrees: expected “${r.parsed.spec.expectedAnswer}”, the model shows “${outcome.answer}”. Sent back` });
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
