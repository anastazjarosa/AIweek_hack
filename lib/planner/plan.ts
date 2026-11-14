// Study planner, habit coach and weekly check-in. Pure functions over dates as "YYYY-MM-DD"
// strings (no time zones), the learning profile and the event log. Unit tested.

import type { LearnEvent } from "@/lib/learner/events";
import type { TopicStat } from "@/lib/learner/profile";
import { topicIds, topics, type TopicId } from "@/lib/learner/topics";

export type Exam = { id: string; topic: TopicId; date: string };
export type Habit = "procrastination" | "perfectionism" | "distraction";
export type SessionKind = "learn" | "practice" | "review";
export type PlanSession = { topic: TopicId; minutes: number; kind: SessionKind; href: string };
export type PlanDay = { date: string; examToday: TopicId[]; sessions: PlanSession[] };

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(toMs(d) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
/** Today's date in the viewer's time zone. */
export const localToday = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export const MAX_PLAN_DAYS = 28;
const DEFAULT_MISS = 0.3; // topics with no results yet count as a little uncertain

/** Session length from the measured focus span, shortened for the distraction coach. */
export function blockMinutes(focusMinutes: number | null, habit: Habit | null): number {
  const base = Math.min(25, Math.max(10, focusMinutes ?? 20));
  return habit === "distraction" ? Math.min(base, 15) : base;
}

/**
 * Builds the day-by-day plan up to the last exam (at most MAX_PLAN_DAYS). Each day gets
 * dailyMinutes split into focus-sized sessions; topics compete by urgency (exam closeness) and
 * weakness (miss rate), using a deterministic largest-credit round robin.
 */
export function buildPlan(input: {
  exams: Exam[];
  today: string;
  focusMinutes: number | null;
  topicStats: TopicStat[];
  dailyMinutes?: number;
  habit?: Habit | null;
}): PlanDay[] {
  const exams = input.exams.filter((e) => daysBetween(input.today, e.date) >= 0);
  if (!exams.length) return [];
  const last = exams.reduce((m, e) => (e.date > m ? e.date : m), input.today);
  const days = Math.min(MAX_PLAN_DAYS, daysBetween(input.today, last) + 1);
  const block = blockMinutes(input.focusMinutes, input.habit ?? null);
  const perDay = Math.max(1, Math.floor((input.dailyMinutes ?? 40) / block));
  const miss = (t: TopicId) => input.topicStats.find((s) => s.topic === t)?.missRate ?? DEFAULT_MISS;
  const credit = new Map<TopicId, number>();

  const plan: PlanDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(input.today, i);
    const examToday = exams.filter((e) => e.date === date).map((e) => e.topic);
    const upcoming = exams.filter((e) => e.date > date);
    const sessions: PlanSession[] = [];
    if (examToday.length) {
      // Exam day: one short warm-up for each exam, nothing new.
      for (const t of examToday) sessions.push({ topic: t, minutes: 10, kind: "review", href: topics[t].practiceHref });
    } else if (upcoming.length) {
      const weights = new Map<TopicId, number>();
      for (const e of upcoming) {
        const left = daysBetween(date, e.date);
        const w = (1 / Math.sqrt(left)) * (1 + 2 * miss(e.topic));
        weights.set(e.topic, Math.max(weights.get(e.topic) ?? 0, w));
      }
      const total = [...weights.values()].reduce((a, b) => a + b, 0);
      for (let s = 0; s < perDay; s++) {
        for (const [t, w] of weights) credit.set(t, (credit.get(t) ?? 0) + w / total);
        // Highest credit wins. Mix topics within a day, unless one is clearly owed more time.
        const ranked = [...weights.keys()].sort((a, b) => (credit.get(b)! - credit.get(a)!) || topicIds.indexOf(a) - topicIds.indexOf(b));
        const prev = sessions.at(-1)?.topic;
        const alt = ranked.find((t) => t !== prev);
        const pick = ranked[0] === prev && alt && credit.get(ranked[0])! - credit.get(alt)! < 0.5 ? alt : ranked[0];
        credit.set(pick, credit.get(pick)! - 1);
        const exam = upcoming.find((e) => e.topic === pick)!;
        const left = daysBetween(date, exam.date);
        const kind: SessionKind = left <= 2 ? "review" : miss(pick) >= 0.5 ? "practice" : "learn";
        sessions.push({ topic: pick, minutes: block, kind, href: topics[pick].practiceHref });
      }
    }
    plan.push({ date, examToday, sessions });
  }
  return plan;
}

/** Minutes per topic across the plan, for the summary line. */
export function minutesByTopic(plan: PlanDay[]): Partial<Record<TopicId, number>> {
  const out: Partial<Record<TopicId, number>> = {};
  for (const d of plan) for (const s of d.sessions) out[s.topic] = (out[s.topic] ?? 0) + s.minutes;
  return out;
}

// ---------- Habit coach ----------

export type HabitSignal = { habit: Habit; evidence: string };

