"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Fake audio player: no sound, just a believable playing state. */
export function AudioBar({ seconds, label, className }: { seconds: number; label?: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((x) => {
        if (x + 1 >= seconds) {
          setPlaying(false);
          return seconds;
        }
        return x + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, seconds]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={cn("flex items-center gap-4 rounded-full bg-surface/80 py-2 pr-5 pl-2 ring-1 ring-line", className)}>
      <button
        type="button"
        onClick={() => {
          if (t >= seconds) setT(0);
          setPlaying((p) => !p);
        }}
        aria-label={playing ? `Pause ${label ?? "audio"}` : `Listen to ${label ?? "this section"}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => {
          const h = 30 + ((i * 37) % 70);
          const filled = i / 36 < t / seconds;
          return (
            <span
              key={i}
              className={cn("w-[3px] rounded-full transition-colors duration-200", filled ? "bg-accent" : "bg-ink/15")}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <span className="text-sm tabular-nums text-muted">
        {fmt(t)} / {fmt(seconds)}
      </span>
    </div>
  );
}
