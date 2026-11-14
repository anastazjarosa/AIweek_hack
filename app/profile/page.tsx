"use client";

import { ArrowRight, Check, History, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearEvents, replaceEvents, useEvents } from "@/lib/learner/events";
import { computeProfile, demoHistory, type Confidence } from "@/lib/learner/profile";
import { topics } from "@/lib/learner/topics";
import { useHydrated, useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const confidenceText: Record<Confidence, string> = { low: "Early sign", medium: "Getting clearer", high: "Clear pattern" };

export default function LearningProfilePage() {
  const events = useEvents();
  const hydrated = useHydrated();
  const profile = useMemo(() => computeProfile(events), [events]);
  const { scores, setScores } = useProfile();

  return (
    <AppShell crumb="What works for me" showLayout={false}>
      <p className="mb-2 text-sm text-muted">Your learning profile</p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">What works for you</h1>
      <p className="mb-8 max-w-[62ch] text-ink/75">
        Built from what you do in Mosaic, not from labels or a questionnaire. Each finding shows its evidence, so you can
        disagree. Everything stays in this browser.
      </p>

      {hydrated && profile.eventCount < 5 ? (
        <Card className="mb-10 p-6 sm:p-8">
          <p className="mb-2 text-lg font-medium">Not enough to go on yet.</p>
          <p className="mb-6 text-ink/80">
            Try a few experiments in the Simulation Lab, answer some quiz questions, or run a focus session. Your profile
            fills in as you go.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/lab">
                Open the Simulation Lab <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => replaceEvents(demoHistory(Date.now()))}>
              <History /> Load a demo week
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <section aria-labelledby="signals" className="mb-12">
            <h2 id="signals" className="mb-4 text-xl font-medium">
              What we&rsquo;ve noticed
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {profile.signals.map((s) => (
                <li key={s.id}>
                  <Card className="h-full p-6">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium tracking-wide text-muted uppercase">{s.label}</p>
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{confidenceText[s.confidence]}</span>
                    </div>
                    <p className="mb-2 text-lg leading-snug font-medium">{s.finding}.</p>
                    <p className="text-sm text-muted">{s.evidence}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          {profile.topicStats.length > 0 && (
            <section aria-labelledby="topics" className="mb-12">
              <h2 id="topics" className="mb-1 text-xl font-medium">
                Topics
              </h2>
              <p className="mb-4 text-sm text-muted">From your predictions, quiz answers and explanations. The planner gives weak topics more time.</p>
              <Card className="divide-y divide-line">
                {profile.topicStats.map((t) => {
                  const weak = profile.weakTopics.some((w) => w.topic === t.topic);
                  const strength = 1 - t.missRate;
                  return (
                    <div key={t.topic} className="flex flex-wrap items-center gap-4 px-6 py-4">
                      <div className="min-w-[180px] flex-1">
                        <p className="font-medium">{t.label}</p>
                        <p className="text-sm text-muted">
                          {t.attempts - t.misses} of {t.attempts} right{weak ? " · needs more time" : ""}
                        </p>
                      </div>
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${Math.round(strength * 100)}% right`}>
                        <div className={cn("h-full rounded-full", weak ? "bg-clay" : "bg-accent")} style={{ width: `${Math.max(4, strength * 100)}%` }} />
                      </div>
                      <Link href={topics[t.topic].practiceHref} className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                        Practise
                      </Link>
                    </div>
                  );
                })}
              </Card>
            </section>
          )}

          {profile.adaptations.length > 0 && (
            <section aria-labelledby="adapt" className="mb-12">
              <h2 id="adapt" className="mb-1 text-xl font-medium">
                Suggested changes
              </h2>
              <p className="mb-4 text-sm text-muted">Nothing changes unless you say so.</p>
              <ul className="space-y-3">
                {profile.adaptations.map((a) => {
                  const applied = a.scores && Object.entries(a.scores).every(([k, v]) => scores[k as keyof typeof scores] >= (v ?? 0));
                  return (
                    <li key={a.id}>
                      <Card className="flex flex-wrap items-center gap-4 p-5">
                        <div className="min-w-[220px] flex-1">
                          <p className="font-medium">{a.label}</p>
                          <p className="text-sm text-muted">{a.why}</p>
                        </div>
                        {a.scores &&
                          (applied ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                              <Check className="h-4 w-4" /> In use
                            </span>
                          ) : (
                            <Button size="sm" onClick={() => setScores({ ...scores, ...a.scores })}>
                              Use this
                            </Button>
                          ))}
                        {a.id.startsWith("topic-") && (
                          <Link href="/planner" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                            See the plan
                          </Link>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <Button variant="secondary" size="sm" onClick={() => replaceEvents(demoHistory(Date.now()))}>
              <History /> Replace with a demo week
            </Button>
            <Button variant="ghost" size="sm" onClick={clearEvents}>
              <Trash2 /> Clear my history
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
