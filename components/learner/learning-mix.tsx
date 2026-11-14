import { ArrowRight, Wand2 } from "lucide-react";
import Link from "next/link";
import type { DetectedPattern } from "@/lib/learner/patterns";
import { cn } from "@/lib/utils";

/**
 * The learning patterns Mosaic has spotted for this student: each with the evidence and what it
 * changes. `compact` is the home-page strip; the full version lives on the profile page.
 */
export function LearningMix({ detected, compact = false }: { detected: DetectedPattern[]; compact?: boolean }) {
  if (!detected.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface/60 p-6">
        <p className="mb-1 font-medium">No pattern spotted yet</p>
        <p className="text-[15px] text-ink/75">
          Are you a deep diver, a quick-answers person, hands-on, a listener? Mosaic works it out from what you do, usually
          after a few experiments and questions.
        </p>
      </div>
    );
  }
  if (compact) {
    return (
      <Link href="/profile" className="group flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-surface p-4 transition-colors duration-150 hover:border-accent sm:p-5">
        <span className="mr-1 text-sm text-muted">Your learning mix</span>
        {detected.map((d) => (
          <span key={d.pattern.id} className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
            {d.pattern.name}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent">
          Why and what changes <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {detected.map((d, i) => (
        <li key={d.pattern.id} className={cn("rounded-3xl border border-line bg-surface p-6", i === 0 && detected.length % 2 === 1 && "md:col-span-2")}>
          <p className="mb-1 text-xl font-medium">{d.pattern.name}</p>
          <p className="mb-4 text-[15px] text-muted italic">&ldquo;{d.pattern.quote}&rdquo;</p>
          <p className="mb-4 text-sm">
            <span className="font-medium">Why we think so: </span>
            <span className="text-ink/80">{d.evidence}</span>
          </p>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-accent">
            <Wand2 className="h-3.5 w-3.5" aria-hidden /> What changes for you
          </p>
          <ul className="flex flex-wrap gap-2">
            {d.pattern.adapts.map((a) => (
              <li key={a} className="rounded-full px-3 py-1 text-sm ring-1 ring-line">
                {a}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
