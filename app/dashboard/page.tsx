"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UploadZone } from "@/components/upload-zone";
import { Card } from "@/components/ui/card";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { ScoreBars } from "@/components/score-bars";
import { lecture, modules, todaysPlan, user } from "@/lib/data";
import { views } from "@/lib/dimensions";
import { useHydrated, useProfile } from "@/lib/profile";
import { rules } from "@/lib/screentime/engine";
import { useSession } from "@/lib/screentime/session";

type Added = { id: number; title: string };

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { scores, view } = useProfile();
  const session = useSession();
  const [added, setAdded] = useState<Added[]>([]);
  const total = todaysPlan.reduce((n, s) => n + s.minutes, 0);
  const layout = views.find((v) => v.id === view)!;
  const now = useHydrated() ? new Date() : null;

  const onDone = useCallback((name: string) => {
    const title = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    setAdded((a) => [{ id: Date.now(), title }, ...a]);
  }, []);

  return (
    <AppShell crumb="Dashboard">
      <section className="mb-12 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {/* Date and greeting need the viewer's clock, so they appear after hydration. */}
          <p className="mb-2 min-h-6 text-muted">
            {now?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mb-6 text-4xl font-light tracking-[-0.02em]">
            {now ? greeting(now) : "Welcome back"}, {user.name}.
          </h1>
          <Card className="p-6">
            <div className="mb-5 flex items-baseline justify-between">
              <p className="font-medium">Today&rsquo;s plan</p>
              <p className="text-sm text-muted">
                {todaysPlan.length} sprints, {total} minutes total
              </p>
            </div>
            <ol className="space-y-2">
              {todaysPlan.map((s, i) => (
                <li key={s.title}>
                  <Link
                    href={`/lecture/${lecture.slug}`}
                    className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors duration-150 hover:bg-canvas"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-sm font-medium text-accent">
                      {i + 1}
                    </span>
                    <span className="flex-1">
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
          </Card>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:pt-[76px]">
          <Card className="flex items-center gap-5 p-6">
            <ProgressRing value={46} size={84} />
            <div>
              <p className="font-medium">This week</p>
              <p className="text-sm text-muted">46% of your goal · 2h 10m studied</p>
            </div>
          </Card>
          <Card className="flex items-center gap-5 p-6">
            <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Flame className="h-7 w-7" />
            </span>
            <div>
              <p className="font-medium">{user.streak}-day streak</p>
              <p className="text-sm text-muted">Miss a day and we just reschedule.</p>
            </div>
          </Card>
          <Card className="p-6 sm:col-span-2 lg:col-span-1">
            <p className="mb-4 font-medium">Your needs</p>
            <ScoreBars scores={scores} compact />
          </Card>
          <Card className="p-6 sm:col-span-2 lg:col-span-1">
            <p className="mb-1 font-medium">Live difficulty signals</p>
            {session?.phase === "focus" ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                <Signal label="Wrong answers in a row" value={session.wrongInARow} of={rules.struggle.wrong_in_a_row} />
                <Signal label="Drifted off this block" value={session.idleEvents} of={rules.struggle.idle_events_per_block} />
                <Signal
                  label="Replays of one part"
                  value={Math.max(0, ...Object.values(session.replays))}
                  of={rules.struggle.replays_same_content}
                />
              </ul>
            ) : (
              <p className="text-sm text-muted">These appear during a focus session.</p>
            )}
          </Card>
        </div>
      </section>

      <section id="upload" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-xl font-medium">Add course material</h2>
        <UploadZone onDone={onDone} />
        {added.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {added.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Link href={`/lecture/${lecture.slug}`} className="block h-full">
                  <Card className="h-full p-5 ring-2 ring-accent/30 transition-colors hover:border-accent">
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                      <Sparkles className="h-3 w-3" /> Ready · {layout.label} layout
                    </span>
                    <p className="mb-1 font-medium">{a.title}</p>
                    <p className="text-sm text-muted">Notes · {lecture.flashcards.length} flashcards · {lecture.sections.length}-question quiz</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section id="modules" className="scroll-mt-24">
        <h2 className="mb-4 text-xl font-medium">My modules</h2>
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
                      <span className={l.done ? "block py-1.5 text-[15px] text-muted line-through decoration-ink/20" : "block py-1.5 text-[15px] text-muted"}>
                        {l.title}
                      </span>
                    ) : (
                    <Link
                      href={`/lecture/${l.slug}`}
                      className="group flex items-center justify-between rounded-xl py-1.5 text-[15px] hover:text-accent"
                    >
                      <span className={l.done ? "text-muted line-through decoration-ink/20" : ""}>{l.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
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
