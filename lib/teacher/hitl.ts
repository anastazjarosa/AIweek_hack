import { retrieve, type Source } from "@/lib/coach/sources";
import type { Turn } from "@/lib/coach/coach";
import type { EscalationTrigger } from "@/lib/teacher/store";

const HIGH_STAKES = /\b(?:grading|grade|marks?|scoring|score|pass or fail|fail(?:ing)?|plagiaris\w*|academic misconduct|flag(?:ging)?|disciplin\w*)\b/i;
const AMBIGUOUS = /\b(?:ambiguous|ambiguity|unclear|uncertain|conflicting|contradictory|edge cases?|not sure which|can't decide|cannot decide)\b/i;

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export type EscalationDecision = { trigger: EscalationTrigger; reason: string; confidence: number } | null;

/** Returns the explicit pause condition and a bounded retrieval-confidence estimate. */
export function escalationDecision(input: {
  message: string;
  history: Turn[];
  sources: Source[];
  agentRequested?: boolean;
  /** "hint" and "check" deliberately re-send the last question, so they never count as going in circles. */
  mode?: "ask" | "hint" | "check";
}): EscalationDecision {
  const hits = retrieve(input.sources, input.message, 3);
  const confidence = Math.min(1, (hits[0]?.score ?? 0) / 6);

  if (HIGH_STAKES.test(input.message)) {
    return { trigger: "high_stakes", reason: "Formal grading, flagging or disciplinary decisions require a human.", confidence };
  }
  if (AMBIGUOUS.test(input.message)) {
    return { trigger: "ambiguous", reason: "The question identifies an unclear or conflicting edge case.", confidence };
  }

  const current = normalise(input.message);
  const repeated = (input.mode ?? "ask") === "ask" && current.length >= 12 && input.history
    .filter((turn) => turn.role === "user")
    .slice(-8)
    .some((turn) => normalise(turn.content) === current);
  if (repeated) {
    return { trigger: "circular", reason: "The same question has returned without resolution.", confidence };
  }
  if (input.agentRequested) {
    return { trigger: "agent_requested", reason: "The coach requested human review because it could not answer confidently.", confidence };
  }
  if (confidence < 0.3) {
    return { trigger: "low_confidence", reason: "The retrieved course material provides insufficient evidence for a reliable answer.", confidence };
  }
  return null;
}
