import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, askDesign } from "@/lib/ai/claude";
import { clientKey, createLimiter } from "@/lib/ai/rate-limit";
import { designSim } from "@/lib/ai/sim-agent";
import { QUESTION_MAX, type GenerateResponse } from "@/lib/sim/api-types";
import { closestSim } from "@/lib/sim/match";

export const runtime = "nodejs";
export const maxDuration = 120;

const limit = createLimiter(8, 60_000);
// Same question, same experiment: instant on repeat (and on a page refresh mid-pitch).
const cache = new Map<string, GenerateResponse>();
const normalise = (q: string) => q.toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/, "").trim();

const json = (body: GenerateResponse, status = 200) => NextResponse.json(body, { status });

function offline(question: string, note: string): GenerateResponse {
  const spec = closestSim(question);
  return spec
    ? { source: "library", spec, note }
    : { source: "none", reason: "None of the ready-made experiments match that question yet.", suggestion: null };
}

export async function POST(req: Request) {
  let question: unknown;
  try {
    ({ question } = await req.json());
  } catch {
    return json({ source: "error", error: "Send JSON with a question." }, 400);
  }
  if (typeof question !== "string" || question.trim().length < 3 || question.length > QUESTION_MAX) {
    return json({ source: "error", error: `Ask a question between 3 and ${QUESTION_MAX} characters.` }, 400);
  }
  const q = question.trim();
  const key = normalise(q);
  const hit = cache.get(key);
  if (hit) return json(hit);

  if (!aiEnabled()) return json(offline(q, "Live AI is off, so here is the closest ready-made experiment."));
  if (!limit(clientKey(req.headers))) {
    return json({ source: "error", error: "That's a lot of experiments in a minute. Try again shortly." }, 429);
  }

  try {
    const r = await designSim(q, askDesign);
    const body: GenerateResponse =
      r.kind === "ai"
        ? { source: "ai", spec: r.spec }
        : r.kind === "none"
          ? { source: "none", reason: r.reason, suggestion: closestSim(q) }
          : offline(q, "The AI couldn't build that one, so here is the closest ready-made experiment.");
    if (body.source !== "library") cache.set(key, body);
    if (r.kind === "failed") console.warn("[sim/generate] agent failed", r.errors);
    return json(body);
  } catch (e) {
    // Network, credit or API trouble: never leave the student stuck on stage.
    if (e instanceof Anthropic.APIError) console.error(`[sim/generate] API error ${e.status}`, e.message);
    else console.error("[sim/generate]", e);
    return json(offline(q, "The AI is unavailable right now, so here is the closest ready-made experiment."));
  }
}
