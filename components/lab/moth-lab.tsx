"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lecture } from "@/lib/data";
import { GENERATIONS, START_DARK, explainHits, explainIdeas, modelExplanation, simulate, type Run } from "@/lib/lab/selection";
import { cn } from "@/lib/utils";

const steps = ["Predict", "Run", "Explain"] as const;
type Step = (typeof steps)[number];

const prediction = {
  q: `Factory soot turns the tree bark dark. Only 2 in 100 peppered moths are dark. After ${GENERATIONS} generations, how many will be dark?`,
  options: ["Still about 2 in 100", "About half", "Almost all of them"],
  answer: 2,
};

const pct = (r: number) => `${Math.round(r * 100)}%`;
const barkLabel = (b: number) => (b <= 0.3 ? "Pale, covered in lichen" : b < 0.7 ? "Partly sooty" : "Dark with soot");

export function MothLab() {
  const [step, setStep] = useState<Step>("Predict");
  const [guess, setGuess] = useState<number | null>(null);
  const [bark, setBark] = useState(90);
  const [birds, setBirds] = useState(true);
  const [run, setRun] = useState<Run | null>(null);
  const [explain, setExplain] = useState("");
  const [checked, setChecked] = useState(false);
  const barkId = useId();
  const hits = explainHits(explain);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/lecture/${lecture.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to the lecture
      </Link>
      <p className="mb-2 text-sm text-muted">Moth lab · 2 minutes</p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">Watch natural selection happen</h1>
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
                current ? "bg-brand text-brand-ink" : done ? "bg-accent-soft text-accent" : "bg-surface text-muted ring-1 ring-line",
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
          <p className="mb-5 text-xl leading-snug font-medium">{prediction.q}</p>
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
          <div className="mb-6 grid gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor={barkId} className="mb-2 block font-medium">
                How dark is the tree bark? <span className="text-accent tabular-nums">{bark}%</span>
              </label>
              <input
                id={barkId}
                type="range"
                min={0}
                max={100}
                step={10}
                value={bark}
                onChange={(e) => setBark(Number(e.target.value))}
                className="h-11 w-full accent-[var(--accent)]"
              />
              <p className="mb-5 text-sm text-muted">{barkLabel(bark / 100)}</p>
              <p className="mb-2 font-medium">Birds</p>
              <div role="radiogroup" aria-label="Birds" className="flex flex-wrap gap-2">
                {[
                  { on: true, label: "Hunting moths" },
                  { on: false, label: "No birds" },
                ].map((o) => (
                  <button
                    key={o.label}
                    role="radio"
                    aria-checked={birds === o.on}
                    onClick={() => setBirds(o.on)}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                      birds === o.on ? "border-accent bg-brand text-brand-ink" : "border-line hover:border-accent",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <BarkSwatch bark={bark / 100} />
          </div>

          <Button onClick={() => setRun(simulate(bark / 100, birds))}>
            <Play /> {run ? "Run again" : "Run"}
          </Button>

          {run && (
            <div className="mt-8">
              <Chart run={run} />
              <p className="mt-4 text-lg" aria-live="polite">
                {!run.birds ? (
                  <>
                    With no birds, nothing is choosing, so dark moths stay at{" "}
                    <span className="font-medium">{pct(run.end)}</span>.
                  </>
                ) : (
                  <>
                    After {GENERATIONS} generations, <span className="font-medium text-accent">{pct(run.end)}</span> of
                    moths are dark. They started at {pct(START_DARK)}.
                    {run.bark < 0.5 && " On pale bark, dark moths stand out and get eaten."}
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-muted">
                Real history: around Manchester, dark moths went from rare in 1848 to about 98% by 1895.
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

      {step === "Explain" && (
        <Card className="p-8">
          <p className="mb-1 text-sm text-muted">You predicted</p>
          <p className="mb-5 text-lg">
            {prediction.options[guess!]}.{" "}
            <span className={guess === prediction.answer ? "text-accent" : "text-ink/75"}>
              {guess === prediction.answer
                ? "The experiment agrees."
                : "On sooty bark, the experiment says almost all of them. Surprises like this are how you learn."}
            </span>
          </p>
          <label htmlFor="explain" className="mb-2 block font-medium">
            In one sentence: why did dark moths take over?
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
                          hits[idea.id] ? "bg-brand text-brand-ink" : "bg-ink/5 text-muted",
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
                  <RotateCcw /> Try other conditions
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ---------- Bark swatch: shows which moth is hidden ----------

const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const PALE_BARK = [214, 210, 196];
const SOOT_BARK = [46, 43, 40];

function BarkSwatch({ bark }: { bark: number }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 150" className="h-40 w-32 rounded-2xl" role="img" aria-label={`Tree bark, ${Math.round(bark * 100)}% dark, with a pale moth and a dark moth on it`}>
        <rect width="120" height="150" fill={mix(PALE_BARK, SOOT_BARK, bark)} />
        {[22, 50, 78, 104].map((x) => (
          <path key={x} d={`M${x} 0 Q${x + 6} 75 ${x - 2} 150`} stroke="rgba(0,0,0,0.12)" strokeWidth="3" fill="none" />
        ))}
        <Moth x={36} y={48} fill="#EDE8DA" />
        <Moth x={80} y={104} fill="#26221F" />
      </svg>
      <figcaption className="text-xs text-muted">Pale moth top, dark moth bottom</figcaption>
    </figure>
  );
}

function Moth({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L-16 -9 Q-20 4 -10 10 Z M0 0 L16 -9 Q20 4 10 10 Z" fill={fill} />
      <ellipse cx="0" cy="2" rx="2.5" ry="8" fill={fill} />
    </g>
  );
}

// ---------- Chart: share of dark moths over generations ----------

const W = 640;
const H = 260;
const PAD = { l: 44, r: 16, t: 20, b: 36 };
const x = (g: number) => PAD.l + (g / GENERATIONS) * (W - PAD.l - PAD.r);
const y = (p: number) => PAD.t + (1 - p) * (H - PAD.t - PAD.b);
const path = (curve: number[]) => curve.map((p, g) => `${g ? "L" : "M"}${x(g).toFixed(1)},${y(p).toFixed(1)}`).join(" ");

function Chart({ run }: { run: Run }) {
  const reduce = useReducedMotion();
  const draw = reduce
    ? {}
    : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: "easeOut" as const } };
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Share of dark moths over ${GENERATIONS} generations, from ${pct(START_DARK)} to ${pct(run.end)}.`}
      >
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(p)} y2={y(p)} className="stroke-line" />
            <text x={PAD.l - 8} y={y(p) + 4} textAnchor="end" className="fill-muted text-[12px]">
              {pct(p)}
            </text>
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50].map((g) => (
          <text key={g} x={x(g)} y={H - 12} textAnchor="middle" className="fill-muted text-[12px]">
            {g === 0 ? "Gen 0" : g}
          </text>
        ))}
        <motion.path
          key={`${run.bark}-${run.birds}`}
          d={path(run.curve)}
          fill="none"
          strokeWidth={3}
          className="stroke-accent"
          {...draw}
        />
        <circle cx={x(GENERATIONS)} cy={y(run.end)} r={6} className="fill-accent" />
        <text x={x(GENERATIONS) - 10} y={run.end > 0.85 ? y(run.end) + 22 : y(run.end) - 12} textAnchor="end" className="fill-accent text-[13px] font-medium">
          {pct(run.end)} dark
        </text>
      </svg>
      <figcaption className="mt-2 text-sm text-muted">Share of moths that are dark, each generation.</figcaption>
    </figure>
  );
}
