// Input guardrail: the first step of the pipeline, before any model call. Cheap, transparent
// pattern checks for prompt injection and off-limits requests. The model prompts also treat
// student text as data; this catches the obvious attempts early and shows the student why.

export type Screen = { ok: true } | { ok: false; reason: string; kind: "injection" | "personal" | "empty" };

const INJECTION = [
  /ignore (all |any |the )?(previous|prior|above|earlier) (instructions|rules|prompts?)/i,
  /disregard (the |your )?(system|previous|above)/i,
  /(reveal|print|show|repeat) (me )?(your|the) (system )?(prompt|instructions)/i,
  /you are now\b|act as (an? )?(unfiltered|jailbroken|dan)\b/i,
  /<\/?(system|assistant|instructions?)>/i,
];
// Mosaic never handles medical or diagnostic questions about the student.
const PERSONAL = [/\b(do|have) i (have|got) (adhd|autism|dyslexia|dyspraxia)\b/i, /\bdiagnos(e|is) me\b/i];

export function screenQuestion(q: string): Screen {
  const t = q.trim();
  if (t.length < 3) return { ok: false, kind: "empty", reason: "Ask a question of at least a few words." };
  if (INJECTION.some((r) => r.test(t))) {
    return { ok: false, kind: "injection", reason: "That looks like an instruction to the AI rather than a science question, so it wasn't sent." };
  }
  if (PERSONAL.some((r) => r.test(t))) {
    return { ok: false, kind: "personal", reason: "Mosaic doesn't diagnose or label anyone. Try a science question instead." };
  }
  return { ok: true };
}
