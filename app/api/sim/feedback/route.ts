import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, askFeedback } from "@/lib/ai/claude";
import { clientKey, createLimiter } from "@/lib/ai/rate-limit";
import { coachFeedback } from "@/lib/ai/sim-agent";
import { EXPLANATION_MAX, type FeedbackResponse } from "@/lib/sim/api-types";
import { checkSpec } from "@/lib/sim/spec";

export const runtime = "nodejs";
export const maxDuration = 60;

const limit = createLimiter(20, 60_000);
const json = (body: FeedbackResponse, status = 200) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  let body: { spec?: unknown; guess?: unknown; explanation?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ source: "error", error: "Send JSON." }, 400);
  }
  const { guess, explanation } = body;
  // The spec comes from the browser, so it is checked like any other untrusted spec.
  const check = checkSpec(body.spec);
  if (!check.ok) return json({ source: "error", error: "Unknown simulation." }, 400);
  if (guess !== "up" && guess !== "down" && guess !== "same") return json({ source: "error", error: "Missing prediction." }, 400);
  if (typeof explanation !== "string" || !explanation.trim() || explanation.length > EXPLANATION_MAX) {
    return json({ source: "error", error: `Write an explanation up to ${EXPLANATION_MAX} characters.` }, 400);
  }

  if (!aiEnabled()) return json({ source: "offline" });
  if (!limit(clientKey(req.headers))) return json({ source: "offline" });

  try {
    const feedback = await coachFeedback(check.spec, guess, explanation.trim(), askFeedback);
    return json(feedback ? { source: "ai", feedback } : { source: "offline" });
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.error(`[sim/feedback] API error ${e.status}`, e.message);
    else console.error("[sim/feedback]", e);
    return json({ source: "offline" });
  }
}
