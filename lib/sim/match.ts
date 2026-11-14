// Offline fallback for "ask for any experiment": finds the closest ready-made simulation by
// word overlap. Used when there is no API key, the network is down, or the AI can't help.

import { library } from "@/lib/sim/library";
import type { SimSpec } from "@/lib/sim/spec";
import { templates, type TemplateId } from "@/lib/sim/templates";

const STOP = new Set(
  "a an and are as at be but by can do does did for from has have how i if in is it its me my of on or so that the then this to was we what when where which who why will with you your about into than more less make makes made happen happens go goes going up down get gets work works really thing things fast faster slow slower quick quicker".split(
    " ",
  ),
);

/** Extra words students use for each template's topic. */
const SYNONYMS: Record<TemplateId, string[]> = {
  projectile: ["throw", "throwing", "thrown", "launch", "angle", "kick", "ball", "cannon", "trajectory", "range"],
  freefall: ["fall", "falls", "falling", "drop", "dropped", "heavy", "heavier", "light", "lighter", "gravity", "feather", "hammer", "terminal", "parachute"],
  spring: ["spring", "springs", "bounce", "bouncing", "oscillation", "oscillate", "pendulum", "swing", "hooke", "elastic", "vibration"],
  reaction: ["reaction", "reactions", "react", "rate", "rates", "temperature", "hot", "hotter", "heat", "catalyst", "catalysts", "enzyme", "concentration", "collision", "chemical", "chemistry", "warm", "warmer", "cold", "colder", "fridge", "milk", "spoil", "cook", "cooking"],
  population: ["bacteria", "cells", "cell", "grow", "growth", "population", "yeast", "divide", "dividing", "carrying", "capacity", "food"],
  ecosystem: ["predator", "predators", "prey", "fox", "foxes", "rabbit", "rabbits", "ecosystem", "food", "chain", "web", "wolves", "deer", "hunt"],
};

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Crude stemming so "falls", "falling" and "fall" meet. */
const stem = (w: string) => w.replace(/(ing|ers|er|es|s|ed)$/, "") || w;

export function closestSim(question: string): SimSpec | null {
  const q = new Set(words(question).map(stem));
  if (!q.size) return null;
  let best: { spec: SimSpec; score: number } | null = null;
  for (const spec of library) {
    const t = templates[spec.template as TemplateId];
    // This simulation's own words beat its template's topic words, which beat the intro.
    const own = new Set(words(`${spec.title} ${spec.question}`).map(stem));
    const topic = new Set(SYNONYMS[t.id].map(stem));
    const weak = new Set(words(`${spec.intro} ${t.name}`).map(stem));
    let score = 0;
    for (const w of q) score += own.has(w) ? 3 : topic.has(w) ? 2 : weak.has(w) ? 1 : 0;
    if (score > (best?.score ?? 0)) best = { spec, score };
  }
  return best && best.score >= 2 ? best.spec : null;
}
