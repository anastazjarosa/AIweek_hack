import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, streamCoach } from "@/lib/ai/claude";
import { screenQuestion } from "@/lib/ai/guard";
import { log, sessionOf } from "@/lib/ai/log";
import { clientKey, createLimiter } from "@/lib/ai/rate-limit";
import { coachTurn, MESSAGE_MAX, offlineReply, TONES, type CoachMode, type Tone, type Turn } from "@/lib/coach/coach";
import { retrieve, sourcesFor, type CoachContext } from "@/lib/coach/sources";
import { patterns, type PatternId } from "@/lib/learner/patterns";
import { findSim } from "@/lib/sim/library";
import { checkSpec } from "@/lib/sim/spec";
import { escalate } from "@/lib/teacher/store";
import { escalationDecision } from "@/lib/teacher/hitl";

export const runtime = "nodejs";
export const maxDuration = 60;

const limit = createLimiter(20, 60_000);
const MODES: CoachMode[] = ["ask", "hint", "check"];
const PATTERN_IDS = new Set(patterns.map((p) => p.id));

/** Request contract: see docs/api.md. Everything from the browser is validated here. */
function parse(body: unknown): { ctx: CoachContext; title: string; history: Turn[]; message: string; mode: CoachMode; tone: Tone; patterns: PatternId[] } | string {
  if (!body || typeof body !== "object") return "Send JSON.";
  const b = body as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message || message.length > MESSAGE_MAX) return `Write a message up to ${MESSAGE_MAX} characters.`;
  const mode = MODES.includes(b.mode as CoachMode) ? (b.mode as CoachMode) : "ask";
  const tone = TONES.includes(b.tone as Tone) ? (b.tone as Tone) : "friendly";
  const history = (Array.isArray(b.history) ? b.history : [])
    .filter((t): t is Turn => !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .slice(-20)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
  const pats = (Array.isArray(b.patterns) ? b.patterns : []).filter((p): p is PatternId => PATTERN_IDS.has(p as PatternId));
  const c = b.context as Record<string, unknown> | undefined;
  if (c?.kind === "sim") {
    const spec = typeof c.simId === "string" ? findSim(c.simId) : undefined;
    const check = spec ? ({ ok: true, spec } as const) : checkSpec(c.spec);
    if (!check.ok) return "Unknown experiment.";
    return { ctx: { kind: "sim", spec: check.spec }, title: check.spec.title, history, message, mode, tone, patterns: pats };
  }
  return { ctx: { kind: "lecture" }, title: "Lecture: The story of life on Earth", history, message, mode, tone, patterns: pats };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }
  const input = parse(body);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  const session = sessionOf(req.headers);
  const sources = sourcesFor(input.ctx);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      const finish = (text: string, extra: Record<string, unknown> = {}) => {
        send("final", { text, citations: [], escalated: false, replaced: false, offline: true, ...extra });
        controller.close();
      };
      const interrupt = (decision: NonNullable<ReturnType<typeof escalationDecision>>, draft = "", selectedSources = sources.map(({ id, title }) => ({ id, title }))) => {
        const checkpoint = {
          history: input.history,
          contextData: input.ctx,
          mode: input.mode,
          tone: input.tone,
          patterns: input.patterns,
          sources: selectedSources,
          confidence: decision.confidence,
          ...(draft ? { draft: draft.slice(0, 4000) } : {}),
        };
        const item = escalate({
          session,
          question: input.message,
          context: input.title,
          trigger: decision.trigger,
          reason: decision.reason,
          checkpoint,
        });
        log({ session, agent: "coach", event: `interrupted for human review (${decision.trigger})`, detail: input.message.slice(0, 120) });
        send("interrupt", { id: item.id, trigger: item.trigger, reason: item.reason, confidence: item.checkpoint.confidence });
      };

      // 1. Input guard
      const screen = screenQuestion(input.message);
      log({ session, agent: "guard", event: screen.ok ? "passed" : `blocked: ${screen.kind}`, detail: input.message.slice(0, 120) });
      if (!screen.ok) return finish(screen.reason, { blocked: true });
      if (!limit(clientKey(req.headers))) return finish("Lots of questions in a minute! Take a breath and try again shortly.");

      const preflight = escalationDecision({ message: input.message, history: input.history, sources });
      if (preflight) {
        const evidence = retrieve(sources, input.message, 3).map(({ source }) => ({ id: source.id, title: source.title }));
        interrupt(preflight, "", evidence);
        controller.close();
        return;
      }

      // 2-4. Retrieve, answer (model or offline), output guard
      const live = aiEnabled();
      try {
        let draft = "";
        let selectedSources: { id: string; title: string; href?: string }[] = [];
        const checked = await coachTurn(
          { history: input.history, message: input.message, mode: input.mode, tone: input.tone, patterns: input.patterns, sources },
          live ? streamCoach : null,
          (e) => {
            if (e.type === "sources") {
              selectedSources = e.sources;
              send("sources", e.sources);
            } else if (e.type === "delta") {
              draft += e.text;
              send("delta", e.text);
            }
          },
        );
        log({ session, agent: "coach", event: `${input.mode}${live ? "" : " (offline)"}: ${checked.citations.length} citations${checked.dropped.length ? `, ${checked.dropped.length} invented dropped` : ""}${checked.replaced ? ", reply replaced by guard" : ""}`, detail: input.message.slice(0, 120) });
        const decision = escalationDecision({ message: input.message, history: input.history, sources, agentRequested: checked.escalated });
        if (decision) {
          interrupt(decision, draft, selectedSources);
        } else {
          send("final", { ...checked, offline: !live });
        }
      } catch (e) {
        if (e instanceof Anthropic.APIError) console.error(`[coach] API error ${e.status}`, e.message);
        else console.error("[coach]", e);
        log({ session, agent: "coach", event: "AI unavailable, answered offline" });
        send("delta", "");
        send("final", { text: offlineReply(input.message, sources, input.mode, input.tone).replace("[[ASK_TEACHER]]", "").trim(), citations: [], escalated: false, replaced: false, offline: true });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
