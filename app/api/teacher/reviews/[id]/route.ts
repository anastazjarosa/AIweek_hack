import { NextResponse } from "next/server";
import { log, sessionOf } from "@/lib/ai/log";
import { checkSpec, predictionOutcome } from "@/lib/sim/spec";
import { applyEdits, decideReview, getReview, type ReviewEdits } from "@/lib/teacher/store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Teacher decision on an AI-built experiment: { action: "approve" | "reject", note?, edits? }.
 * Edits change wording only and go through the same spec check as AI output; the verified answer
 * can't change.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const review = getReview(id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; note?: string; edits?: ReviewEdits };
  if (body.action !== "approve" && body.action !== "reject") return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 600) : undefined;
  if (body.action === "reject" && !note) return NextResponse.json({ error: "Add a short note so the student knows why." }, { status: 400 });

  let spec = review.spec;
  if (body.action === "approve" && body.edits && typeof body.edits === "object") {
    const check = checkSpec(applyEdits(review.spec, body.edits));
    if (!check.ok) return NextResponse.json({ error: `Those edits don't pass the checks: ${check.errors[0]}` }, { status: 400 });
    if (predictionOutcome(check.spec)?.answer !== predictionOutcome(review.spec)?.answer) {
      return NextResponse.json({ error: "Edits can't change the verified answer." }, { status: 400 });
    }
    spec = check.spec;
  }
  const decided = decideReview(id, body.action === "approve" ? "approved" : "rejected", note, spec);
  log({ session: sessionOf(req.headers), agent: "teacher", event: `${body.action === "approve" ? "approved" : "rejected"} AI experiment “${spec.title}”${body.edits ? " with edits" : ""}`, detail: note });
  return NextResponse.json({ review: decided });
}
