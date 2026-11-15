// Teacher-side server state for the demo: questions the coach escalated, and AI-built experiments
// waiting for review. In memory, per server instance (a database in production).

import type { SimSpec } from "@/lib/sim/spec";

export type Escalation = { id: string; at: number; session: string; question: string; context: string; status: "open" | "answered"; answer?: string };
export type Review = { id: string; at: number; question: string; spec: SimSpec; status: "pending" | "approved" | "rejected"; note?: string };

const escalations: Escalation[] = [];
const reviews: Review[] = [];
let n = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

export function escalate(e: Omit<Escalation, "id" | "at" | "status">): Escalation {
  const item: Escalation = { ...e, id: id("q"), at: Date.now(), status: "open" };
  escalations.unshift(item);
  if (escalations.length > 200) escalations.pop();
  return item;
}

export function answerEscalation(eid: string, answer: string): Escalation | null {
  const e = escalations.find((x) => x.id === eid);
  if (!e) return null;
  e.status = "answered";
  e.answer = answer;
  return e;
}

export function listEscalations(session?: string): Escalation[] {
  return session ? escalations.filter((e) => e.session === session) : [...escalations];
}

export function queueReview(question: string, spec: SimSpec): Review {
  const existing = reviews.find((r) => r.spec.id === spec.id && r.question === question);
  if (existing) return existing;
  const item: Review = { id: id("r"), at: Date.now(), question, spec, status: "pending" };
  reviews.unshift(item);
  if (reviews.length > 200) reviews.pop();
  return item;
}

export function decideReview(rid: string, status: "approved" | "rejected", note?: string, spec?: SimSpec): Review | null {
  const r = reviews.find((x) => x.id === rid);
  if (!r) return null;
  r.status = status;
  r.note = note;
  if (spec) r.spec = spec;
  return r;
}

export function listReviews(): Review[] {
  return [...reviews];
}
