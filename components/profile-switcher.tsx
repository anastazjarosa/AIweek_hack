"use client";

import { motion } from "framer-motion";
import { useHydrated } from "@/lib/profile";
import { profiles, type ProfileId } from "@/lib/data";
import { cn } from "@/lib/utils";

const order: ProfileId[] = ["adhd", "dyslexia", "autism", "standard"];

export function ProfileSwitcher({
  value,
  onChange,
  id,
  className,
}: {
  value: ProfileId;
  onChange: (p: ProfileId) => void;
  /** Unique per instance so the sliding pill doesn't jump between switchers. */
  id: string;
  className?: string;
}) {
  // The saved profile loads after hydration; only animate the pill for real clicks.
  const hydrated = useHydrated();
  return (
    <div
      role="radiogroup"
      aria-label="Learning profile"
      className={cn("inline-flex rounded-full border border-line bg-surface p-1", className)}
    >
      {order.map((pid) => {
        const p = profiles.find((x) => x.id === pid)!;
        const active = value === pid;
        return (
          <button
            key={pid}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(pid)}
            className={cn(
              "relative h-9 rounded-full px-3 text-sm sm:px-4 font-medium transition-colors duration-150",
              active ? "text-accent-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={hydrated ? `pill-${id}` : undefined}
                className="absolute inset-0 rounded-full bg-accent"
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
