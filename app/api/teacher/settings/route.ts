import { NextResponse } from "next/server";
import { log, sessionOf } from "@/lib/ai/log";
import { getSettings, updateSettings } from "@/lib/teacher/classroom";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

/** { requireApproval: boolean }: students wait for a teacher before seeing AI experiments. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { requireApproval?: unknown };
  if (typeof body.requireApproval !== "boolean") return NextResponse.json({ error: "Send requireApproval: true or false." }, { status: 400 });
  const s = updateSettings({ requireApproval: body.requireApproval });
  log({ session: sessionOf(req.headers), agent: "teacher", event: `approval before students see AI experiments: ${s.requireApproval ? "on" : "off"}` });
  return NextResponse.json(s);
}
