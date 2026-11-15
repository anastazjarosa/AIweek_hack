import { NextResponse } from "next/server";
import { log, sessionOf } from "@/lib/ai/log";
import { formatMetric, predictionOutcome, templateOf } from "@/lib/sim/spec";
import { getSettings } from "@/lib/teacher/classroom";
import { sampleDrafts } from "@/lib/teacher/sample";
import { listReviews, queueReview } from "@/lib/teacher/store";

export const runtime = "nodejs";

/** AI-built experiments for the teacher, each with the engine's own check of its answer. */
export async function GET() {
  const reviews = listReviews().map((r) => {
    const o = predictionOutcome(r.spec);
    const metric = templateOf(r.spec).metrics.find((m) => m.id === r.spec.prediction.metric)!;
    return {
      ...r,
      model: templateOf(r.spec).name,
      verified: o ? { answer: o.answer, metric: metric.label, before: formatMetric(o.before, metric.unit), after: formatMetric(o.after, metric.unit) } : null,
    };
  });
  return NextResponse.json({ reviews, settings: getSettings() });
}

/** { action: "sample" } queues two clearly labelled sample AI drafts for demos. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "sample") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  for (const d of sampleDrafts()) queueReview(d.question, d.spec);
  log({ session: sessionOf(req.headers), agent: "teacher", event: "queued sample AI drafts for review" });
  return NextResponse.json({ ok: true });
}
