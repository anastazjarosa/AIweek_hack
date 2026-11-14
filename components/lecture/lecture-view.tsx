"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ListenView } from "@/components/lecture/listen-view";
import { SprintsView } from "@/components/lecture/sprints-view";
import { StructuredView } from "@/components/lecture/structured-view";
import { StandardView } from "@/components/lecture/standard-view";
import { lecture } from "@/lib/data";
import { useHydrated, useProfile } from "@/lib/profile";

export function LectureView() {
  const { view } = useProfile();
  const hydrated = useHydrated();
  return (
    <AppShell
      crumb={
        <span>
          <Link href="/dashboard" className="hover:text-ink">
            {lecture.moduleShort}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{lecture.title}</span>
        </span>
      }
    >
      <LabEntry />
      {!hydrated ? (
        <div className="min-h-[60vh]" />
      ) : (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {view === "standard" && <StandardView />}
          {view === "sprints" && <SprintsView />}
          {view === "listen" && <ListenView />}
          {view === "structured" && <StructuredView />}
        </motion.div>
      </AnimatePresence>
      )}
    </AppShell>
  );
}

/** Same for every layout: the hands-on version of the forgetting-curve and spacing slides. */
function LabEntry() {
  return (
    <Link
      href={`/lecture/${lecture.slug}/lab`}
      className="group mb-8 flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-line transition-colors duration-150 hover:ring-accent"
    >
      <FlaskConical className="h-5 w-5 shrink-0 text-accent" />
      <span className="flex-1">
        <span className="font-medium">Try it: spacing lab</span>
        <span className="block text-sm text-muted">Predict, run and explain how study timing changes what you remember. 2 minutes.</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function LectureTitle({ big = false }: { big?: boolean }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm text-muted">{lecture.source}</p>
      <h1 className={big ? "text-5xl font-light tracking-[-0.03em]" : "text-4xl font-light tracking-[-0.02em]"}>
        {lecture.title}
      </h1>
    </div>
  );
}
