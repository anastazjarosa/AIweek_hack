"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lecture } from "@/lib/data";
import {
  MAX_DAY,
  MAX_GAP,
  TEST_DELAY,
  explainHits,
  explainIdeas,
  modelExplanation,
  simulate,
  type Method,
  type Run,
} from "@/lib/lab/spacing";
import { cn } from "@/lib/utils";

const steps = ["Predict", "Run", "Explain"] as const;
type Step = (typeof steps)[number];

const prediction = {
  q: `You have 3 study sessions. The test is ${TEST_DELAY} days after your last one. Which plan remembers more?`,
  options: ["All 3 in one evening", "Spread out over a few days", "No real difference"],
  answer: 1,
};

const methods: { id: Method; label: string }[] = [
  { id: "reread", label: "Re-read notes" },
  { id: "selftest", label: "Test yourself" },
];

const pct = (r: number) => `${Math.round(r * 100)}%`;

export function SpacingLab() {
  const [step, setStep] = useState<Step>("Predict");
  const [guess, setGuess] = useState<number | null>(null);
  const [gap, setGap] = useState(2);
  const [method, setMethod] = useState<Method>("reread");
  const [run, setRun] = useState<Run | null>(null);
  const [explain, setExplain] = useState("");
  const [checked, setChecked] = useState(false);
  const gapId = useId();

  const crammed = run ? simulate(0, run.method) : null;
  const hits = explainHits(explain);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/lecture/${lecture.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to the lecture
      </Link>
      <p className="mb-2 text-sm text-muted">Spacing lab · 2 minutes</p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">When you study changes what you remember</h1>
      <p className="mb-8 max-w-[60ch] text-ink/75">
        Guess first, then run the experiment, then say why it happened. This is a simple model for exploring the idea,
        not real data.
      </p>

      <ol className="mb-8 flex gap-2" aria-label="Lab steps">
        {steps.map((s, i) => {
          const current = s === step;
          const done = steps.indexOf(step) > i;
          return (
            <li
              key={s}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium",
                current ? "bg-accent text-accent-ink" : done ? "bg-accent-soft text-accent" : "bg-surface text-muted ring-1 ring-line",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <span className="tabular-nums">{i + 1}</span>}
              {s}
            </li>
          );
        })}
      </ol>

      {step === "Predict" && (
        <Card className="p-8">
          <p className="mb-5 text-xl font-medium leading-snug">{prediction.q}</p>
          <div role="radiogroup" aria-label="Your prediction" className="space-y-2">
            {prediction.options.map((o, oi) => (
              <button
                key={o}
                role="radio"
                aria-checked={guess === oi}
                onClick={() => setGuess(oi)}
                className={cn(
                  "flex w-full items-center rounded-2xl border px-5 py-3 text-left transition-colors duration-150",
                  guess === oi ? "border-accent bg-accent-soft font-medium" : "border-line bg-surface hover:border-accent",
                )}
              >
                {o}
              </button>
            ))}
          </div>
          {guess !== null && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted">Locked in. Now test it.</p>
              <Button onClick={() => setStep("Run")}>
                Run the experiment <ArrowRight />
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === "Run" && (
        <Card className="p-8">
          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor={gapId} className="mb-2 block font-medium">
                Days between sessions: <span className="text-accent tabular-nums">{gap}</span>
              </label>
              <input
                id={gapId}
                type="range"
                min={0}
                max={MAX_GAP}
                step={1}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="h-11 w-full accent-[var(--accent)]"
              />
              <p className="text-sm text-muted">{gap === 0 ? "0 means all 3 in one evening." : `Sessions on day 0, ${gap} and ${gap * 2}.`}</p>
            </div>
            <div>
              <p className="mb-2 font-medium">Each session you…</p>
              <div role="radiogroup" aria-label="Study method" className="flex flex-wrap gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={method === m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                      method === m.id ? "border-accent bg-accent text-accent-ink" : "border-line hover:border-ink/30",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={() => setRun(simulate(gap, method))}>
            <Play /> {run ? "Run again" : "Run"}
          </Button>

          {run && crammed && (
            <div className="mt-8">
              <Chart run={run} crammed={crammed} />
              <p className="mt-4 text-lg" aria-live="polite">
                {run.gap === 0 ? (
                  <>
                    One evening: <span className="font-medium">{pct(run.atTest)}</span> remembered on test day. Try
                    a gap.
                  </>
                ) : (
                  <>
                    Your plan: <span className="font-medium text-accent">{pct(run.atTest)}</span> remembered on test
                    day. One evening: <span className="font-medium">{pct(crammed.atTest)}</span>.
                  </>
                )}
              </p>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep("Explain")}>
                  Explain it <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === "Explain" && run && crammed && (
        <Card className="p-8">
          <p className="mb-1 text-sm text-muted">You predicted</p>
          <p className="mb-5 text-lg">
            {prediction.options[guess!]}.{" "}
            <span className={guess === prediction.answer ? "text-accent" : "text-ink/75"}>
              {guess === prediction.answer
                ? "The experiment agrees."
                : "The experiment says spreading out wins. Surprises like this are how you learn."}
            </span>
          </p>
          <label htmlFor="explain" className="mb-2 block font-medium">
            In one sentence: why does spreading out help?
          </label>
          <textarea
            id="explain"
            value={explain}
            onChange={(e) => {
              setExplain(e.target.value);
              setChecked(false);
            }}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface p-4 text-lg leading-relaxed focus:border-accent focus:outline-none"
            placeholder="Because…"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setChecked(true)} disabled={!explain.trim()}>
              Check my explanation
            </Button>
            <Button variant="ghost" onClick={() => setChecked(true)}>
              Show me the answer
            </Button>
          </div>

          {checked && (
            <div className="mt-8 space-y-5" aria-live="polite">
              {explain.trim() && (
                <ul className="space-y-2">
                  {explainIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs",
                          hits[idea.id] ? "bg-accent text-accent-ink" : "bg-ink/5 text-muted",
                        )}
                      >
                        {hits[idea.id] ? <Check className="h-3.5 w-3.5" /> : "–"}
                      </span>
                      <span className={hits[idea.id] ? "" : "text-muted"}>
                        {idea.label}
                        <span className="sr-only">{hits[idea.id] ? ": you mentioned this" : ": not mentioned yet"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-2xl bg-accent-soft p-5">
                <p className="mb-1 text-sm font-medium text-accent">A full answer</p>
                <p className="leading-relaxed">{modelExplanation}</p>
              </div>
              {explain.trim() && <p className="text-sm text-muted">We look for these two ideas with a simple word check. It is not a mark.</p>}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <Link href={`/lecture/${lecture.slug}`}>
                    Back to the lecture <ArrowRight />
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep("Run");
                    setChecked(false);
                  }}
                >
                  <RotateCcw /> Try another plan
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ---------- Chart: retention over days, your plan against one evening ----------

const W = 640;
const H = 260;
const PAD = { l: 44, r: 16, t: 16, b: 36 };
const x = (day: number) => PAD.l + (day / MAX_DAY) * (W - PAD.l - PAD.r);
const y = (r: number) => PAD.t + (1 - r) * (H - PAD.t - PAD.b);
const path = (run: Run) => run.curve.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.r).toFixed(1)}`).join(" ");

function Chart({ run, crammed }: { run: Run; crammed: Run }) {
  const reduce = useReducedMotion();
  const same = run.gap === 0;
  const draw = reduce ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: "easeOut" as const } };
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Memory over ${MAX_DAY} days. Your plan ends at ${pct(run.atTest)} on test day.`}>
        {[0, 0.5, 1].map((r) => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(r)} y2={y(r)} className="stroke-line" />
            <text x={PAD.l - 8} y={y(r) + 4} textAnchor="end" className="fill-muted text-[12px]">
              {pct(r)}
            </text>
          </g>
        ))}
        {[0, 5, 10, 15].map((d) => (
          <text key={d} x={x(d)} y={H - 12} textAnchor="middle" className="fill-muted text-[12px]">
            Day {d}
          </text>
        ))}

        {!same && (
          <g>
            <path d={path(crammed)} fill="none" strokeWidth={2} strokeDasharray="5 5" className="stroke-muted" />
            <circle cx={x(crammed.testDay)} cy={y(crammed.atTest)} r={5} className="fill-muted" />
            <text x={x(crammed.testDay)} y={y(crammed.atTest) + 22} textAnchor="middle" className="fill-muted text-[12px]">
              One evening {pct(crammed.atTest)}
            </text>
          </g>
        )}

        <motion.path key={`${run.gap}-${run.method}`} d={path(run)} fill="none" strokeWidth={3} className="stroke-accent" {...draw} />
        {run.sessions.map((d, i) => (
          <circle key={i} cx={x(d)} cy={y(1)} r={5} className="fill-accent" />
        ))}
        <circle cx={x(run.testDay)} cy={y(run.atTest)} r={6} className="fill-accent" />
        <text
          x={Math.min(x(run.testDay), W - PAD.r - 60)}
          y={y(run.atTest) - 12}
          textAnchor="middle"
          className="fill-accent text-[13px] font-medium"
        >
          Test {pct(run.atTest)}
        </text>
      </svg>
      <figcaption className="mt-2 text-sm text-muted">
        Dots on top are study sessions. {same ? "" : "The dashed line is the same 3 sessions in one evening."}
      </figcaption>
    </figure>
  );
}
