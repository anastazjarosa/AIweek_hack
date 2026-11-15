import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, streamCoach } from "@/lib/ai/claude";
import { log, sessionOf } from "@/lib/ai/log";
import { coachTurn } from "@/lib/coach/coach";
import { sourcesFor } from "@/lib/coach/sources";
import { getEscalation, resolveEscalation } from "@/lib/teacher/store";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const item = getEscalation(id);
  if (!item || item.session !== sessionOf(req.headers)) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  return NextResponse.json({
    id: item.id,
    status: item.status,
    answer: item.answer,
    resolution: item.resolution,
  });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const item = getEscalation(id);
  if (!item) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (item.status !== "open") return NextResponse.json({ error: "This review has already been resolved." }, { status: 409 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object") return NextResponse.json({ error: "Send a review action." }, { status: 400 });
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }

  const action = body.action;
  if (action === "answer" || action === "override") {
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (!answer || answer.length > 2000) return NextResponse.json({ error: "Write a response up to 2000 characters." }, { status: 400 });
    const resolved = resolveEscalation(id, action, answer);
    if (!resolved) return NextResponse.json({ error: "This review has already been resolved." }, { status: 409 });
    log({ session: item.session, agent: "teacher", event: `human ${action}`, detail: answer.slice(0, 120) });
    return NextResponse.json({ escalation: resolved });
  }

  if (action !== "resume") return NextResponse.json({ error: "Choose answer, override or resume." }, { status: 400 });
  const guidance = typeof body.guidance === "string" ? body.guidance.trim() : "";
  if (!guidance || guidance.length > 2000) return NextResponse.json({ error: "Write guidance up to 2000 characters before resuming." }, { status: 400 });
  if (item.trigger === "high_stakes") {
    return NextResponse.json({ error: "High-stakes decisions must be answered or overridden by a human, not resumed by the coach." }, { status: 400 });
  }

  try {
    const checked = await coachTurn(
      {
        history: item.checkpoint.history,
        message: item.question,
        mode: item.checkpoint.mode,
        tone: item.checkpoint.tone,
        patterns: item.checkpoint.patterns,
        sources: sourcesFor(item.checkpoint.contextData),
        guidance,
      },
      aiEnabled() ? streamCoach : null,
      () => {},
    );
    if (checked.escalated) {
      return NextResponse.json({ error: "The coach still needs human review. Add a direct answer or override instead." }, { status: 409 });
    }
    const resolved = resolveEscalation(id, "resume", checked.text, guidance);
    if (!resolved) return NextResponse.json({ error: "This review has already been resolved." }, { status: 409 });
    log({ session: item.session, agent: "teacher", event: "coach resumed with human guidance", detail: guidance.slice(0, 120) });
    return NextResponse.json({ escalation: resolved });
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`[teacher/escalations] API error ${error.status}`, error.message);
    else console.error("[teacher/escalations]", error);
    return NextResponse.json({ error: "The coach could not resume. The review remains open; try again or provide a direct answer." }, { status: 502 });
  }
}
