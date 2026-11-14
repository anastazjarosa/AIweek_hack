// Server only: the real Claude calls behind the simulation agent. Imported by route handlers,
// never by client components (it reads the API key from the environment).

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { DESIGN_SYSTEM, FEEDBACK_SYSTEM } from "@/lib/ai/prompts";
import type { Ask } from "@/lib/ai/sim-agent";
import { aiResultSchema, feedbackSchema, type AiResult, type Feedback } from "@/lib/sim/ai-spec";

export const MODEL = "claude-opus-5-5";

/**
 * Live AI runs when credentials are set and MOSAIC_AI isn't "off". Set MOSAIC_AI=off on stage to
 * force the offline path (library match, self-check) whatever the network does.
 */
export function aiEnabled(): boolean {
  if (process.env.MOSAIC_AI === "off") return false;
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 }));

function makeAsk<T>(system: string, schema: z.ZodType<T>, effort: "low" | "medium"): Ask<T> {
  return async (messages) => {
    const r = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // On a safety decline, the API re-runs the request on a suitable fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // The system prompt is fixed, so it is cached across students and retries.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    const refused = r.stop_reason === "refusal";
    return {
      parsed: refused ? null : (r.parsed_output as T | null),
      content: r.content as Anthropic.Beta.Messages.BetaMessageContentParam,
      refused,
    };
  };
}

export const askDesign: Ask<AiResult> = makeAsk(DESIGN_SYSTEM, aiResultSchema, "medium");
export const askFeedback: Ask<Feedback> = makeAsk(FEEDBACK_SYSTEM, feedbackSchema, "low");
