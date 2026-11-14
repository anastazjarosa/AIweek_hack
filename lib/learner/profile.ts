// The learning profile, computed from behaviour. Pure functions, unit tested.
//
// Every signal carries its evidence in plain words, so the student can see why the app thinks
// something and disagree. Signals describe what works, never what someone "is" or "has".

import type { LearnEvent } from "@/lib/learner/events";
import { topics, type TopicId } from "@/lib/learner/topics";
import type { Scores } from "@/lib/dimensions";

export type Confidence = "low" | "medium" | "high";
export type Signal = { id: string; label: string; finding: string; evidence: string; confidence: Confidence };
export type TopicStat = { topic: TopicId; label: string; attempts: number; misses: number; missRate: number };
export type Adaptation = { id: string; label: string; why: string; scores?: Partial<Scores> };
export type Profile = {
  signals: Signal[];
  weakTopics: TopicStat[];
  topicStats: TopicStat[];
  adaptations: Adaptation[];
  /** Typical focus span in minutes, used by the planner; null until there are focus blocks. */
  focusMinutes: number | null;
  eventCount: number;
};

const SKIM_WPS = 4 * (1 / 0.3); // reading faster than ~13 words a second counts as skimming
const confidence = (n: number): Confidence => (n >= 8 ? "high" : n >= 4 ? "medium" : "low");
const pct = (x: number) => `${Math.round(x * 100)}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function focus(events: LearnEvent[]): { signal: Signal; minutes: number } | null {
  const blocks = events.filter((e): e is Extract<LearnEvent, { t: "focus_block" }> => e.t === "focus_block" && e.activeMin > 0);
  if (blocks.length < 2) return null;
  const early = blocks.filter((b) => b.endedBy === "early");
  // When blocks end early, the time they lasted is the real span; otherwise the planned length held.
  const minutes = Math.max(5, Math.round(median((early.length ? early : blocks).map((b) => b.activeMin))));
  return {
    minutes,
    signal: {
      id: "focus",
      label: "Focus",
      finding: early.length >= blocks.length / 2 ? `You focus best in blocks of about ${minutes} minutes` : `You keep going for your full ${minutes}-minute blocks`,
      evidence: `${plural(blocks.length, "focus block")}; ${plural(early.length, "ended", "ended")} early with a break.`,
      confidence: confidence(blocks.length * 2),
    },
  };
}

function formats(events: LearnEvent[]): Signal | null {
  const doing = events.filter((e) => e.t === "experiment_run" || e.t === "prediction").length;
  const reading = events.filter((e) => e.t === "read").length;
  const listening = events.filter((e) => e.t === "replay").length;
  const total = doing + reading + listening;
  if (total < 4) return null;
  const top = [
    { k: "doing", n: doing, text: "You learn most by doing: experiments are where you spend your time" },
    { k: "reading", n: reading, text: "You learn most by reading the notes" },
    { k: "listening", n: listening, text: "You often listen to sections, sometimes more than once" },
  ].sort((a, b) => b.n - a.n)[0];
  return {
    id: "format",
    label: "What you use",
    finding: top.text,
    evidence: `${plural(doing, "hands-on step")}, ${plural(reading, "section")} read, ${plural(listening, "audio replay")}.`,
    confidence: confidence(total),
  };
}

function depth(events: LearnEvent[]): Signal | null {
  const ex = events.filter((e): e is Extract<LearnEvent, { t: "explanation" }> => e.t === "explanation");
  if (ex.length < 2) return null;
  const wrote = ex.filter((e) => e.wrote).length;
  const runsPerSim = new Map<string, number>();
  for (const e of events) if (e.t === "experiment_run") runsPerSim.set(e.sim, (runsPerSim.get(e.sim) ?? 0) + 1);
  const explored = [...runsPerSim.values()].filter((n) => n > 2).length;
  const deep = wrote / ex.length >= 0.7;
  const quick = wrote / ex.length <= 0.3;
  return {
    id: "depth",
    label: "Depth",
    finding: deep ? "You like to dig into why things happen" : quick ? "You prefer getting to the answer quickly" : "You mix quick answers with deeper digging",
    evidence: `Wrote your own explanation ${wrote} of ${ex.length} times; explored beyond the fair test in ${plural(explored, "experiment")}.`,
    confidence: confidence(ex.length * 2),
  };
}

function pace(events: LearnEvent[]): Signal | null {
  const reads = events.filter((e): e is Extract<LearnEvent, { t: "read" }> => e.t === "read" && e.words > 0);
  if (reads.length < 3) return null;
  const skimmed = reads.filter((r) => r.words / Math.max(r.seconds, 0.1) > SKIM_WPS).length;
  const share = skimmed / reads.length;
  return {
    id: "pace",
    label: "Pace",
    finding: share >= 0.6 ? "You move through text quickly" : share <= 0.2 ? "You read at a steady pace" : "Your pace varies: some sections quick, some slow",
    evidence: `${skimmed} of ${reads.length} sections were scrolled past faster than they can be read.`,
    confidence: confidence(reads.length),
  };
}

function practice(events: LearnEvent[]): Signal | null {
  const tries = events.filter((e): e is Extract<LearnEvent, { t: "quiz" | "prediction" }> => e.t === "quiz" || e.t === "prediction");
  if (tries.length < 6) return null;
  const half = Math.floor(tries.length / 2);
  const acc = (xs: typeof tries) => xs.filter((x) => x.correct).length / xs.length;
  const before = acc(tries.slice(0, half));
  const after = acc(tries.slice(half));
  const better = after - before >= 0.15;
  return {
    id: "practice",
    label: "Practice",
    finding: better ? "Practice questions are working for you" : after - before <= -0.15 ? "Recent questions felt harder than earlier ones" : "Your accuracy is holding steady",
    evidence: `Earlier questions ${pct(before)} right, recent ones ${pct(after)} (${tries.length} questions and predictions).`,
    confidence: confidence(tries.length),
  };
}

export function topicStats(events: LearnEvent[]): TopicStat[] {
  const m = new Map<TopicId, { attempts: number; misses: number }>();
  const add = (topic: TopicId, miss: boolean) => {
    const s = m.get(topic) ?? { attempts: 0, misses: 0 };
    s.attempts++;
    if (miss) s.misses++;
    m.set(topic, s);
  };
  for (const e of events) {
    if (e.t === "quiz" || e.t === "prediction") add(e.topic, !e.correct);
    else if (e.t === "explanation" && e.wrote && e.ideas !== null) add(e.topic, e.ideas / Math.max(1, e.total) < 0.5);
  }
  return [...m.entries()]
    .map(([topic, s]) => ({ topic, label: topics[topic].label, ...s, missRate: s.misses / s.attempts }))
    .sort((a, b) => b.missRate - a.missRate || b.attempts - a.attempts);
}

export function computeProfile(events: LearnEvent[]): Profile {
  const f = focus(events);
  const signals = [f?.signal, formats(events), depth(events), pace(events), practice(events)].filter((s): s is Signal => !!s);
  const stats = topicStats(events);
  const weakTopics = stats.filter((s) => s.attempts >= 2 && s.missRate >= 0.5);

  const adaptations: Adaptation[] = [];
  const sig = (id: string) => signals.find((s) => s.id === id);
  if (f && f.minutes <= 12) {
    adaptations.push({ id: "short", label: `Shorter study blocks (${f.minutes} minutes)`, why: "Matches how long your focus blocks usually last before a break.", scores: { focus: 3 } });
  }
  if (sig("format")?.finding.startsWith("You learn most by doing")) {
    adaptations.push({ id: "doing", label: "Start topics with an experiment", why: "You spend most of your time on hands-on steps." });
  }
  if (sig("format")?.finding.startsWith("You often listen")) {
    adaptations.push({ id: "audio", label: "Audio-first layout", why: "You replay sections to listen again.", scores: { processing: 3 } });
  }
  if (sig("pace")?.finding.startsWith("You move through text quickly")) {
    adaptations.push({ id: "sprints", label: "Short cards with quick checks", why: "You scroll past long notes faster than they can be read.", scores: { focus: 3 } });
  }
  if (sig("depth")?.finding.startsWith("You like to dig")) {
    adaptations.push({ id: "deeper", label: "Deeper explanations and extra experiments", why: "You write your own explanations and explore beyond the fair test." });
  }
  if (sig("practice")?.finding.startsWith("Practice questions are working")) {
    adaptations.push({ id: "practice", label: "More practice questions", why: "Your accuracy went up as you practised." });
  }
  for (const w of weakTopics.slice(0, 2)) {
    adaptations.push({ id: `topic-${w.topic}`, label: `Extra time on ${w.label}`, why: `${w.misses} of ${w.attempts} recent answers on this topic missed.` });
  }

  return { signals, weakTopics, topicStats: stats, adaptations, focusMinutes: f?.minutes ?? null, eventCount: events.length };
}

// ---------- Demo history ----------

/**
 * A believable week of activity for the pitch: short focus blocks, lots of experiments, mistakes on
 * forces, improving practice. Deterministic for a given `now`.
 */
export function demoHistory(now: number): LearnEvent[] {
  const day = 24 * 3600 * 1000;
  const at = (d: number, min: number) => now - d * day + min * 60 * 1000;
  const e: LearnEvent[] = [];
  const block = (d: number, activeMin: number, endedBy: "timer" | "early") => e.push({ t: "focus_block", at: at(d, 0), plannedMin: 15, activeMin, endedBy });
  block(6, 9, "early");
  block(5, 11, "early");
  block(4, 15, "timer");
  block(3, 10, "early");
  block(2, 8, "early");
  const sims: [string, TopicId, boolean, number][] = [
    ["heavier-falls-faster", "forces", false, 1],
    ["best-throwing-angle", "forces", false, 0],
    ["throwing-on-the-moon", "forces", true, 2],
    ["hotter-reacts-faster", "reactions", true, 3],
    ["catalyst", "reactions", true, 3],
    ["falling-through-air", "forces", false, 1],
    ["bacteria-in-a-dish", "populations", true, 2],
  ];
  sims.forEach(([sim, topic, correct, ideas], i) => {
    const d = 6 - i * 0.8;
    e.push({ t: "prediction", at: at(d, 1), topic, sim, correct });
    for (let r = 0; r < (i % 2 ? 4 : 2); r++) e.push({ t: "experiment_run", at: at(d, 2 + r), topic, sim });
    e.push({ t: "explanation", at: at(d, 6), topic, sim, wrote: i !== 4, ideas: i !== 4 ? ideas : null, total: 3 });
  });
  [false, false, true, false, true, true, true, true].forEach((correct, i) => e.push({ t: "quiz", at: at(5 - i * 0.5, 20), topic: "history-of-life", correct }));
  [
    [180, 9],
    [210, 6],
    [160, 40],
    [190, 7],
  ].forEach(([words, seconds], i) => e.push({ t: "read", at: at(4 - i, 30), topic: "history-of-life", words, seconds }));
  return e.sort((a, b) => a.at - b.at);
}
