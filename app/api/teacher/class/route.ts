import { NextResponse } from "next/server";
import { log, sessionOf } from "@/lib/ai/log";
import { classInsights, clearSample, MIN_GROUP } from "@/lib/teacher/classroom";
import { seedSampleClass } from "@/lib/teacher/sample";

export const runtime = "nodejs";

/** Anonymous class misconceptions, most misunderstood first. Groups under MIN_GROUP are withheld. */
export async function GET() {
  return NextResponse.json({ ...classInsights(), minGroup: MIN_GROUP });
}

/** { action: "sample" | "clear-sample" }: a clearly labelled sample class for demos. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === "sample") {
    clearSample();
    seedSampleClass();
  } else if (body.action === "clear-sample") clearSample();
  else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  log({ session: sessionOf(req.headers), agent: "teacher", event: body.action === "sample" ? "loaded the sample class" : "cleared the sample class" });
  return NextResponse.json({ ok: true });
}
