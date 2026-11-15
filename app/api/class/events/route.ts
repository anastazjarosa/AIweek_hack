import { NextResponse } from "next/server";
import { clientKey, createLimiter } from "@/lib/ai/rate-limit";
import { findSim } from "@/lib/sim/library";
import { checkSpec, predictionOutcome, templateOf, type Direction } from "@/lib/sim/spec";
import { recordExplanation, recordPrediction } from "@/lib/teacher/classroom";

export const runtime = "nodejs";

const limit = createLimiter(60, 60_000);
const DIRS: Direction[] = ["up", "down", "same"];

/**
 * Anonymous class signal. No session, no name: only which experiment and what was guessed.
 * { kind: "prediction", simId? | spec?, guess } or { kind: "explanation", simId, covered, possible }.
 * The right answer is worked out here by the engine, never taken from the browser.
 */
export async function POST(req: Request) {
  if (!limit(clientKey(req.headers))) return NextResponse.json({ ok: false }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const spec = typeof b.simId === "string" && findSim(b.simId) ? findSim(b.simId)! : (() => {
    const c = checkSpec(b.spec);
    return c.ok ? c.spec : null;
  })();
  if (!spec) return NextResponse.json({ error: "Unknown experiment." }, { status: 400 });

  if (b.kind === "explanation") {
    const covered = Number(b.covered);
    const possible = Number(b.possible);
    if (!Number.isFinite(covered) || !Number.isFinite(possible)) return NextResponse.json({ error: "Bad counts." }, { status: 400 });
    recordExplanation(spec.id, covered, possible);
    return NextResponse.json({ ok: true });
  }
  if (!DIRS.includes(b.guess as Direction)) return NextResponse.json({ error: "Bad guess." }, { status: 400 });
  const o = predictionOutcome(spec)!;
  const metric = templateOf(spec).metrics.find((m) => m.id === spec.prediction.metric)!.label;
  recordPrediction({ simId: spec.id, title: spec.title, metric, guess: b.guess as Direction, answer: o.answer, misconception: spec.misconception });
  return NextResponse.json({ ok: true });
}
