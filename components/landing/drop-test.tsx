"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw, Wind } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatNumber } from "@/lib/sim/spec";
import { templates, valuesFor } from "@/lib/sim/templates";
import { cn } from "@/lib/utils";

type Guess = "heavy" | "light" | "same";
const guesses: { id: Guess; label: string }[] = [
  { id: "heavy", label: "The heavy one" },
  { id: "light", label: "The light one" },
  { id: "same", label: "Same time" },
];

const HEIGHT = 20;
/** Real fall times from the same tested model the Simulation Lab uses. */
function fallTimes(air: boolean) {
  const run = (mass: number) => templates.freefall.run(valuesFor(templates.freefall, { height: HEIGHT, mass, drag: air ? 0.02 : 0 })).metrics.fallTime!;
  return { light: run(0.5), heavy: run(5) };
}
const SCREEN_SECONDS = 0.62; // on-screen seconds per real second
const DROP_PX = 236;
const fallEase = (t: number) => t * t; // distance grows with time squared

/**
 * The landing page hero: predict, drop, explain, in ten seconds. Then add air and the answer
 * changes, which is the whole point of learning by doing.
 */
export function DropTest() {
  const reduce = useReducedMotion();
  const [guess, setGuess] = useState<Guess | null>(null);
  const [air, setAir] = useState(false);
  const [run, setRun] = useState(0);
  const [landed, setLanded] = useState<{ light: boolean; heavy: boolean }>({ light: false, heavy: false });
  const t = fallTimes(air);
  const dropped = run > 0;
  const done = landed.light && landed.heavy;
  const truth: Guess = Math.abs(t.light - t.heavy) / t.light < 0.05 ? "same" : t.heavy < t.light ? "heavy" : "light";

  const drop = (withAir: boolean) => {
    setAir(withAir);
    setLanded({ light: false, heavy: false });
    setRun((r) => r + 1);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 shadow-[0_30px_80px_-40px_rgba(154,71,16,0.45)] sm:p-8">
      <p className="mb-1 text-xs font-medium tracking-[0.08em] text-accent uppercase">Try it · 10 seconds</p>
      <p className="mb-5 text-xl leading-snug font-medium sm:text-2xl">
        {air ? "Now with air resistance. Which lands first?" : `Drop a 0.5 kg ball and a 5 kg ball from ${HEIGHT} m, no air. Which lands first?`}
      </p>

      <div className="grid gap-6 sm:grid-cols-[1fr_200px]">
        <div>
          <div role="radiogroup" aria-label="Your guess" className="mb-4 flex flex-wrap gap-2">
            {guesses.map((g) => (
              <button
                key={g.id}
                role="radio"
                aria-checked={guess === g.id}
                disabled={dropped && !done}
                onClick={() => setGuess(g.id)}
                className={cn(
                  "h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                  guess === g.id ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-accent",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          {!dropped ? (
            <button
              disabled={!guess}
              onClick={() => drop(air)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-medium text-surface transition-opacity duration-150 disabled:opacity-40"
            >
              Drop them <ArrowRight className="h-4 w-4" />
            </button>
          ) : done ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} aria-live="polite">
              <p className={cn("mb-1 text-lg font-medium", guess === truth ? "text-accent" : "text-ink")}>
                {guess === truth ? "You called it." : "Surprised? Most people are."}{" "}
                {truth === "same" ? "They land together." : "The heavy ball wins."}
              </p>
              <p className="mb-4 text-[15px] leading-relaxed text-ink/75">
                {air
                  ? `With air, the same push from the air slows the light ball far more: ${formatNumber(t.heavy)} s against ${formatNumber(t.light)} s.`
                  : `Both take ${formatNumber(t.heavy)} s. Gravity pulls harder on the heavy ball, but it is harder to speed up by exactly as much.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {!air ? (
                  <button
                    onClick={() => {
                      setGuess(null);
                      setRun(0);
                      setAir(true);
                      setLanded({ light: false, heavy: false });
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface"
                  >
                    <Wind className="h-4 w-4" /> Now add air
                  </button>
                ) : (
                  <Link href="/lab" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface">
                    Build one for your own question <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={() => {
                    setGuess(null);
                    setRun(0);
                    setAir(false);
                    setLanded({ light: false, heavy: false });
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-muted ring-1 ring-line hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" /> Start again
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-muted" aria-live="polite">
              Falling…
            </p>
          )}
        </div>

        {/* The tower */}
        <div className="relative h-[300px] rounded-2xl bg-gradient-to-b from-canvas to-accent-soft/70" aria-hidden>
          {air && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[18, 42, 66, 88].map((x, i) => (
                <span key={x} className="absolute h-px w-8 bg-accent/30 motion-safe:animate-pulse" style={{ left: `${x - 10}%`, top: `${20 + i * 17}%` }} />
              ))}
            </div>
          )}
          <span className="absolute top-3 right-3 text-[11px] text-muted">{HEIGHT} m</span>
          <div className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-ink/20" />
          {(["light", "heavy"] as const).map((k, i) => {
            const size = k === "light" ? 22 : 38;
            const seconds = t[k];
            return (
              <div key={k} className="absolute top-6" style={{ left: i === 0 ? "26%" : "62%", marginLeft: -size / 2 }}>
                <motion.div
                  key={`${run}-${air}`}
                  initial={{ y: 0 }}
                  animate={{ y: dropped ? DROP_PX - size : 0 }}
                  transition={dropped && !reduce ? { duration: seconds * SCREEN_SECONDS, ease: fallEase } : { duration: 0 }}
                  onAnimationComplete={() => dropped && setLanded((l) => ({ ...l, [k]: true }))}
                  className="flex flex-col items-center"
                >
                  <span className={cn("rounded-full shadow-inner", k === "light" ? "bg-glow" : "bg-accent")} style={{ width: size, height: size }} />
                </motion.div>
                <span className="absolute top-[-18px] left-1/2 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted">{k === "light" ? "0.5 kg" : "5 kg"}</span>
                {landed[k] && (
                  <span className="absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap text-ink tabular-nums" style={{ top: DROP_PX + 2 }}>
                    {formatNumber(seconds)} s
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
