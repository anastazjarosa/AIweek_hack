"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { giveConsent, needsGuardian, sentToAI, useConsent, type AgeBand } from "@/lib/privacy";
import { cn } from "@/lib/utils";

const bands: { id: AgeBand; label: string }[] = [
  { id: "under-13", label: "Under 13" },
  { id: "13-15", label: "13 to 15" },
  { id: "16-17", label: "16 or 17" },
  { id: "18-plus", label: "18 or over" },
];

/**
 * Shown once, before the app is used. Students under 18 confirm a parent or guardian agrees.
 * Plain words about what's kept, what goes to the AI, and that Mosaic never diagnoses.
 */
export function ConsentGate() {
  const consent = useConsent();
  const [band, setBand] = useState<AgeBand | null>(null);
  const [guardian, setGuardian] = useState(false);
  const titleId = useId();
  const guardianId = useId();
  if (consent !== null) return null; // given, or not known yet during server render

  const ready = band !== null && (!needsGuardian(band) || guardian);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="my-8 w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl sm:p-8">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Before you start
        </p>
        <h2 id={titleId} className="mb-4 text-2xl font-light tracking-[-0.01em]">
          Your data, in plain words
        </h2>
        <ul className="mb-5 space-y-2 text-[15px] leading-relaxed text-ink/85">
          <li>Mosaic keeps what you do here (experiments, answers, plans) in this browser only. You can download or delete it any time.</li>
          <li>
            Only two things go to our AI provider (Anthropic) to answer you: {sentToAI.map((s) => s.charAt(0).toLowerCase() + s.slice(1, -1)).join("; and ")}. Never
            your name.
          </li>
          <li>Mosaic describes what helps you learn. It never diagnoses or labels anyone.</li>
        </ul>
        <p className="mb-2 font-medium">How old are you?</p>
        <div role="radiogroup" aria-label="Age" className="mb-4 grid grid-cols-2 gap-2">
          {bands.map((b) => (
            <button
              key={b.id}
              role="radio"
              aria-checked={band === b.id}
              onClick={() => setBand(b.id)}
              className={cn(
                "h-11 rounded-full border text-sm font-medium transition-colors duration-150",
                band === b.id ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-accent",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        {band && needsGuardian(band) && (
          <label htmlFor={guardianId} className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-accent-soft p-4 text-[15px]">
            <input id={guardianId} type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span>A parent or guardian has read this and agrees to me using Mosaic.</span>
          </label>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/privacy" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            Read the full privacy page
          </Link>
          <Button disabled={!ready} onClick={() => band && giveConsent({ ageBand: band, guardian: needsGuardian(band) ? guardian : false })}>
            Agree and continue
          </Button>
        </div>
      </div>
    </div>
  );
}
