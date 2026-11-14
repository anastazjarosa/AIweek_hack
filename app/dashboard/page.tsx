"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LearningLoop } from "@/components/home/learning-loop";
import { NextStepCard } from "@/components/home/next-step-card";
import { ScoreBars } from "@/components/score-bars";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadZone } from "@/components/upload-zone";
import { lecture, modules, todaysPlan, user } from "@/lib/data";
import { views } from "@/lib/dimensions";
import { loopStages, nextStep, streakDays, todaysFirstSession } from "@/lib/home";
import { useEvents } from "@/lib/learner/events";
import { LearningMix } from "@/components/learner/learning-mix";
import { detectPatterns } from "@/lib/learner/patterns";
import { computeProfile } from "@/lib/learner/profile";
import { topics } from "@/lib/learner/topics";
import { buildPlan, localToday, weeklyCheckIn } from "@/lib/planner/plan";
import { usePlanner } from "@/lib/planner/store";
import { useProfile } from "@/lib/profile";
import { rules } from "@/lib/screentime/engine";
import { useSession } from "@/lib/screentime/session";
import { useNow } from "@/lib/use-now";

type Added = { id: number; title: string };
const kindLabel = { learn: "Learn", practice: "Practise", review: "Review" } as const;

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const { scores, view } = useProfile();
  const session = useSession();
  const [added, setAdded] = useState<Added[]>([]);
  const layout = views.find((v) => v.id === view)!;

  const now = useNow();
  const today = now ? localToday(new Date(now)) : "";
  const events = useEvents();
  const planner = usePlanner();
  const profile = useMemo(() => computeProfile(events), [events]);

  const first = useMemo(
    () => (today ? todaysFirstSession(planner.exams, today, profile, planner.dailyMinutes, planner.habit) : null),
    [today, planner, profile],
  );
  const step = useMemo(() => nextStep(events, profile, planner.exams, today, first), [events, profile, planner.exams, today, first]);
  const stages = useMemo(() => loopStages(events, profile, planner.exams, today), [events, profile, planner.exams, today]);
  const week = useMemo(() => (now ? weeklyCheckIn(events, now, profile.weakTopics, planner.exams, today) : null), [events, now, profile, planner.exams, today]);
  const streak = now ? streakDays(events, now) : 0;
  const detected = useMemo(() => detectPatterns(profile), [profile]);

  // Today's plan comes from the planner once exams are added; until then, the sample sprints.
  const planned = useMemo(() => {
    if (!today || !planner.exams.length) return null;
    const day = buildPlan({ exams: planner.exams, today, focusMinutes: profile.focusMinutes, topicStats: profile.topicStats, dailyMinutes: planner.dailyMinutes, habit: planner.habit })[0];
    return day?.sessions.map((s) => ({ title: `${kindLabel[s.kind]}: ${topics[s.topic].label}`, module: topics[s.topic].subject, minutes: s.minutes, href: s.href }));
  }, [today, planner, profile]);
  const items = planned ?? todaysPlan.map((s) => ({ ...s, href: `/lecture/${lecture.slug}` }));
  const total = items.reduce((n, s) => n + s.minutes, 0);
  const needsSet = Object.values(scores).some((v) => v > 0);

  const onDone = useCallback((name: string) => {
    const title = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    setAdded((a) => [{ id: Date.now(), title }, ...a]);
  }, []);

  return (
    <AppShell crumb="Today">
      {/* Date and greeting need the viewer's clock, so they appear after hydration. */}
      <p className="mb-1 min-h-6 text-muted">{now ? new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : ""}</p>
      <h1 className="mb-8 text-4xl font-light tracking-[-0.02em] sm:text-[44px]">
        {now ? greeting(new Date(now)) : "Welcome back"}, {user.name}.
      </h1>

      <section className="mb-14 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <NextStepCard step={step} />
        </div>
        <Card className="flex flex-col p-6 lg:col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-medium">This week</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-medium text-accent">
              <Flame className="h-3.5 w-3.5" aria-hidden /> {streak ? `${streak}-day streak` : "Start a streak today"}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {(week?.stats ?? []).map((s) => (
              <div key={s.label} className="rounded-2xl bg-canvas/70 px-4 py-3">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="text-2xl font-light tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto pt-4 text-sm text-muted">{week?.headline}</p>
          <Link href="/planner" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline">
            Weekly check-in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>

      <section aria-labelledby="loop" className="mb-14">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="loop" className="text-2xl font-light tracking-[-0.01em]">
            How Mosaic works for you
          </h2>
          <p className="text-sm text-muted">Live from what you&rsquo;ve done. Each part feeds the next.</p>
        </div>
        <LearningLoop stages={stages} current={step.stage} />
        <div className="mt-5">
          <LearningMix detected={detected} compact />
        </div>
      </section>

      <section className="mb-14 grid items-start gap-5 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-7">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <p className="font-medium">Today&rsquo;s plan</p>
            <p className="text-sm text-muted">
              {items.length} sessions · {total} min
            </p>
          </div>
          <ol className="space-y-1">
            {items.map((s, i) => (
              <li key={`${s.title}-${i}`}>
                <Link href={s.href} className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors duration-150 hover:bg-canvas">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-medium text-accent">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{s.title}</span>
                    <span className="text-sm text-muted">{s.module}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted tabular-nums">
                    <Clock className="h-3.5 w-3.5" />
                    {s.minutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/planner" className="mt-3 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-accent underline-offset-4 hover:underline">
            {planned ? "Open the study planner" : "Add exam dates for a plan built around you"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
        <div className="grid gap-5 lg:col-span-5">
          <Card className="p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="font-medium">Your needs</p>
              <Link href="/preferences" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Edit
              </Link>
            </div>
            {needsSet ? (
              <ScoreBars scores={scores} compact />
            ) : (
              <p className="text-[15px] text-ink/80">
                None set, and that&rsquo;s fine: Mosaic learns from what you do. You can also{" "}
                <Link href="/onboarding" className="font-medium text-accent underline-offset-4 hover:underline">
                  answer 8 quick statements
                </Link>{" "}
                to give it a head start.
              </p>
            )}
          </Card>
          {session?.phase === "focus" && (
            <Card className="p-6">
              <p className="mb-3 font-medium">Live difficulty signals</p>
              <ul className="space-y-1.5 text-sm">
                <Signal label="Wrong answers in a row" value={session.wrongInARow} of={rules.struggle.wrong_in_a_row} />
                <Signal label="Drifted off this block" value={session.idleEvents} of={rules.struggle.idle_events_per_block} />
                <Signal label="Replays of one part" value={Math.max(0, ...Object.values(session.replays))} of={rules.struggle.replays_same_content} />
              </ul>
            </Card>
          )}
        </div>
      </section>

      <section id="modules" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-light tracking-[-0.01em]">Your lectures</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((m) => (
            <Card key={m.id} className="flex flex-col p-6">
              <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">{m.code}</p>
              <p className="mb-5 text-xl font-medium">{m.title}</p>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Progress</span>
                <span className="tabular-nums">{m.progress}%</span>
              </div>
              <Progress value={m.progress} className="mb-6" />
              <ul className="mt-auto space-y-1 border-t border-line pt-4">
                {m.lectures.map((l) => (
                  <li key={l.title}>
                    {!l.slug ? (
                      <span className={l.done ? "block py-1.5 text-[15px] text-muted line-through decoration-ink/20" : "block py-1.5 text-[15px] text-muted"}>{l.title}</span>
                    ) : (
                      <Link href={`/lecture/${l.slug}`} className="group flex items-center justify-between rounded-xl py-1.5 text-[15px] font-medium hover:text-accent">
                        <span className={l.done ? "text-muted line-through decoration-ink/20" : ""}>{l.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section id="upload" className="scroll-mt-24">
        <h2 className="mb-1 text-2xl font-light tracking-[-0.01em]">Add course material</h2>
        <p className="mb-4 text-sm text-muted">Slides, a textbook chapter or a coursework brief become notes, flashcards and a quiz in your layout.</p>
        <UploadZone onDone={onDone} />
        {added.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {added.map((a) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Link href={`/lecture/${lecture.slug}`} className="block h-full">
                  <Card className="h-full p-5 ring-2 ring-accent/30 transition-colors hover:border-accent">
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                      <Sparkles className="h-3 w-3" /> Ready · {layout.label} layout
                    </span>
                    <p className="mb-1 font-medium">{a.title}</p>
                    <p className="text-sm text-muted">
                      Notes · {lecture.flashcards.length} flashcards · {lecture.sections.length}-question quiz
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Signal({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <li className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={value >= of ? "font-medium text-clay" : "tabular-nums"}>
        {value} / {of}
      </span>
    </li>
  );
}
