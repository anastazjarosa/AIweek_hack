"use client";

import { motion } from "framer-motion";
import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { replaceEvents } from "@/lib/learner/events";
import { demoHistory } from "@/lib/learner/profile";
import { addDays, localToday } from "@/lib/planner/plan";
import { plannerActions } from "@/lib/planner/store";
import type { NextStep } from "@/lib/home";

/** Loads a believable week of activity and three exams, for the pitch. */
export function loadDemoWeek() {
  const now = Date.now();
  replaceEvents(demoHistory(now));
  const today = localToday(new Date(now));
  plannerActions.setExams([
    { id: "demo-forces", topic: "forces", date: addDays(today, 12) },
    { id: "demo-reactions", topic: "reactions", date: addDays(today, 19) },
    { id: "demo-history", topic: "history-of-life", date: addDays(today, 26) },
  ]);
}

/** The one thing to do now. Dark, so it is the first thing the eye lands on. */
export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <motion.section
      aria-labelledby="next-step"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-full overflow-hidden rounded-[28px] bg-ink p-7 text-surface sm:p-9"
    >
      {/* Mosaic tiles, the brand mark, drifting off the corner */}
      <div aria-hidden className="pointer-events-none absolute top-7 right-7 hidden grid-cols-2 gap-1.5 sm:grid">
        <span className="h-7 w-7 rounded-lg bg-brand" />
        <span className="h-7 w-7 rounded-lg bg-glow" />
        <span className="h-7 w-7 rounded-lg bg-surface/15" />
        <span className="h-7 w-7 rounded-lg bg-brand/55" />
      </div>
      <p className="relative mb-3 text-sm font-medium text-glow">Your next step</p>
      <p className="relative mb-3 text-[13px] tracking-wide text-surface/60 uppercase">{step.eyebrow}</p>
      <h2 id="next-step" className="relative mb-4 max-w-[22ch] text-3xl leading-[1.15] font-light tracking-[-0.02em] sm:pr-16 sm:text-[40px]">
        {step.title}
      </h2>
      <p className="relative mb-8 max-w-[52ch] text-[16px] leading-relaxed text-surface/75">{step.body}</p>
      <div className="relative flex flex-wrap items-center gap-3">
        <Link
          href={step.cta.href}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-medium text-brand-ink transition-colors duration-150 hover:bg-brand-hover"
        >
          {step.cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
        {step.kind === "first-experiment" ? (
          <button onClick={loadDemoWeek} className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-surface/80 ring-1 ring-surface/25 transition-colors duration-150 hover:text-surface hover:ring-surface/60">
            <History className="h-4 w-4" /> Load a demo week
          </button>
        ) : (
          step.secondary && (
            <Link href={step.secondary.href} className="inline-flex h-12 items-center rounded-full px-5 text-surface/80 ring-1 ring-surface/25 transition-colors duration-150 hover:text-surface hover:ring-surface/60">
              {step.secondary.label}
            </Link>
          )
        )}
      </div>
    </motion.section>
  );
}
