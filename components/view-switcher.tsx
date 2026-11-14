"use client";

import { motion } from "framer-motion";
import { useHydrated } from "@/lib/profile";
import { views, type ViewId } from "@/lib/dimensions";
import { cn } from "@/lib/utils";



export function ViewSwitcher({
  value,
  onChange,
  id,
  className,
}: {
  value: ViewId;
  onChange: (v: ViewId) => void;
  /** Unique per instance so the sliding pill doesn't jump between switchers. */
  id: string;
  className?: string;
}) {
  // The saved layout loads after hydration; only animate the pill for real clicks.
  const hydrated = useHydrated();
  return (
    <div
      role="radiogroup"
      aria-label="Lecture layout"
      className={cn("inline-flex rounded-full border border-line bg-surface p-1", className)}
    >
      {views.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.id)}
            className={cn(
              "relative h-9 rounded-full px-3 text-sm sm:px-4 font-medium transition-colors duration-150",
              active ? "text-accent" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={hydrated ? `pill-${id}` : undefined}
                className="absolute inset-0 rounded-full bg-accent-soft ring-1 ring-inset ring-accent"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
