// Request and response shapes for /api/sim/*, shared by the route handlers and the client.

import type { Feedback } from "@/lib/sim/ai-spec";
import type { SimSpec } from "@/lib/sim/spec";

export const QUESTION_MAX = 300;
export const EXPLANATION_MAX = 1200;

export type GenerateResponse =
  /** The agent designed a new simulation. */
  | { source: "ai"; spec: SimSpec }
  /** Offline, or the agent failed: the closest ready-made simulation. */
  | { source: "library"; spec: SimSpec; note: string }
  /** Nothing fits; `suggestion` is the closest ready-made one, if any. */
  | { source: "none"; reason: string; suggestion: SimSpec | null }
  | { source: "error"; error: string };

export type FeedbackResponse = { source: "ai"; feedback: Feedback } | { source: "offline" } | { source: "error"; error: string };
