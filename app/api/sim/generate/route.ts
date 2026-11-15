import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, askDesign } from "@/lib/ai/claude";
import { screenQuestion } from "@/lib/ai/guard";
import { clientKey, createLimiter } from "@/lib/ai/rate-limit";
import { designSim, type TraceEvent } from "@/lib/ai/sim-agent";
import { QUESTION_MAX, type GenerateResponse } from "@/lib/sim/api-types";
import { closestSim } from "@/lib/sim/match";

export const runtime = "nodejs";
export const maxDuration = 120;

const limit = createLimiter(8, 60_000);
// Same question, same experiment: instant on repeat (and on a page refresh mid-pitch).
const cache = new Map<string, GenerateResponse>();
const normalise = (q: string) => q.toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/, "").trim();

type Emit = (e: TraceEvent | { step: "guard"; ok: boolean; text: string }) => void;

function offline(question: string, note: string, emit: Emit): GenerateResponse {
  emit({ step: "designer", attempt: 1, text: "Matching your question to the ready-made experiments" });
  const spec = closestSim(question);
  emit({ step: "result", ok: !!spec, text: spec ? `Closest match: “${spec.title}”` : "No ready-made experiment matches" });
  return spec
    ? { source: "library", spec, note }
    : { source: "none", reason: "None of the ready-made experiments match that question yet.", suggestion: null };
}

/**
 * The pipeline: input guard → cache → designer agent (Claude) → engine verifier → result, with an
 * offline fallback at every failure point. `emit` streams each step to the student.
 */
async function produce(q: string, client: string, emit: Emit): Promise<{ body: GenerateResponse; status: number }> {
  const screen = screenQuestion(q);
  emit({ step: "guard", ok: screen.ok, text: screen.ok ? "Input check passed: a science question, no instructions to the AI" : screen.reason });
  if (!screen.ok) return { body: { source: "error", error: screen.reason }, status: 400 };

  const key = normalise(q);
  const hit = cache.get(key);
  if (hit) {
    emit({ step: "result", ok: true, text: "Built before: loaded instantly" });
    return { body: hit, status: 200 };
  }
  if (!aiEnabled()) return { body: offline(q, "Live AI is off, so here is the closest ready-made experiment.", emit), status: 200 };
  if (!limit(client)) return { body: { source: "error", error: "That's a lot of experiments in a minute. Try again shortly." }, status: 429 };

  try {
    const r = await designSim(q, askDesign, emit);
    const body: GenerateResponse =
      r.kind === "ai"
        ? { source: "ai", spec: r.spec }
        : r.kind === "none"
          ? { source: "none", reason: r.reason, suggestion: closestSim(q) }
          : offline(q, "The AI couldn't build that one, so here is the closest ready-made experiment.", emit);
    if (body.source !== "library") cache.set(key, body);
    if (r.kind === "failed") console.warn("[sim/generate] agent failed", r.errors);
    return { body, status: 200 };
  } catch (e) {
    // Network, credit or API trouble: never leave the student stuck (or a pitch frozen).
    if (e instanceof Anthropic.APIError) console.error(`[sim/generate] API error ${e.status}`, e.message);
    else console.error("[sim/generate]", e);
    emit({ step: "verifier", ok: false, text: "The AI service didn't answer, switching to offline mode" });
    return { body: offline(q, "The AI is unavailable right now, so here is the closest ready-made experiment.", emit), status: 200 };
  }
}

export async function POST(req: Request) {
  let question: unknown;
  try {
    ({ question } = await req.json());
  } catch {
    return NextResponse.json({ source: "error", error: "Send JSON with a question." } satisfies GenerateResponse, { status: 400 });
  }
  if (typeof question !== "string" || question.trim().length < 3 || question.length > QUESTION_MAX) {
    return NextResponse.json({ source: "error", error: `Ask a question between 3 and ${QUESTION_MAX} characters.` } satisfies GenerateResponse, { status: 400 });
  }
  const q = question.trim();
  const client = clientKey(req.headers);

  // Streaming mode: server-sent events, one per pipeline step, then the result.
  if (new URL(req.url).searchParams.get("stream") === "1") {
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        const { body } = await produce(q, client, (e) => send("trace", e));
        send("result", body);
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
  }

  const { body, status } = await produce(q, client, () => {});
  return NextResponse.json(body, { status });
}
