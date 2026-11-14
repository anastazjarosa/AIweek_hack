"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { AudioBar } from "@/components/audio-bar";
import { Card } from "@/components/ui/card";
import { interests, lecture } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const next = lecture.nextLecture;

export function StructuredView() {
  const { interest, setInterest, needs } = useProfile();
  const analogy = lecture.analogy[interest];
  const n = lecture.sections.length;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-sm text-muted">{lecture.source}</p>
      <h1 className="mb-8 text-4xl font-light tracking-[-0.02em]">{lecture.title}</h1>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="mb-3 font-medium">What you&rsquo;ll learn</p>
          <ol className="space-y-1.5 text-[15px]">
            {lecture.sections.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="w-4 text-accent tabular-nums">{i + 1}.</span>
                <a href={`#a-${s.id}`} className="hover:text-accent">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="flex flex-col p-6">
          <p className="mb-3 font-medium">What&rsquo;s next</p>
          <ul className="space-y-1.5 text-[15px] text-ink/85">
            <li>This lecture has {n} sections.</li>
            <li>It takes {lecture.minutes} minutes in total.</li>
            <li>Every section has the same layout.</li>
            <li>After this lecture: {next.title}.</li>
          </ul>
          <div className="mt-auto pt-5">
            <p className="mb-2 text-sm text-muted">Examples use your interest:</p>
            <div role="radiogroup" aria-label="Interest for examples" className="flex gap-2">
              {interests.map((it) => (
                <button
                  key={it.id}
                  role="radio"
                  aria-checked={interest === it.id}
                  onClick={() => setInterest(it.id)}
                  className={cn(
                    "h-9 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                    interest === it.id ? "border-accent bg-accent text-accent-ink" : "border-line hover:border-ink/30",
                  )}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <ol className="space-y-6">
        {lecture.sections.map((s, i) => (
          <li key={s.id} id={`a-${s.id}`} className="scroll-mt-24">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-canvas/60 px-7 py-3 text-sm text-muted">
                <span>
                  Section {i + 1} of {n}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {s.minutes} minutes
                </span>
              </div>
              <div className="px-7 py-7">
                <h2 className="mb-5 text-2xl font-medium">
                  <span className="mr-2 text-accent">{i + 1}.</span>
                  {s.title}
                </h2>
                {needs.processing === "high" && (
                  <AudioBar seconds={s.minutes * 45} label={s.title} contentId={s.id} className="mb-5" />
                )}
                <ol className="space-y-3 text-[17px] leading-relaxed">
                  {s.points.map((l, k) => (
                    <li key={l} className="grid grid-cols-[2.5rem_1fr] gap-2">
                      <span className="text-muted tabular-nums">
                        {i + 1}.{k + 1}
                      </span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ol>
                {i === 0 && (
                  <div className="mt-7 rounded-2xl bg-accent-soft p-6">
                    <p className="mb-3 text-sm font-medium text-accent">Example: {analogy.title}</p>
                    <ol className="space-y-2 text-[17px] leading-relaxed">
                      {analogy.lines.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              <div className="border-t border-line px-7 py-3 text-sm text-muted">
                Next:{" "}
                {i < n - 1 ? (
                  <span className="text-ink">
                    Section {i + 2}, {lecture.sections[i + 1].title}
                  </span>
                ) : (
                  <span className="text-ink">End of this lecture</span>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-7">
        <div>
          <p className="font-medium">You have finished all {n} sections.</p>
          <p className="text-muted">The next lecture is {next.title}. It has {next.sections} sections and takes {next.minutes} minutes.</p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 font-medium text-accent">
          Back to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
