// Learning patterns: the ways students learn that Mosaic notices from behaviour, and what it
// changes for each. Patterns, not types: a student can show several, they can change week to
// week, and the app never says what someone "is". Research doesn't support fixed learning
// styles, so each pattern is tied to what the student actually does and what helps.

import type { Profile } from "@/lib/learner/profile";

export type PatternId = "deep" | "quick" | "hands-on" | "listener" | "fast" | "practice" | "bursts";

export type Pattern = {
  id: PatternId;
  name: string;
  /** In the student's words. */
  quote: string;
  /** The behaviour Mosaic looks for. */
  notices: string;
  /** What changes in the app. */
  adapts: string[];
};

export const patterns: Pattern[] = [
  {
    id: "deep",
    name: "Deep diver",
    quote: "I need to know why, not just what.",
    notices: "Writes their own explanations and re-runs experiments beyond the fair test.",
    adapts: ["Full explanations with the reasoning", "A “go deeper” challenge after each experiment", "References to follow up"],
  },
  {
    id: "quick",
    name: "Quick answers",
    quote: "Just tell me the key points.",
    notices: "Asks for the answer straight away and skips long explanations.",
    adapts: ["Key ideas first, details on demand", "Short summaries", "One quick check instead of a long quiz"],
  },
  {
    id: "hands-on",
    name: "Hands-on",
    quote: "I get it once I've tried it.",
    notices: "Spends most of their time running experiments rather than reading.",
    adapts: ["Each topic opens with an experiment", "Predict before reading", "Sliders to explore"],
  },
  {
    id: "listener",
    name: "Listener",
    quote: "Long text takes me ages. I'd rather hear it.",
    notices: "Plays sections out loud, often more than once.",
    adapts: ["Audio-first layout", "Larger text, plain-English key terms", "Listen-along breaks"],
  },
  {
    id: "fast",
    name: "Fast mover",
    quote: "I move quickly and sometimes miss things.",
    notices: "Scrolls past sections faster than they can be read.",
    adapts: ["Short cards with a quick check each", "Suggests the Sprints layout (never forces it)", "A recap before moving on"],
  },
  {
    id: "practice",
    name: "Practice-lover",
    quote: "Doing questions is how it sticks.",
    notices: "Gets more questions right the more they practise.",
    adapts: ["More practice questions", "Extra practice sessions in the plan", "Recall checks after breaks"],
  },
  {
    id: "bursts",
    name: "Short bursts",
    quote: "My focus fades after a few minutes.",
    notices: "Focus blocks tend to end early, around the same time.",
    adapts: ["Study blocks sized to their real focus span", "Breaks with off-screen tasks", "A 2-minute first step"],
  },
];

export const patternById = (id: PatternId) => patterns.find((p) => p.id === id)!;

export type DetectedPattern = { pattern: Pattern; evidence: string };

/** The patterns this student shows, from the behaviour-based profile, with the evidence. */
export function detectPatterns(profile: Profile): DetectedPattern[] {
  const out: DetectedPattern[] = [];
  const sig = (id: string) => profile.signals.find((s) => s.id === id);
  const add = (id: PatternId, evidence: string) => out.push({ pattern: patternById(id), evidence });

  const depth = sig("depth");
  if (depth?.finding.startsWith("You like to dig")) add("deep", depth.evidence);
  else if (depth?.finding.startsWith("You prefer getting to the answer")) add("quick", depth.evidence);
  const format = sig("format");
  if (format?.finding.startsWith("You learn most by doing")) add("hands-on", format.evidence);
  if (format?.finding.startsWith("You often listen")) add("listener", format.evidence);
  const pace = sig("pace");
  if (pace?.finding.startsWith("You move through text quickly")) add("fast", pace.evidence);
  const practice = sig("practice");
  if (practice?.finding.startsWith("Practice questions are working")) add("practice", practice.evidence);
  if (profile.focusMinutes !== null && profile.focusMinutes <= 12) add("bursts", sig("focus")!.evidence);
  return out;
}

/** How the explain step of an experiment should be ordered for this student. */
export function explainMode(detected: DetectedPattern[]): "deep" | "quick" | "standard" {
  if (detected.some((d) => d.pattern.id === "quick")) return "quick";
  if (detected.some((d) => d.pattern.id === "deep")) return "deep";
  return "standard";
}
