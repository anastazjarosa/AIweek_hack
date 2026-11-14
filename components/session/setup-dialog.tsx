"use client";

import { Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { breakAfter, baseBlockMinutes, rules, schedule, warningSeconds } from "@/lib/screentime/engine";
import { sessionActions } from "@/lib/screentime/session";
import { useProfile } from "@/lib/profile";
import { dimensions, personas } from "@/lib/dimensions";
import { cn } from "@/lib/utils";


const caps = [30, 60, 90, 120];

export function SetupDialog() {
  const { needs, scores, setScores } = useProfile();
  const [cap, setCap] = useState(rules.daily_cap_minutes_default);
  const [demoSpeed, setDemoSpeed] = useState(true);
  const block = baseBlockMinutes(needs);
  const plan = schedule(needs, cap);
  const total = plan.reduce((n, i) => n + i.minutes, 0);
  const demo = personas[0];
  const isDemo = dimensions.every((d) => scores[d.key] === demo.scores[d.key]);
  const warn = warningSeconds(needs).map((w) => (w >= 60 ? `${w / 60} min` : `${w} s`));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal aria-labelledby="setup-title" className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-surface p-8 shadow-2xl">
        <h2 id="setup-title" className="mb-1 text-2xl font-light tracking-[-0.02em]">
          Start a focus session
        </h2>
        <p className="mb-6 text-muted">Blocks, breaks and off-screen tasks are set from your needs.</p>

        <div className="mb-6 rounded-2xl bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Your needs</p>
            <button
              onClick={() => setScores(demo.scores)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                isDemo ? "bg-brand text-brand-ink" : "bg-surface ring-1 ring-line hover:ring-ink/30",
              )}
            >
              <Sparkles className="h-3 w-3" /> {demo.name.split(":")[0]}: high focus + high structure
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {dimensions.map(({ key: k, label }) => (
              <div key={k} className="rounded-xl bg-surface px-3 py-2">
                <p className="text-xs text-muted">{label}</p>
                <p className={cn("font-medium capitalize", needs[k] === "high" && "text-accent")}>{needs[k]}</p>
              </div>
            ))}
          </div>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted">Focus block</dt>
          <dd className="font-medium">{block} min</dd>
          <dt className="text-muted">Breaks</dt>
          <dd className="font-medium">
            {breakAfter(1).minutes} min, {rules.long_break_minutes} min after every {rules.long_break_every_blocks} blocks
          </dd>
          <dt className="text-muted">Heads-up before a break</dt>
          <dd className="font-medium">{warn.join(", ")}</dd>
        </dl>

        {needs.predictability === "high" && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium">Today&rsquo;s schedule</p>
            <div className="mb-2 flex h-3 overflow-hidden rounded-full" aria-hidden>
              {plan.map((i, k) => (
                <span
                  key={k}
                  style={{ flexGrow: i.minutes }}
                  className={cn("h-full border-r-2 border-surface", i.type === "focus" ? "bg-accent" : i.type === "long" ? "bg-mark" : "bg-accent-soft")}
                />
              ))}
            </div>
            <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {plan.slice(0, 8).map((i, k) => (
                <li key={k}>
                  {i.type === "focus" ? "Study" : i.type === "long" ? "Long break" : "Break"} {i.minutes}m
                  {k < Math.min(plan.length, 8) - 1 && " →"}
                </li>
              ))}
              {plan.length > 8 && <li>… {total} min in all</li>}
            </ol>
          </div>
        )}

        <div className="mb-8 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Daily screen limit</p>
            <div className="flex gap-1.5">
              {caps.map((c) => (
                <button
                  key={c}
                  onClick={() => setCap(c)}
                  aria-pressed={cap === c}
                  className={cn(
                    "h-9 flex-1 rounded-full text-sm font-medium",
                    cap === c ? "bg-brand text-brand-ink" : "bg-canvas hover:bg-accent-soft",
                  )}
                >
                  {c}m
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Clock</p>
            <div className="flex gap-1.5">
              {[true, false].map((d) => (
                <button
                  key={String(d)}
                  onClick={() => setDemoSpeed(d)}
                  aria-pressed={demoSpeed === d}
                  className={cn(
                    "h-9 flex-1 rounded-full text-sm font-medium",
                    demoSpeed === d ? "bg-brand text-brand-ink" : "bg-canvas hover:bg-accent-soft",
                  )}
                >
                  {d ? `Demo ${rules.demo.speed}×` : "Real time"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={sessionActions.cancelSetup}>
            Cancel
          </Button>
          <Button onClick={() => sessionActions.start({ needs, capMin: cap, speed: demoSpeed ? rules.demo.speed : 1 })}>
            <Play /> Start {block}-minute block
          </Button>
        </div>
      </div>
    </div>
  );
}
