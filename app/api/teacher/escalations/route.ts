import { NextResponse } from "next/server";
import { recentLogs } from "@/lib/ai/log";
import { listEscalations } from "@/lib/teacher/store";

export const runtime = "nodejs";

export async function GET() {
  const escalations = listEscalations();
  const sessions = new Set(escalations.map((item) => item.session));
  const logs = recentLogs(200).filter((entry) => sessions.has(entry.session));
  return NextResponse.json({ escalations, logs });
}