/** Spots habits from behaviour. Describes what happened; never labels the student. */
export function detectHabits(events: LearnEvent[], now: number): HabitSignal[] {
  const out: HabitSignal[] = [];
  const last = events.at(-1)?.at;
  const idleDays = last ? Math.floor((now - last) / DAY) : null;
  if (idleDays !== null && idleDays >= 2) out.push({ habit: "procrastination", evidence: `No study for ${idleDays} days.` });
  const blocks = events.filter((e) => e.t === "focus_block");
  const early = blocks.filter((e) => e.t === "focus_block" && e.endedBy === "early").length;
  if (blocks.length >= 2 && early / blocks.length >= 0.5) out.push({ habit: "distraction", evidence: `${early} of ${blocks.length} focus blocks ended early.` });
  const runs = new Map<string, number>();
  for (const e of events) if (e.t === "experiment_run") runs.set(e.sim, (runs.get(e.sim) ?? 0) + 1);
  const polished = [...runs.values()].filter((n) => n >= 6).length;
  if (polished >= 2) out.push({ habit: "perfectionism", evidence: `Re-ran ${polished} experiments six or more times.` });
  return out;
}

export const habitCoach: Record<Habit, { label: string; tips: string[] }> = {
  procrastination: {
    label: "Getting started",
    tips: ["Start with a 2-minute first step. Stopping after it is allowed.", "Pick the time now: tie it to something you already do, like after dinner.", "A gentle reminder if a planned session hasn't started."],
  },
  perfectionism: {
    label: "Knowing when it's good enough",
    tips: ["Set a 'good enough' goal before you start: one fair test and one sentence.", "Each task has a time limit; when it ends, move on.", "Done beats perfect: you can come back on review day."],
  },
  distraction: {
    label: "Staying on task",
    tips: ["Short sprints with a break after each one (Pomodoro style).", "Phone in another room, one tab open.", "If your mind wanders, write the thought down and come back."],
  },
};

/** The tiny first step for a session: two minutes, one concrete action. */
export function firstStep(s: PlanSession): string {
  const what = topics[s.topic].label.toLowerCase();
  if (s.kind === "practice") return `Open the ${what} experiment and make your prediction. That's the whole first step.`;
  if (s.kind === "review") return `Write down three things you remember about ${what}, without looking.`;
  return `Read the first section on ${what} and write one sentence about it.`;
}

// ---------- Weekly check-in ----------

export type CheckIn = { headline: string; improved: string[]; stats: { label: string; value: string }[]; next: string[] };

const isTry = (e: LearnEvent): e is Extract<LearnEvent, { t: "quiz" | "prediction" }> => e.t === "quiz" || e.t === "prediction";

/** "Here's what you improved and what's next", from the last 7 days against the 7 before. */
export function weeklyCheckIn(events: LearnEvent[], now: number, weakTopics: TopicStat[], exams: Exam[], today: string): CheckIn {
  const week = events.filter((e) => now - e.at < 7 * DAY);
  const before = events.filter((e) => now - e.at >= 7 * DAY && now - e.at < 14 * DAY);
  const acc = (xs: LearnEvent[]) => {
    const t = xs.filter(isTry);
    return t.length ? t.filter((x) => x.correct).length / t.length : null;
  };
  const a = acc(week);
  const b = acc(before);
  const experiments = new Set(week.filter((e) => e.t === "experiment_run").map((e) => (e.t === "experiment_run" ? e.sim : ""))).size;
  const focusMin = Math.round(week.reduce((n, e) => n + (e.t === "focus_block" ? e.activeMin : 0), 0));

  // Topics whose accuracy rose between the first and second half of the week.
  const improved: string[] = [];
  for (const t of topicIds) {
    const tries = week.filter(isTry).filter((e) => e.topic === t);
    if (tries.length < 4) continue;
    const h = Math.floor(tries.length / 2);
    const first = tries.slice(0, h).filter((x) => x.correct).length / h;
    const second = tries.slice(h).filter((x) => x.correct).length / (tries.length - h);
    if (second - first >= 0.25) improved.push(`${topics[t].label}: ${Math.round(first * 100)}% → ${Math.round(second * 100)}% right`);
  }

  const next: string[] = [];
  if (weakTopics[0]) next.push(`More practice on ${weakTopics[0].label.toLowerCase()}: the plan gives it extra sessions.`);
  const soonest = exams.filter((e) => e.date >= today).sort((x, y) => x.date.localeCompare(y.date))[0];
  if (soonest) next.push(`${topics[soonest.topic].subject} exam (${topics[soonest.topic].label}) in ${daysBetween(today, soonest.date)} days.`);
  if (!next.length) next.push("Add an exam date and the planner will build your schedule.");

  const headline = !week.length
    ? "A quiet week. One small session is a great restart."
    : a !== null && b !== null && a - b >= 0.1
      ? `Your answers got more accurate this week: ${Math.round(b * 100)}% → ${Math.round(a * 100)}%.`
      : improved.length
        ? `You improved on ${improved.length === 1 ? "a topic" : `${improved.length} topics`} this week.`
        : `You studied on ${new Set(week.map((e) => new Date(e.at).toDateString())).size} days this week.`;

  return {
    headline,
    improved,
    stats: [
      { label: "Experiments", value: String(experiments) },
      { label: "Questions answered", value: String(week.filter(isTry).length) },
      { label: "Accuracy", value: a === null ? "—" : `${Math.round(a * 100)}%` },
      { label: "Focused time", value: `${focusMin} min` },
    ],
    next,
  };
}
