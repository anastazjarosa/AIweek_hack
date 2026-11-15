// Teacher-side server state for the demo: questions the coach escalated, and AI-built experiments
// waiting for review. In memory, per server instance (a database in production).

import type { SimSpec } from "@/lib/sim/spec";
import type { CoachMode, Tone, Turn } from "@/lib/coach/coach";
import type { CoachContext } from "@/lib/coach/sources";
import type { PatternId } from "@/lib/learner/patterns";

export type EscalationTrigger = "high_stakes" | "ambiguous" | "circular" | "low_confidence" | "agent_requested";
export type EscalationCheckpoint = {
  history: Turn[];
  contextData: CoachContext;
  mode: CoachMode;
  tone: Tone;
  patterns: PatternId[];
  sources: { id: string; title: string }[];
  confidence: number;
  draft?: string;
};
export type Escalation = {
  id: string;
  at: number;
  session: string;
  question: string;
  context: string;
  trigger: EscalationTrigger;
  reason: string;
  checkpoint: EscalationCheckpoint;
  status: "open" | "answered";
  answer?: string;
  resolution?: { action: "answer" | "override" | "resume"; text: string; guidance?: string; at: number };
};
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

export function getEscalation(eid: string): Escalation | null {
  return escalations.find((x) => x.id === eid) ?? null;
}

export function resolveEscalation(
  eid: string,
  action: NonNullable<Escalation["resolution"]>["action"],
  text: string,
  guidance?: string,
): Escalation | null {
  const e = escalations.find((x) => x.id === eid);
  if (!e || e.status !== "open") return null;
  e.status = "answered";
  e.answer = text;
  e.resolution = { action, text, guidance, at: Date.now() };
  return e;
}

export function answerEscalation(eid: string, answer: string): Escalation | null {
  return resolveEscalation(eid, "answer", answer);
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
