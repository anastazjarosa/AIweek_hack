import { NextResponse } from "next/server";
import { getReview } from "@/lib/teacher/store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Student side: is my experiment approved yet? The spec is only returned once approved. */
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const r = getReview(id);
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ status: r.status, note: r.note, ...(r.status === "approved" ? { spec: r.spec } : {}) });
}
