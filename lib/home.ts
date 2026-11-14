// What the home page says, computed from real data. Pure functions, unit tested.
//
// The home page answers one question first, "what should I do now?", and then shows how the
// four parts of Mosaic feed each other (the learning loop), each with its live state.

import type { LearnEvent } from "@/lib/learner/events";
import type { Profile } from "@/lib/learner/profile";
import { topics } from "@/lib/learner/topics";
import { buildPlan, daysBetween, firstStep, type Exam, type PlanSession } from "@/lib/planner/plan";

const DAY = 86_400_000;

export type NextStep = {
  kind: "first-experiment" | "planned" | "practise-weak" | "add-exams";
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Which loop stage this step belongs to, so the loop can highlight it. */
  stage: LoopStageId;
};

export type LoopStageId = "know" | "learn" | "results" | "plan";
export type LoopStage = { id: LoopStageId; label: string; verb: string; status: string; href: string; empty: boolean };

/** The single most useful thing to do now. */
export function nextStep(events: LearnEvent[], profile: Profile, exams: Exam[], today: string, session: PlanSession | null): NextStep {
  if (session) {
    return {
      kind: "planned",
      eyebrow: `Today · ${session.minutes} minutes · ${topics[session.topic].label}`,
      title: firstStep(session),
      body: "Two minutes is enough to start. Stopping after that is allowed.",
      cta: { label: "Start with 2 minutes", href: "/planner" },
      secondary: { label: "Go straight in", href: session.href },
      stage: "plan",
    };
  }
  if (!events.length) {
    return {
      kind: "first-experiment",
      eyebrow: "Start here · 2 minutes",
      title: "Do heavier things fall faster?",
      body: "Guess, drop two balls in a real physics model, then explain what happened. Mosaic starts learning how you study from your first experiment.",
      cta: { label: "Try the experiment", href: "/lab/heavier-falls-faster" },
      secondary: { label: "Or load a demo week", href: "/profile" },
      stage: "learn",
    };
  }
  const weak = profile.weakTopics[0];
  if (weak) {
    return {
      kind: "practise-weak",
      eyebrow: `Needs more time · ${weak.misses} of ${weak.attempts} missed`,
      title: `Practise ${topics[weak.topic].label.toLowerCase()} with an experiment`,
      body: exams.some((e) => e.date >= today) ? "Your plan already gives it extra sessions." : "Add your exam dates and the planner will give it extra sessions.",
      cta: { label: "Practise now", href: topics[weak.topic].practiceHref },
      secondary: { label: "Add exam dates", href: "/planner" },
      stage: "results",
    };
  }
  return {
    kind: "add-exams",
    eyebrow: "Plan ahead",
    title: "When are your exams?",
    body: "Add the dates and Mosaic builds a plan around how long you focus and the topics that need more time.",
    cta: { label: "Add exam dates", href: "/planner" },
    secondary: { label: "Try another experiment", href: "/lab" },
    stage: "plan",
  };
}

/** Days in a row with any learning activity, counting back from today (or yesterday). */
export function streakDays(events: LearnEvent[], now: number): number {
  const days = new Set(events.map((e) => Math.floor(e.at / DAY)));
  let d = Math.floor(now / DAY);
  if (!days.has(d)) d -= 1; // today not started yet: the streak still counts until tonight
  let n = 0;
  while (days.has(d)) {
    n++;
    d--;
  }
  return n;
}

/** The four stages of the learning loop, each with its live state in a few words. */
export function loopStages(events: LearnEvent[], profile: Profile, exams: Exam[], today: string): LoopStage[] {
  const week = events.filter((e) => e.at >= (events.at(-1)?.at ?? 0) - 7 * DAY);
  const experiments = new Set(week.flatMap((e) => (e.t === "experiment_run" ? [e.sim] : []))).size;
  const weak = profile.weakTopics[0];
  const strongest = [...profile.topicStats].sort((a, b) => a.missRate - b.missRate)[0];
  const soonest = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  return [
    {
      id: "know",
      label: "Knows you",
      verb: "Profile",
      status: profile.focusMinutes ? `Focus ~${profile.focusMinutes} min` : profile.signals.length ? `${profile.signals.length} things noticed` : "Learns as you go",
      href: "/profile",
      empty: !profile.signals.length,
    },
    {
      id: "learn",
      label: "Learn by doing",
      verb: "Lab and lessons",
      status: experiments ? `${experiments} experiment${experiments === 1 ? "" : "s"} this week` : "First experiment waiting",
      href: "/lab",
      empty: !experiments,
    },
    {
      id: "results",
      label: "Shows weak spots",
      verb: "Results",
      status: weak ? `${topics[weak.topic].label} needs work` : strongest ? `${topics[strongest.topic].label} going well` : "Appear after a few answers",
      href: "/profile",
      empty: !profile.topicStats.length,
    },
    {
      id: "plan",
      label: "Plans your path",
      verb: "Planner",
      status: soonest ? `${topics[soonest.topic].subject} exam in ${daysBetween(today, soonest.date)} days` : "Add an exam date",
      href: "/planner",
      empty: !soonest,
    },
  ];
}

/** Today's first planned session, if there is a plan. */
export function todaysFirstSession(exams: Exam[], today: string, profile: Profile, dailyMinutes: number, habit: Parameters<typeof buildPlan>[0]["habit"]) {
  if (!exams.length) return null;
  const day = buildPlan({ exams, today, focusMinutes: profile.focusMinutes, topicStats: profile.topicStats, dailyMinutes, habit })[0];
  return day?.sessions[0] ?? null;
}
