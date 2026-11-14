// Learning needs as four 0-4 dimensions. Pure functions; all adaptations read levels from here.
import type { Level, Need, Needs } from "@/lib/screentime/engine";

export type DimKey = Need;
export type Scores = Record<DimKey, number>;
export type Format = "audio" | "visual" | "text" | null;
export type Prefs = { format: Format; voiceInput: boolean; calmTheme: boolean };
export type ViewId = "standard" | "sprints" | "listen" | "structured";

export const dimensions: { key: DimKey; label: string; statements: [string, string]; high: string }[] = [
  {
    key: "focus",
    label: "Focus",
    statements: ["My attention drifts in long study sessions.", "Short bursts work better for me."],
    high: "Short sprints, one idea at a time, instant feedback",
  },
  {
    key: "processing",
    label: "Processing",
    statements: ["Long blocks of text take me a lot of effort.", "I understand better when I hear or see things."],
    high: "Listen first, larger text, plain-English key terms",
  },
  {
    key: "organising",
    label: "Planning",
    statements: ["Getting started or planning what to study is hard.", "Typing or writing a lot is tiring."],
    high: "A plan made for you, voice tasks over writing",
  },
  {
    key: "predictability",
    label: "Structure",
    statements: ["I like to know exactly what's coming next.", "Busy or cluttered screens overwhelm me."],
    high: "Same layout every time, a schedule and heads-up before changes",
  },
];

export const scaleLabels = ["Not like me", "", "", "", "Very like me"];

export const views: { id: ViewId; label: string; short: string }[] = [
  { id: "sprints", label: "Sprints", short: "Short sprints, instant feedback" },
  { id: "listen", label: "Listen", short: "Audio first, readable layout" },
  { id: "structured", label: "Structured", short: "Predictable, numbered, literal" },
  { id: "standard", label: "Standard", short: "Notes, flashcards, quiz, map" },
];

export const ZERO: Scores = { focus: 0, processing: 0, organising: 0, predictability: 0 };
export const DEFAULT_PREFS: Prefs = { format: null, voiceInput: false, calmTheme: false };

/** 0-1 low, 2 medium, 3-4 high. Averaged half-points round up. */
export function levelFor(score: number): Level {
  const r = Math.round(score);
  return r >= 3 ? "high" : r === 2 ? "medium" : "low";
}

export function needsFromScores(s: Scores): Needs {
  return {
    focus: levelFor(s.focus),
    processing: levelFor(s.processing),
    organising: levelFor(s.organising),
    predictability: levelFor(s.predictability),
  };
}

/** Eight onboarding answers (0-4), two per dimension in `dimensions` order, averaged. */
export function scoresFromAnswers(answers: number[]): Scores {
  const out = { ...ZERO };
  dimensions.forEach((d, i) => {
    out[d.key] = (answers[i * 2] + answers[i * 2 + 1]) / 2;
  });
  return out;
}

/** e.g. "high focus + high structure"; "no strong needs" when everything is low. */
export function describeScores(s: Scores): string {
  const parts = dimensions
    .map((d) => ({ d, level: levelFor(s[d.key]) }))
    .filter((x) => x.level !== "low")
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "high" ? -1 : 1))
    .map((x) => `${x.level} ${x.d.label.toLowerCase()}`);
  return parts.length ? parts.join(" + ") : "no strong needs";
}

// Calmest first: used to break ties between competing layouts.
const CALM_ORDER: ViewId[] = ["structured", "listen", "sprints"];
const VIEW_FOR: Partial<Record<DimKey, ViewId>> = { predictability: "structured", processing: "listen", focus: "sprints" };

/**
 * Lecture layout. The student's format setting wins; otherwise the highest high-level need picks
 * the layout, and ties go to the calmer layout.
 */
export function defaultView(s: Scores, prefs: Prefs): ViewId {
  if (prefs.format === "audio") return "listen";
  if (prefs.format === "text" || prefs.format === "visual") return "standard";
  const candidates = (Object.keys(VIEW_FOR) as DimKey[]).filter((k) => levelFor(s[k]) === "high");
  if (!candidates.length) return "standard";
  const top = Math.max(...candidates.map((k) => s[k]));
  const tied = candidates.filter((k) => s[k] === top).map((k) => VIEW_FOR[k]!);
  return CALM_ORDER.find((v) => tied.includes(v))!;
}

// Demo personas, named by their scores. Seeded once from the old preset profiles.
const personaScores: Scores[] = [
  { focus: 4, processing: 0, organising: 0, predictability: 4 },
  { focus: 4, processing: 0, organising: 2, predictability: 0 },
  { focus: 0, processing: 4, organising: 0, predictability: 0 },
  { focus: 0, processing: 0, organising: 4, predictability: 0 },
  { focus: 0, processing: 0, organising: 0, predictability: 4 },
];

export const personas = personaScores.map((scores, i) => ({
  id: `persona-${String.fromCharCode(97 + i)}`,
  name: `Persona ${String.fromCharCode(65 + i)}: ${describeScores(scores)}`,
  scores,
}));
