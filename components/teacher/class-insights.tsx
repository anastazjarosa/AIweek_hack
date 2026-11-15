"use client";

import { Lock, Presentation, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { apiHeaders } from "@/lib/client-api";
import { directionWords, type Direction } from "@/lib/sim/spec";
import type { ClassInsight } from "@/lib/teacher/classroom";
import { cn } from "@/lib/utils";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const DIRS: Direction[] = ["up", "down", "same"];

/** Anonymous class misconceptions: what the class predicted, per experiment, most misunderstood first. */
export function ClassInsights() {
  const [data, setData] = useState<{ insights: ClassInsight[]; hidden: number; minGroup: number } | null>(null);
  const refresh = useCallback(async () => {
    const res = await fetch("/api/teacher/class", { headers: apiHeaders() }).catch(() => null);
    if (res?.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const t = window.setInterval(() => void refresh(), 5000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [refresh]);
  const action = (a: "sample" | "clear-sample") =>
    void fetch("/api/teacher/class", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: a }) }).then(refresh);

  const hasSample = data?.insights.some((i) => i.sample);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-[-0.01em]">Class misconceptions</h2>
          <p className="mt-1 max-w-2xl text-muted">What your class predicted before running each experiment. Spot the wrong ideas before the exam does.</p>
        </div>
        <button onClick={() => action(hasSample ? "clear-sample" : "sample")} className="h-10 rounded-full px-4 text-sm font-medium ring-1 ring-line hover:ring-accent">
          {hasSample ? "Clear sample class" : "Load a sample class (28 students)"}
        </button>
      </div>
      <p className="mb-6 flex items-start gap-2 rounded-2xl bg-accent-soft/70 px-4 py-3 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <span>
          Anonymous by design: no names or session ids are stored, only counts per experiment. Experiments with fewer than {data?.minGroup ?? 5} responses are
          hidden so no one can be singled out.
        </span>
      </p>

      {!data || data.insights.length === 0 ? (
        <Card className="p-8 text-center text-muted">No class responses yet. They appear here as students make predictions in the Simulation Lab.</Card>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {data.insights.map((i) => {
            const wrongShare = 1 - i.correctRate;
            const alarm = wrongShare >= 0.5;
            return (
              <li key={i.simId}>
                <Card className={cn("h-full p-6", alarm && "ring-2 ring-clay/30")}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">{i.responses} responses{i.sample ? " · sample" : ""}</p>
                    {alarm && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-clay/10 px-2.5 py-1 text-xs font-medium text-clay">
                        <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Most of the class got it wrong
                      </span>
                    )}
                  </div>
                  <h3 className="mb-3 text-lg font-medium">{i.title}</h3>
                  {i.topWrong && (
                    <p className="mb-4 text-[15px]">
                      <span className="text-2xl font-light text-clay tabular-nums">{pct(i.topWrong.share)}</span> predicted{" "}
                      <span className="font-medium">
                        {i.metric.toLowerCase()} {directionWords[i.topWrong.guess]}
                      </span>
                      . It actually {directionWords[i.answer]}.
                    </p>
                  )}
                  <div className="mb-4 space-y-1.5" role="img" aria-label={DIRS.map((d) => `${directionWords[d]}: ${i.guesses[d]}`).join(", ")}>
                    {DIRS.map((d) => {
                      const share = i.guesses[d] / i.responses;
                      const right = d === i.answer;
                      return (
                        <div key={d} className="flex items-center gap-3 text-sm">
                          <span className="w-36 shrink-0 text-muted">{directionWords[d]}</span>
                          <span className="h-3 flex-1 overflow-hidden rounded-full bg-ink/8">
                            <span className={cn("block h-full rounded-full", right ? "bg-accent" : "bg-clay/60")} style={{ width: `${Math.max(2, share * 100)}%` }} />
                          </span>
                          <span className={cn("w-12 text-right tabular-nums", right && "font-medium text-accent")}>{pct(share)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {i.misconception && (
                    <p className="mb-3 rounded-2xl bg-mark/50 px-4 py-2.5 text-sm">
                      <span className="font-medium">Likely misconception:</span> &ldquo;{i.misconception}&rdquo;
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    {i.ideaCoverage !== null && <span className="text-muted">Explanations cover {pct(i.ideaCoverage)} of the key ideas</span>}
                    <Link href={`/lab/${i.simId}`} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                      <Presentation className="h-4 w-4" aria-hidden /> Run it live in class
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      {data && data.hidden > 0 && (
        <p className="mt-4 text-sm text-muted">
          {data.hidden} more experiment{data.hidden === 1 ? " has" : "s have"} fewer than {data.minGroup} responses and {data.hidden === 1 ? "is" : "are"} hidden to protect anonymity.
        </p>
      )}
    </div>
  );
}
