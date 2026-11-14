"use client";

import { ArrowRight, CalendarPlus, Check, Footprints, Play, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { replaceEvents, useEvents } from "@/lib/learner/events";
import { computeProfile, demoHistory } from "@/lib/learner/profile";
import { topicIds, topics, type TopicId } from "@/lib/learner/topics";
import {
  addDays,
  buildPlan,
  daysBetween,
  detectHabits,
  firstStep,
  habitCoach,
  localToday,
  minutesByTopic,
  weeklyCheckIn,
  type Habit,
  type PlanSession,
} from "@/lib/planner/plan";
import { plannerActions, usePlanner } from "@/lib/planner/store";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const kindLabel = { learn: "Learn", practice: "Practise", review: "Review" } as const;
const fmtDay = (d: string, today: string) => {
  const n = daysBetween(today, d);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};

export default function PlannerPage() {
  const now = useNow();
  const today = now ? localToday(new Date(now)) : "";
  const events = useEvents();
  const planner = usePlanner();
  const profile = useMemo(() => computeProfile(events), [events]);
  const habits = useMemo(() => (now ? detectHabits(events, now) : []), [events, now]);
  const habit: Habit | null = planner.habit ?? habits[0]?.habit ?? null;
  const plan = useMemo(
    () =>
      today
        ? buildPlan({ exams: planner.exams, today, focusMinutes: profile.focusMinutes, topicStats: profile.topicStats, dailyMinutes: planner.dailyMinutes, habit })
        : [],
    [today, planner, profile, habit],
  );
  const checkIn = useMemo(
    () => (today ? weeklyCheckIn(events, now, profile.weakTopics, planner.exams, today) : null),
    [events, now, profile, planner.exams, today],
  );
  const [showAll, setShowAll] = useState(false);
  const next = plan.find((d) => d.sessions.length)?.sessions[0] ?? null;
  const totals = minutesByTopic(plan);

  const loadDemo = () => {
    replaceEvents(demoHistory(Date.now()));
    plannerActions.setExams([
      { id: "demo-forces", topic: "forces", date: addDays(localToday(), 12) },
      { id: "demo-reactions", topic: "reactions", date: addDays(localToday(), 19) },
      { id: "demo-history", topic: "history-of-life", date: addDays(localToday(), 26) },
    ]);
  };

  return (
    <AppShell crumb="Study planner" showLayout={false}>
      <p className="mb-2 text-sm text-muted">Plan and coach</p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">Study planner</h1>
      <p className="mb-8 max-w-[62ch] text-ink/75">
        Add your exam dates. The plan sizes sessions to how long you focus and gives weak topics more time, using{" "}
        <Link href="/profile" className="font-medium text-accent underline-offset-4 hover:underline">
          what works for you
        </Link>
        .
      </p>

      <div className="mb-10 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <TodayCard session={next} />
          {checkIn && (
            <Card className="p-6">
              <p className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
                <Sparkles className="h-4 w-4" aria-hidden /> Weekly check-in
              </p>
              <p className="mb-4 text-lg font-medium">{checkIn.headline}</p>
              <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {checkIn.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl px-3 py-2 ring-1 ring-line">
                    <dt className="text-xs text-muted">{s.label}</dt>
                    <dd className="text-lg font-medium tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
              {checkIn.improved.length > 0 && (
                <>
                  <p className="mb-1 text-sm font-medium">What you improved</p>
                  <ul className="mb-3 space-y-1 text-[15px]">
                    {checkIn.improved.map((s) => (
                      <li key={s} className="flex gap-2">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mb-1 text-sm font-medium">What&rsquo;s next</p>
              <ul className="space-y-1 text-[15px]">
                {checkIn.next.map((s) => (
                  <li key={s} className="flex gap-2">
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <ExamsCard today={today} onDemo={loadDemo} />
          <Card className="p-6">
            <p className="mb-1 font-medium">Habit coach</p>
            <p className="mb-4 text-sm text-muted">Pick what you&rsquo;d like help with. We suggest one from what we&rsquo;ve noticed.</p>
            <div role="radiogroup" aria-label="Habit coach" className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(habitCoach) as Habit[]).map((h) => {
                const suggested = habits.find((x) => x.habit === h);
                return (
                  <button
                    key={h}
                    role="radio"
                    aria-checked={habit === h}
                    onClick={() => plannerActions.setHabit(h)}
                    className={cn(
                      "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                      habit === h ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-accent",
                    )}
                  >
                    {habitCoach[h].label}
                    {suggested && <span className="text-xs font-normal opacity-80"> · suggested</span>}
                  </button>
                );
              })}
            </div>
            {habit && (
              <>
                {habits.find((x) => x.habit === habit) && <p className="mb-2 text-sm text-muted">Why: {habits.find((x) => x.habit === habit)!.evidence}</p>}
                <ul className="space-y-1.5 text-[15px]">
                  {habitCoach[habit].tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </div>

      {plan.length > 0 && (
        <section aria-labelledby="plan">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="plan" className="text-xl font-medium">
              Your plan
            </h2>
            <p className="text-sm text-muted">
              {topicIds
                .filter((t) => totals[t])
                .map((t) => `${topics[t].label} ${Math.round(totals[t]! / 6) / 10} h`)
                .join(" · ")}
            </p>
          </div>
          <ol className="space-y-3">
            {(showAll ? plan : plan.slice(0, 7)).map((d) => (
              <li key={d.date}>
                <Card className={cn("flex flex-wrap items-start gap-4 p-5", d.examToday.length > 0 && "ring-2 ring-accent/40")}>
                  <p className="w-28 shrink-0 font-medium">{fmtDay(d.date, today)}</p>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    {d.examToday.map((t) => (
                      <span key={t} className="rounded-full bg-brand px-3 py-1 text-sm font-medium text-brand-ink">
                        {topics[t].subject} exam
                      </span>
                    ))}
                    {d.sessions.map((s, i) => (
                      <Link
                        key={i}
                        href={s.href}
                        className="rounded-full px-3 py-1 text-sm ring-1 ring-line transition-colors duration-150 hover:ring-accent"
                      >
                        {kindLabel[s.kind]} · {topics[s.topic].label} · {s.minutes} min
                      </Link>
                    ))}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
          {plan.length > 7 && (
            <Button variant="ghost" className="mt-3" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show the next week only" : `Show all ${plan.length} days`}
            </Button>
          )}
        </section>
      )}
    </AppShell>
  );
}

function ExamsCard({ today, onDemo }: { today: string; onDemo: () => void }) {
  const { exams, dailyMinutes } = usePlanner();
  const [topic, setTopic] = useState<TopicId>("forces");
  const [date, setDate] = useState("");
  const topicId = useId();
  const dateId = useId();
  const minId = useId();
  return (
    <Card className="p-6">
      <p className="mb-4 font-medium">Exams</p>
      {exams.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {exams.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 ring-1 ring-line">
              <span>
                <span className="font-medium">{topics[e.topic].label}</span>
                <span className="block text-sm text-muted">
                  {today && `${fmtDay(e.date, today)} · ${Math.max(0, daysBetween(today, e.date))} days`}
                </span>
              </span>
              <button onClick={() => plannerActions.removeExam(e.id)} aria-label={`Remove ${topics[e.topic].label} exam`} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-sm text-muted">No exams yet. Add one to get a plan.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (date && date >= today) {
            plannerActions.addExam(topic, date);
            setDate("");
          }
        }}
        className="grid gap-3"
      >
        <label htmlFor={topicId} className="sr-only">
          Topic
        </label>
        <select id={topicId} value={topic} onChange={(e) => setTopic(e.target.value as TopicId)} className="h-11 w-full min-w-0 rounded-full border border-line bg-surface px-4">
          {topicIds.map((t) => (
            <option key={t} value={t}>
              {topics[t].subject}: {topics[t].label}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <label htmlFor={dateId} className="sr-only">
            Exam date
          </label>
          <input
            id={dateId}
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4"
          />
          <Button type="submit" disabled={!date}>
            <CalendarPlus /> Add
          </Button>
        </div>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <label htmlFor={minId} className="text-sm">
          Study time a day
        </label>
        <select id={minId} value={dailyMinutes} onChange={(e) => plannerActions.setDailyMinutes(Number(e.target.value))} className="h-10 rounded-full border border-line bg-surface px-3 text-sm">
          {[20, 30, 40, 60, 90].map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </div>
      <button onClick={onDemo} className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline">
        Load demo exams and a demo week
      </button>
    </Card>
  );
}

const STARTER_SEC = 120;

/** The procrastination coach's tiny first step: two minutes, one action, stopping is allowed. */
function TodayCard({ session }: { session: PlanSession | null }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt]);
  const left = startedAt === null ? STARTER_SEC : Math.max(0, STARTER_SEC - Math.floor((now - startedAt) / 1000));
  const done = startedAt !== null && left === 0;

  if (!session) {
    return (
      <Card className="p-6">
        <p className="mb-1 font-medium">Today</p>
        <p className="text-muted">Add an exam and today&rsquo;s first step appears here.</p>
      </Card>
    );
  }
  return (
    <Card className="p-6 ring-1 ring-accent/30">
      <p className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
        <Footprints className="h-4 w-4" aria-hidden /> Tiny first step
      </p>
      <p className="mb-1 text-xl leading-snug font-medium">{firstStep(session)}</p>
      <p className="mb-5 text-sm text-muted">
        Then, if you like, carry on: {kindLabel[session.kind].toLowerCase()} {topics[session.topic].label.toLowerCase()} for {session.minutes} minutes.
      </p>
      {startedAt === null ? (
        <Button
          onClick={() => {
            setStartedAt(Date.now());
            setNow(Date.now());
          }}
        >
          <Play /> Start with 2 minutes
        </Button>
      ) : done ? (
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <p className="font-medium">Two minutes done. That&rsquo;s a start.</p>
          <Button asChild>
            <Link href={session.href}>
              Keep going <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setStartedAt(null)}>
            Stop here
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-3xl font-light tabular-nums" aria-live="off">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </p>
          <Button asChild variant="secondary">
            <Link href={session.href}>
              Open it <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setStartedAt(null)}>
            Not now
          </Button>
        </div>
      )}
    </Card>
  );
}
