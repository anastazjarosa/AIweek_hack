import { dimensions, levelFor, type Scores } from "@/lib/dimensions";
import { cn } from "@/lib/utils";

/** Four dimension scores (0-4) with their level. No labels beyond the dimension names. */
export function ScoreBars({ scores, compact = false }: { scores: Scores; compact?: boolean }) {
  return (
    <ul className={cn("grid gap-x-6", compact ? "gap-y-2.5" : "gap-y-4 sm:grid-cols-2")}>
      {dimensions.map((d) => {
        const level = levelFor(scores[d.key]);
        return (
          <li key={d.key}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium">{d.label}</span>
              <span className={cn("tabular-nums", level === "high" ? "text-accent" : "text-muted")}>
                {scores[d.key]} / 4 · {level}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink/8" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${(scores[d.key] / 4) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
