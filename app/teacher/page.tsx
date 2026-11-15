"use client";

import { FlaskConical, MessageCircleQuestion, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClassInsights } from "@/components/teacher/class-insights";
import { EscalationQueue } from "@/components/teacher/escalation-queue";
import { ReviewQueue } from "@/components/teacher/review-queue";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "class", label: "Class misconceptions", icon: Users },
  { id: "questions", label: "Questions for you", icon: MessageCircleQuestion },
  { id: "experiments", label: "Experiment reviews", icon: FlaskConical },
] as const;
type Tab = (typeof tabs)[number]["id"];

/** Teacher Studio: the human in the loop. */
export default function TeacherStudio() {
  const [tab, setTab] = useState<Tab>("class");
  return (
    <AppShell crumb="Teacher Studio">
      <p className="mb-2 text-sm font-medium text-accent">For lecturers</p>
      <h1 className="mb-2 text-4xl font-light tracking-[-0.02em]">Teacher Studio</h1>
      <p className="mb-8 max-w-2xl text-muted">
        See what your class misunderstands, answer the questions Pip couldn&rsquo;t, and approve AI-built experiments before students use them.
      </p>
      <div role="tablist" aria-label="Teacher Studio" className="mb-8 flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              tab === t.id ? "bg-ink text-surface" : "text-muted ring-1 ring-line hover:text-ink",
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "class" && <ClassInsights />}
        {tab === "questions" && <EscalationQueue />}
        {tab === "experiments" && <ReviewQueue />}
      </div>
    </AppShell>
  );
}
