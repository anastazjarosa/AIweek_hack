import { Activity, ArrowRight, CalendarDays, FlaskConical, Target } from "lucide-react";
import Link from "next/link";
import type { LoopStage, LoopStageId } from "@/lib/home";
import { cn } from "@/lib/utils";

const icons = { know: Activity, learn: FlaskConical, results: Target, plan: CalendarDays } satisfies Record<LoopStageId, unknown>;

/**
 * The learning loop: profile → learn → results → plan → back to profile. Each stage shows its live
 * state and links to its page; `current` marks where the student's next step is. Used live on the
 * home page and with example states on the landing page.
 */
export function LearningLoop({ stages, current, interactive = true }: { stages: LoopStage[]; current?: LoopStageId; interactive?: boolean }) {
  return (
    <div className="relative">
      <ol className="relative grid gap-3 md:grid-cols-4 md:gap-5">
        {stages.map((s, i) => {
          const Icon = icons[s.id];
          const here = s.id === current;
          const body = (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-2xl",
                    here ? "bg-brand text-brand-ink" : s.empty ? "bg-ink/5 text-muted" : "bg-accent-soft text-accent",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {here ? (
                  <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium tracking-wide text-surface uppercase">You are here</span>
                ) : (
                  <span className="text-sm font-light text-muted tabular-nums">0{i + 1}</span>
                )}
              </div>
              <p className="mb-0.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{s.verb}</p>
              <p className="mb-2 text-lg leading-snug font-medium">{s.label}</p>
              <p className={cn("text-[15px]", s.empty ? "text-muted" : "text-ink")}>{s.status}</p>
              {interactive && (
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </>
          );
          return (
            <li key={s.id} className="relative">
              {interactive ? (
                <Link
                  href={s.href}
                  className={cn(
                    "group block h-full rounded-3xl border bg-surface p-5 transition-[border-color,box-shadow] duration-150 hover:shadow-[0_8px_30px_-12px_rgba(154,71,16,0.35)]",
                    here ? "border-accent ring-2 ring-accent/30" : s.empty ? "border-dashed border-line" : "border-line hover:border-accent",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className={cn("h-full rounded-3xl border bg-surface p-5", here ? "border-accent ring-2 ring-accent/30" : "border-line")}>{body}</div>
              )}
              {/* Connector to the next stage */}
              {i < stages.length - 1 && (
                <span aria-hidden className="absolute top-1/2 -right-[18px] z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-accent md:grid">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {/* The return path: results and plans update the profile, and the loop starts again. */}
      <div aria-hidden className="relative mx-[12.5%] mt-2 hidden h-10 md:block">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path d="M100 0 C100 18, 0 18, 0 0" fill="none" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" className="stroke-accent/50" />
        </svg>
      </div>
      <p className="mt-1 text-center text-sm text-muted md:-mt-3">
        <span className="hidden md:inline">↺ </span>Every answer feeds back into your profile, so the next lesson and the plan fit a little better.
      </p>
    </div>
  );
}
