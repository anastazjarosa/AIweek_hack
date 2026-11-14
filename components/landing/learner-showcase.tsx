"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, Pause, Play, Timer, Wand2 } from "lucide-react";
import { useState } from "react";
import { patterns, type PatternId } from "@/lib/learner/patterns";
import { cn } from "@/lib/utils";

/**
 * "One lesson, every kind of learner": pick a learning pattern and the same lesson about falling
 * objects reshapes for it, next to what Mosaic noticed and what it changes.
 */
export function LearnerShowcase() {
  const [id, setId] = useState<PatternId>("deep");
  const p = patterns.find((x) => x.id === id)!;
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div role="radiogroup" aria-label="Learning pattern" className="mb-6 flex flex-wrap gap-2">
          {patterns.map((x) => (
            <button
              key={x.id}
              role="radio"
              aria-checked={x.id === id}
              onClick={() => setId(x.id)}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                x.id === id ? "bg-ink text-surface" : "bg-surface text-ink ring-1 ring-line hover:ring-accent",
              )}
            >
              {x.name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <p className="mb-5 text-2xl leading-snug font-light tracking-[-0.01em]">&ldquo;{p.quote}&rdquo;</p>
            <div className="mb-4 flex gap-3">
              <Eye className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <p className="text-[15px]">
                <span className="font-medium">Mosaic notices: </span>
                <span className="text-ink/80">{p.notices}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Wand2 className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <div className="text-[15px]">
                <p className="mb-1.5 font-medium">So it:</p>
                <ul className="space-y-1">
                  {p.adapts.map((a) => (
                    <li key={a} className="flex gap-2 text-ink/80">
                      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="lg:col-span-7">
        <div className="rounded-[28px] border border-line bg-surface p-6 shadow-[0_30px_80px_-50px_rgba(154,71,16,0.5)] sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Same lesson · shaped for</p>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{p.name}</span>
          </div>
          <p className="mb-5 text-xl leading-snug font-medium">Why don&rsquo;t heavier things fall faster?</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-[250px]"
            >
              <Preview id={id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Preview({ id }: { id: PatternId }) {
  switch (id) {
    case "deep":
      return (
        <div className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Gravity pulls a 10 kg ball ten times harder than a 1 kg ball. But a heavier ball is also ten times harder to speed up
            (F = ma), so the two effects cancel exactly: every object falls with the same acceleration, about 9.8 m/s².
          </p>
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="mb-1 text-sm font-medium text-accent">Go deeper</p>
            <p>Turn on air resistance. Does mass matter now? Predict, then test it.</p>
          </div>
          <p className="text-sm text-muted">Read more: Galileo, Two New Sciences (1638) · Apollo 15 hammer and feather (1971)</p>
        </div>
      );
    case "quick":
      return (
        <div>
          <p className="mb-2 text-sm font-medium text-accent">Key points</p>
          <ul className="mb-5 space-y-2 text-[15px]">
            {["Without air, everything falls at the same rate.", "More mass means more pull, but also more to move.", "Air resistance is what makes a feather slow."].map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {x}
              </li>
            ))}
          </ul>
          <p className="mb-2 text-sm font-medium">Quick check</p>
          <div className="flex flex-wrap gap-2">
            {["Heavy lands first", "Same time", "Light lands first"].map((o, i) => (
              <span key={o} className={cn("rounded-full px-3 py-1.5 text-sm ring-1", i === 1 ? "bg-accent-soft text-accent ring-accent" : "ring-line")}>
                {o}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Full explanation one tap away.</p>
        </div>
      );
    case "hands-on":
      return (
        <div>
          <p className="mb-2 text-sm font-medium text-accent">Predict first</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {["Heavy lands first", "Same time", "Light lands first"].map((o, i) => (
              <span key={o} className={cn("rounded-full px-3 py-1.5 text-sm ring-1", i === 0 ? "bg-accent-soft text-accent ring-accent" : "ring-line")}>
                {o}
              </span>
            ))}
          </div>
          <div className="mb-3 flex items-center gap-3 text-sm">
            <span className="w-20 text-muted">Mass</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-ink/10">
              <span className="absolute inset-y-0 left-0 w-3/4 rounded-full bg-accent" />
              <span className="absolute top-1/2 left-3/4 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-surface" />
            </div>
            <span className="w-14 text-right tabular-nums">10 kg</span>
          </div>
          <svg viewBox="0 0 300 90" className="w-full" aria-label="Two identical fall curves: 1 kg and 10 kg land together at 2.02 seconds">
            <path d="M10 10 Q 160 12 290 80" fill="none" strokeWidth="2" strokeDasharray="5 4" className="stroke-ink/30" />
            <path d="M10 10 Q 160 12 290 80" fill="none" strokeWidth="3" className="stroke-accent" />
            <circle cx="290" cy="80" r="5" className="fill-accent" />
            <text x="286" y="68" textAnchor="end" fontSize="11" className="fill-accent">both land at 2.02 s</text>
          </svg>
        </div>
      );
    case "listener":
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-full bg-paper py-2 pr-5 pl-2">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-brand-ink">
              <Pause className="h-4 w-4" />
            </span>
            <div className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className={cn("w-[3px] rounded-full", i < 12 ? "bg-accent" : "bg-ink/15")} style={{ height: `${30 + ((i * 37) % 70)}%` }} />
              ))}
            </div>
            <span className="text-sm text-muted tabular-nums">0:24 / 1:05</span>
          </div>
          <p className="text-lg leading-relaxed">
            Without air, a heavy ball and a light ball land <mark className="rounded bg-mark px-1">at the same time</mark>.
          </p>
          <p className="rounded-2xl bg-canvas/70 p-3 text-[15px]">
            <span className="font-medium">Acceleration:</span> how quickly something speeds up.
          </p>
        </div>
      );
    case "fast":
      return (
        <div>
          <div className="mb-4 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i === 0 ? "bg-accent" : "bg-ink/10")} />
            ))}
          </div>
          <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">Card 1 of 4</p>
          <p className="mb-4 text-lg">More mass means more pull, and more to move. They cancel out.</p>
          <p className="mb-2 text-sm font-medium">Check before you move on</p>
          <div className="flex flex-wrap gap-2">
            {["They cancel", "Pull wins", "Mass wins"].map((o, i) => (
              <span key={o} className={cn("rounded-full px-3 py-1.5 text-sm ring-1", i === 0 ? "bg-accent-soft text-accent ring-accent" : "ring-line")}>
                {o}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Recap appears before the next card.</p>
        </div>
      );
    case "practice":
      return (
        <ol className="space-y-2.5">
          {[
            ["A 2 kg and a 20 kg ball drop on the Moon. Which lands first?", true],
            ["What makes a feather fall slowly on Earth?", true],
            ["Double the height. Does the fall time double?", null],
          ].map(([q, ok], i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl px-4 py-3 ring-1 ring-line">
              <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs", ok ? "bg-brand text-brand-ink" : "bg-ink/5 text-muted")}>
                {ok ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-[15px]">{q as string}</span>
            </li>
          ))}
          <li className="pt-1 text-sm text-muted">2 of 3 right · accuracy up from 43% to 75% this week</li>
        </ol>
      );
    case "bursts":
      return (
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative grid h-32 w-32 shrink-0 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-ink/10" />
              <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray="276" strokeDashoffset="110" className="stroke-accent" />
            </svg>
            <div className="text-center">
              <p className="text-2xl font-light tabular-nums">6:12</p>
              <p className="text-xs text-muted">of 10 min</p>
            </div>
          </div>
          <div className="space-y-2 text-[15px]">
            <p className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent" aria-hidden /> 10-minute block, sized to your real focus
            </p>
            <p className="flex items-center gap-2">
              <Play className="h-4 w-4 text-accent" aria-hidden /> One idea: mass doesn&rsquo;t change fall time
            </p>
            <p className="rounded-2xl bg-accent-soft p-3">Then a 3-minute break: walk, and explain it out loud to yourself.</p>
          </div>
        </div>
      );
  }
}
