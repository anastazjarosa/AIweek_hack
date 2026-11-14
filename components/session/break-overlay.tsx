"use client";

import { motion } from "framer-motion";
import { Camera, Check, Eye, Mic, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioBar } from "@/components/audio-bar";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { rules, type TaskType } from "@/lib/screentime/engine";
import { planFinalTask, planTask, sectionForBlock, taskLabels, type BreakTask } from "@/lib/screentime/planner";
import { fmtClock, reasonLabels, sessionActions, useSession } from "@/lib/screentime/session";
import { cn } from "@/lib/utils";

const kindLabel = { short: "Short break", long: "Long break", early: "Early break", final: "Done for today" };

export function BreakOverlay() {
  const s = useSession()!;
  const br = s.breaks[s.breaks.length - 1];
  const section = sectionForBlock(br.afterBlock);
  const task: BreakTask = br.taskType === "final_summary" ? planFinalTask() : planTask(br.taskType, section);
  const dim = br.taskType === "walk_and_listen";
  const over = s.breakLeftSec <= 0;
  const final = s.phase === "final";

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-labelledby="break-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto transition-colors duration-700",
        dim ? "bg-[#101614] text-white/80" : "bg-canvas text-ink",
      )}
    >
      <div className="mx-auto flex min-h-full max-w-[760px] flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between gap-6">
          <div>
            <p className={cn("mb-2 text-sm font-medium", dim ? "text-[#9fd3c1]" : "text-accent")}>
              {kindLabel[br.kind]} · {br.plannedMin} min
            </p>
            {br.reason !== "scheduled" && (
              <p className={cn("text-sm", dim ? "text-white/50" : "text-muted")}>Why now: {reasonLabels[br.reason]}</p>
            )}
          </div>
          <div className={cn(dim && "opacity-70")}>
            <ProgressRing value={(s.breakLeftSec / (br.plannedMin * 60)) * 100} size={88} stroke={5} label={fmtClock(s.breakLeftSec)} />
          </div>
        </div>

        <p className={cn("mb-2 text-sm tracking-wide uppercase", dim ? "text-white/50" : "text-muted")}>{task.title}</p>
        <h2 id="break-title" className="mb-6 text-4xl leading-tight font-light tracking-[-0.02em]">
          {task.instruction}
        </h2>
        <ul className={cn("mb-8 space-y-2 text-lg", dim ? "text-white/70" : "text-ink/80")}>
          {task.steps.map((st) => (
            <li key={st} className="flex gap-3">
              <span aria-hidden className={cn("mt-3 h-1.5 w-1.5 shrink-0 rounded-full", dim ? "bg-white/40" : "bg-accent")} />
              {st}
            </li>
          ))}
        </ul>

        <div className="mb-10">
          {task.type === "teach_back" && <FakeRecorder />}
          {task.type === "paper_sketch" && <PhotoPicker />}
          {task.type === "walk_and_listen" && (
            <AudioBar seconds={90} label={`recap of ${section.title}`} dark className="bg-white/5 ring-white/10" />
          )}
          {task.reveal && <Reveal items={task.reveal} />}
        </div>

        {!final && s.needs.predictability === "high" && (
          <div className="mb-10">
            <p className={cn("mb-2 text-sm", dim ? "text-white/50" : "text-muted")}>
              You&rsquo;ll get this same task each break. Want a different one?
            </p>
            <div className="flex flex-wrap gap-2">
              {(rules.task_types as TaskType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => sessionActions.changeTask(t)}
                  aria-pressed={br.taskType === t}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm",
                    br.taskType === t
                      ? dim
                        ? "bg-white/15 text-white"
                        : "bg-accent text-accent-ink"
                      : dim
                        ? "text-white/60 ring-1 ring-white/15 hover:text-white"
                        : "bg-surface ring-1 ring-line hover:ring-ink/30",
                  )}
                >
                  {taskLabels[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {final ? (
            <Button asChild size="lg" onClick={sessionActions.finishBreak}>
              <Link href="/summary">See today&rsquo;s summary</Link>
            </Button>
          ) : (
            <Button size="lg" onClick={sessionActions.finishBreak} className={cn(dim && "bg-white text-ink hover:bg-white/90")}>
              {over ? "I'm back" : "I'm back early"}
            </Button>
          )}
          <p className={cn("text-sm", dim ? "text-white/50" : "text-muted")} aria-live="polite">
            {over ? "Break's over. Come back when you're ready." : "Screen time is paused. This counts as off-screen learning."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Pretend voice recorder. Nothing is captured. */
function FakeRecorder() {
  const [rec, setRec] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!rec) return;
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [rec]);
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setRec((r) => !r)}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-full px-5 font-medium",
          rec ? "bg-clay text-white" : "bg-surface ring-1 ring-line hover:ring-ink/30",
        )}
      >
        {rec ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4 text-accent" />}
        {rec ? "Stop" : t ? "Record again" : "Record"}
      </button>
      <span className="text-sm text-muted tabular-nums">
        {rec ? `Recording ${fmtClock(t)}` : t ? `Saved · ${fmtClock(t)}` : "Optional, stays on your device"}
      </span>
    </div>
  );
}

function PhotoPicker() {
  const [name, setName] = useState<string | null>(null);
  return (
    <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-surface px-5 font-medium ring-1 ring-line hover:ring-ink/30">
      {name ? <Check className="h-4 w-4 text-accent" /> : <Camera className="h-4 w-4 text-accent" />}
      {name ? "Photo added" : "Add a photo (optional)"}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setName(e.target.files?.[0]?.name ?? null)} />
    </label>
  );
}

function Reveal({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <ol className="space-y-2 rounded-2xl bg-surface p-5 ring-1 ring-line">
      {items.map((i, k) => (
        <li key={i} className="flex gap-3">
          <span className="text-accent tabular-nums">{k + 1}.</span>
          {i}
        </li>
      ))}
    </ol>
  ) : (
    <Button variant="secondary" onClick={() => setOpen(true)}>
      <Eye /> Check yourself
    </Button>
  );
}
