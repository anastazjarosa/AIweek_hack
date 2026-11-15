// What the coach is allowed to answer from: the lecture's slides, or the current experiment.
// Retrieval picks the few most relevant sources for each question; only those go to the model,
// and every claim it makes must cite one of them.

import { lecture } from "@/lib/data";
import { words } from "@/lib/sim/match";
import type { SimSpec } from "@/lib/sim/spec";

export type Source = { id: string; title: string; text: string; href?: string };
export type CoachContext = { kind: "lecture" } | { kind: "sim"; spec: SimSpec };

export function sourcesFor(ctx: CoachContext): Source[] {
  if (ctx.kind === "lecture") {
    const slides = lecture.sections.map((s, i) => ({
      id: `slide-${i + 1}`,
      title: `Slide ${i + 1}: ${s.title}`,
      text: [s.body, ...s.points, ...s.terms.map((t) => `${t.term}: ${t.def}`)].join(" "),
      href: `#${s.id}`,
    }));
    return [...slides, { id: "key-ideas", title: "Key ideas of the lecture", text: lecture.keyIdeas.join(" ") }];
  }
  const s = ctx.spec;
  return [
    { id: "setup", title: "The experiment", text: `${s.question} ${s.intro} ${s.prediction.prompt}` },
    { id: "explanation", title: "Why it happens", text: s.explanation },
    { id: "key-ideas", title: "Key ideas", text: s.keyIdeas.join(". ") },
    ...(s.misconception ? [{ id: "misconception", title: "A common wrong idea", text: s.misconception }] : []),
    ...(s.realWorld ? [{ id: "real-world", title: "In the real world", text: s.realWorld }] : []),
  ];
}

const stem = (w: string) => w.replace(/(ing|ers|er|es|s|ed)$/, "") || w;

/** Everyday words students use for the same idea, so "mass" finds text that says "heavier". */
const SYNONYMS: Record<string, string[]> = {
  mass: ["heavy", "heavier", "weight", "kg", "light"],
  weight: ["mass", "heavy", "heavier", "kg"],
  heavy: ["mass", "weight", "heavier"],
  speed: ["fast", "faster", "velocity", "quickly", "rate"],
  fast: ["speed", "faster", "quickly", "rate"],
  hot: ["temperature", "heat", "hotter", "warm"],
  heat: ["temperature", "hot", "hotter", "warm"],
  warm: ["temperature", "hot", "heat"],
  temperature: ["hot", "heat", "warm"],
  catalyst: ["enzyme", "enzymes"],
  enzyme: ["catalyst"],
  fox: ["predator", "predators", "foxes"],
  rabbit: ["prey", "rabbits"],
  predator: ["fox", "foxes"],
  prey: ["rabbit", "rabbits"],
  grow: ["growth", "population", "divide"],
  old: ["age", "ago", "years", "dating"],
  age: ["old", "ago", "dating"],
  die: ["extinction", "extinct", "died"],
  evolve: ["evolution", "selection", "natural"],
  life: ["real", "everyday"],
};

function expand(query: string): Set<string> {
  const out = new Set<string>();
  for (const w of words(query)) {
    out.add(stem(w));
    for (const s of SYNONYMS[w] ?? SYNONYMS[stem(w)] ?? []) out.add(stem(s));
  }
  return out;
}

/** The k sources that share the most (stemmed) words with the query, best first. */
export function retrieve(sources: Source[], query: string, k = 3): { source: Source; score: number }[] {
  const q = expand(query);
  if (!q.size) return [];
  return sources
    .map((source) => {
      const title = new Set(words(source.title).map(stem));
      const body = new Set(words(source.text).map(stem));
      let score = 0;
      for (const w of q) score += title.has(w) ? 3 : body.has(w) ? 1 : 0;
      return { source, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
