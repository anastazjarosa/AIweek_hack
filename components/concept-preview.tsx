"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Headphones } from "lucide-react";
import { useState } from "react";
import { AudioBar } from "@/components/audio-bar";
import { ViewSwitcher } from "@/components/view-switcher";
import { WithTerms } from "@/components/term";
import { lecture } from "@/lib/data";
import type { ViewId } from "@/lib/dimensions";
import { cn } from "@/lib/utils";

const s = lecture.sections[0];
const next = lecture.sections[1];

/** Landing hero: one concept, reshaped live by the visitor. */
export function ConceptPreview() {
  const [p, setP] = useState<ViewId>("sprints");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">Same slide. Pick a layout.</p>
        <ViewSwitcher id="hero" value={p} onChange={setP} />
      </div>
      <div
        className={cn(
          "relative min-h-[420px] overflow-hidden rounded-3xl border border-line p-6 sm:p-8 shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_40px_-24px_rgba(20,36,59,0.18)] transition-colors duration-300",
          p === "listen" ? "bg-paper" : "bg-surface",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {p === "standard" && <Standard />}
            {p === "sprints" && <Sprints />}
            {p === "listen" && <Listen />}
            {p === "structured" && <Structured />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">{children}</p>;
}

function Standard() {
  return (
    <div>
      <Eyebrow>{lecture.moduleShort} · {lecture.source}</Eyebrow>
      <h3 className="mb-3 text-xl font-medium">{s.title}</h3>
      <p className="text-[15px] leading-relaxed text-muted">{s.body}</p>
    </div>
  );
}

function Sprints() {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Eyebrow>Card 1 of {lecture.sections.length}</Eyebrow>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent tabular-nums">
          <Clock className="h-3.5 w-3.5" /> 4:32
        </span>
      </div>
      <div className="mb-6 flex gap-1.5">
        {lecture.sections.map((_, i) => i === 0).map((on, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", on ? "bg-accent" : "bg-ink/10")} />
        ))}
      </div>
      <p className="mb-8 text-2xl leading-snug font-light">{s.points[0]}</p>
      <p className="mb-3 text-sm font-medium">Quick check: {s.check.q}</p>
      <div className="flex flex-wrap gap-2">
        {s.check.options.map((o, i) => {
          const state = picked === null ? "idle" : i === s.check.answer ? "right" : picked === i ? "wrong" : "idle";
          return (
            <button
              key={o}
              onClick={() => setPicked(i)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors duration-150",
                state === "right" && "border-accent bg-accent-soft text-accent",
                state === "wrong" && "border-clay bg-clay-soft text-clay",
                state === "idle" && "border-line hover:border-ink/30",
              )}
            >
              {state === "right" && <Check className="mr-1 inline h-3.5 w-3.5" />}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Listen() {
  return (
    <div>
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <Headphones className="h-3.5 w-3.5" /> Listen first
        </span>
      </Eyebrow>
      <h3 className="mb-4 text-2xl font-medium">{s.title}</h3>
      <AudioBar seconds={48} label={s.title} className="mb-6" />
      <ul className="space-y-3 text-lg leading-[1.9] tracking-[0.01em]">
        {s.points.slice(0, 3).map((pt) => (
          <li key={pt}>
            <WithTerms text={pt} terms={s.terms} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Structured() {
  return (
    <div>
      <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-canvas p-3">
          <p className="mb-1 font-medium">You will learn</p>
          <p className="text-muted">{s.title}, in {s.points.length} points.</p>
        </div>
        <div className="rounded-2xl bg-canvas p-3">
          <p className="mb-1 font-medium">Next</p>
          <p className="text-muted">Section 2: {next.title}. {next.minutes} minutes.</p>
        </div>
      </div>
      <h3 className="mb-4 text-xl font-medium">
        <span className="mr-2 text-accent">1.</span>
        {s.title}
      </h3>
      <ol className="space-y-2.5 text-[15px] leading-relaxed">
        {s.points.slice(0, 3).map((l, i) => (
          <li key={l} className="flex gap-3">
            <span className="text-muted tabular-nums">1.{i + 1}</span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
