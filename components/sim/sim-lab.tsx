"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Equal, Loader2, MessageCircle, Play, RotateCcw, Wand2 } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { SimChart } from "@/components/sim/sim-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  direction,
  directionWords,
  formatMetric,
  paramsFor,
  predictionOutcome,
  runSpec,
  startValues,
  templateOf,
  type Direction,
  type SimSpec,
} from "@/lib/sim/spec";
import { logEvent } from "@/lib/learner/events";
import { topicForTemplate } from "@/lib/learner/topics";
import type { Feedback } from "@/lib/sim/ai-spec";
import type { FeedbackResponse } from "@/lib/sim/api-types";
import type { ParamDef, Result, Values } from "@/lib/sim/templates";
import { cn } from "@/lib/utils";

const steps = ["Predict", "Run", "Explain"] as const;
type Step = (typeof steps)[number];
type Run = { key: number; values: Values; result: Result };
/** AI feedback on the explanation; "offline" falls back to the self-check. */
type Coach = { status: "idle" } | { status: "loading"; text: string } | { status: "ai"; text: string; feedback: Feedback } | { status: "offline" };

const subjectLabel = { physics: "Physics", chemistry: "Chemistry", biology: "Biology" } as const;
const DirIcon = { up: ArrowUp, down: ArrowDown, same: Equal } satisfies Record<Direction, unknown>;
const unitText = (p: ParamDef, v: number) => formatMetric(v, p.unit);
/** A parameter whose presets cover every allowed value is a choice, not a slider. */
const isChoice = (p: ParamDef) => !!p.presets && (p.max - p.min) / p.step + 1 <= p.presets.length;
const valueLabel = (p: ParamDef, v: number) => p.presets?.find((o) => o.value === v)?.label ?? unitText(p, v);

export function SimLab({ spec, backHref = "/lab" }: { spec: SimSpec; backHref?: string }) {
  const template = templateOf(spec);
  const params = useMemo(() => paramsFor(spec), [spec]);
  const visible = params.filter((p) => !p.hidden);
  const base = useMemo(() => startValues(spec), [spec]);
  const outcome = useMemo(() => predictionOutcome(spec), [spec]);
  const pred = spec.prediction;
  const predParam = params.find((p) => p.id === pred.param)!;
  const metric = template.metrics.find((m) => m.id === pred.metric)!;

  const [step, setStep] = useState<Step>("Predict");
  const [guess, setGuess] = useState<Direction | null>(null);
  const [values, setValues] = useState<Values>(base);
  const [runs, setRuns] = useState<Run[]>([]);
  const [explain, setExplain] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [coach, setCoach] = useState<Coach>({ status: "idle" });
  const explainId = useId();

  const askCoach = async (text: string) => {
    setCoach({ status: "loading", text });
    try {
      const res = await fetch("/api/sim/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spec, guess, explanation: text }),
      });
      const data = (await res.json()) as FeedbackResponse;
      if (data.source === "ai") {
        setCoach({ status: "ai", text, feedback: data.feedback });
        logExplanation(true, data.feedback.ideas.filter(Boolean).length);
      } else {
        setCoach({ status: "offline" });
        logExplanation(true, null);
      }
    } catch {
      setCoach({ status: "offline" });
      logExplanation(true, null);
    }
  };
  const compare = () => {
    setRevealed(true);
    if (explain.trim()) void askCoach(explain.trim());
  };
  // Learning profile: what the student did in this experiment (stored only in this browser).
  const topic = topicForTemplate(spec.template);
  const logExplanation = (wrote: boolean, ideas: number | null) =>
    logEvent({ t: "explanation", topic, sim: spec.id, wrote, ideas, total: spec.keyIdeas.length });
  const aiIdeas = coach.status === "ai" ? coach.feedback.ideas : null;
  const coachStale = (coach.status === "ai" || coach.status === "loading") && coach.text !== explain.trim();

  const current = runs.at(-1);
  const previous = runs.at(-2);
  const stale = !!current && visible.some((p) => current.values[p.id] !== values[p.id]);
  const ranTo = runs.some((r) => r.values[pred.param] === pred.to);
  // A fair test changes only the prediction's parameter.
  const unfair = visible.some((p) => p.id !== pred.param && values[p.id] !== base[p.id]);

  const run = () => {
    setRuns((rs) => [...rs.slice(-1), { key: (rs.at(-1)?.key ?? 0) + 1, values: { ...values }, result: runSpec(spec, values) }]);
    logEvent({ t: "experiment_run", topic, sim: spec.id });
  };
  const set = (id: string, v: number) => setValues((vs) => ({ ...vs, [id]: v }));

  const options: { id: Direction; label: string }[] = (["up", "down", "same"] as const).map((d) => ({
    id: d,
    label: `${metric.label} ${directionWords[d]}`,
  }));

  const description = current
    ? `${template.name}: ${template.axes.y.label} against ${template.axes.x.label}. ${template.metrics
        .map((m) => `${m.label} ${formatMetric(current.result.metrics[m.id], m.unit)}`)
        .join(", ")}.`
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All simulations
      </Link>
      <p className="mb-2 text-sm text-muted">
        {subjectLabel[template.subject]} · {template.name} · {spec.minutes} minutes
      </p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">{spec.title}</h1>
      <p className="mb-8 max-w-[60ch] text-ink/75">{spec.intro}</p>

      <ol className="mb-8 flex gap-2" aria-label="Lab steps">
        {steps.map((s, i) => {
          const isCurrent = s === step;
          const done = steps.indexOf(step) > i;
          return (
            <li
              key={s}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium",
                isCurrent
                  ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent"
                  : done
                    ? "bg-accent-soft text-accent"
                    : "bg-surface text-muted ring-1 ring-line",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <span className="tabular-nums">{i + 1}</span>}
              {s}
            </li>
          );
        })}
      </ol>

      {step === "Predict" && (
        <Card className="p-5 sm:p-8">
          <p className="mb-2 text-sm font-medium text-accent">Guess first</p>
          <p className="mb-5 text-xl leading-snug font-medium">{pred.prompt}</p>
          <div role="radiogroup" aria-label="Your prediction" className="space-y-2">
            {options.map((o) => {
              const Icon = DirIcon[o.id];
              return (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={guess === o.id}
                  onClick={() => setGuess(o.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-5 py-3 text-left transition-colors duration-150",
                    guess === o.id ? "border-accent bg-accent-soft font-medium" : "border-line bg-surface hover:border-accent",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {o.label}
                </button>
              );
            })}
          </div>
          {guess && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted">Locked in. Now test it.</p>
              <Button
                onClick={() => {
                  if (outcome) logEvent({ t: "prediction", topic, sim: spec.id, correct: guess === outcome.answer });
                  setStep("Run");
                }}
              >
                Run the experiment <ArrowRight />
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === "Run" && (
        <Card className="p-5 sm:p-8">
          <div className="mb-6 rounded-2xl bg-accent-soft px-5 py-4 text-[15px]">
            {!current ? (
              <p>
                <span className="font-medium">Run 1:</span> {predParam.label} is set to {valueLabel(predParam, pred.from)}. Press
                Run to see what happens.
              </p>
            ) : !ranTo ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  <span className="font-medium">Run 2:</span> now change {predParam.label.toLowerCase()} to{" "}
                  {valueLabel(predParam, pred.to)} and run again.
                </p>
                <Button size="sm" variant="secondary" onClick={() => setValues({ ...base, [pred.param]: pred.to })}>
                  <Wand2 /> Set it for me
                </Button>
              </div>
            ) : (
              <p>
                <span className="font-medium">You&rsquo;ve tested your prediction.</span> Keep experimenting, or move on to
                explain what happened.
              </p>
            )}
          </div>

          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            {visible.map((p) => (
              <ParamControl key={p.id} param={p} value={values[p.id]} onChange={(v) => set(p.id, v)} highlight={p.id === pred.param} />
            ))}
          </div>

          {unfair && (
            <p className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted">
              For a fair test, change only {predParam.label.toLowerCase()}.
              <button
                className="font-medium text-accent underline-offset-4 hover:underline"
                onClick={() => setValues((vs) => ({ ...base, [pred.param]: vs[pred.param] }))}
              >
                Reset the others
              </button>
            </p>
          )}

          <Button onClick={run}>
            <Play /> {current ? "Run again" : "Run"}
          </Button>

          {current && (
            <div className={cn("mt-8 transition-opacity duration-150", stale && "opacity-50")}>
              {stale && <p className="mb-2 text-sm font-medium text-accent">Settings changed. Press Run again to update.</p>}
              <SimChart template={template} result={current.result} previous={previous?.result} runKey={current.key} description={description} />
              <dl className="mt-6 grid gap-3 sm:grid-cols-3" aria-live="polite">
                {template.metrics.map((m) => {
                  const now = current.result.metrics[m.id];
                  const before = previous?.result.metrics[m.id];
                  const d = now != null && before != null ? direction(before, now) : null;
                  const Icon = d ? DirIcon[d] : null;
                  return (
                    <div
                      key={m.id}
                      className={cn("rounded-2xl px-4 py-3 ring-1", m.id === pred.metric ? "bg-accent-soft ring-accent/40" : "ring-line")}
                    >
                      <dt className="text-sm text-muted">{m.label}</dt>
                      <dd className="text-xl font-medium tabular-nums">{formatMetric(now, m.unit)}</dd>
                      {previous && (
                        <dd className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                          {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
                          was {formatMetric(before, m.unit)}
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
              {ranTo && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep("Explain")}>
                    Explain it <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {step === "Explain" && outcome && guess && (
        <Card className="p-5 sm:p-8">
          <p className="mb-1 text-sm text-muted">You predicted</p>
          <p className="mb-2 text-lg">
            {metric.label} {directionWords[guess]}.
          </p>
          <p className={cn("mb-6 text-lg", guess === outcome.answer ? "text-accent" : "text-ink/80")}>
            {guess === outcome.answer ? "Right. " : "Not this time, and surprises like this are how you learn. "}
            In a fair test it {directionWords[outcome.answer]}: {formatMetric(outcome.before, metric.unit)} →{" "}
            {formatMetric(outcome.after, metric.unit)}.
          </p>
          {guess !== outcome.answer && spec.misconception && (
            <p className="mb-6 rounded-2xl bg-mark/60 p-4">
              A lot of people think: &ldquo;{spec.misconception}&rdquo; The experiment tells a different story.
            </p>
          )}

          <label htmlFor={explainId} className="mb-2 block font-medium">
            In your own words: why did that happen?
          </label>
          <textarea
            id={explainId}
            value={explain}
            onChange={(e) => setExplain(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface p-4 text-lg leading-relaxed focus:border-accent focus:outline-none"
            placeholder="Because…"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {(!revealed || coachStale || (coach.status === "idle" && explain.trim())) && (
              <Button onClick={compare} disabled={!explain.trim() || coach.status === "loading"}>
                {revealed ? "Get feedback on my new answer" : "Compare with the explanation"}
              </Button>
            )}
            {!revealed && (
              <Button
                variant="ghost"
                onClick={() => {
                  setRevealed(true);
                  if (!explain.trim()) logExplanation(false, null);
                }}
              >
                Show me the answer
              </Button>
            )}
          </div>

          {revealed && (
            <div className="mt-8 space-y-5" aria-live="polite">
              {coach.status === "loading" && (
                <p className="flex items-center gap-3 rounded-2xl bg-surface p-5 text-muted ring-1 ring-line">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" /> Reading your explanation…
                </p>
              )}
              {coach.status === "ai" && (
                <div className={cn("rounded-2xl p-5 ring-1", coachStale ? "opacity-60 ring-line" : "bg-surface ring-accent/40")}>
                  <p className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
                    <MessageCircle className="h-4 w-4" aria-hidden /> Feedback on your explanation
                  </p>
                  <p className="text-[17px] leading-relaxed">{coach.feedback.feedback}</p>
                  <p className="mt-3 text-xs text-muted">Written by AI. It&rsquo;s feedback, not a mark.</p>
                </div>
              )}
              <div className="rounded-2xl bg-accent-soft p-5">
                <p className="mb-1 text-sm font-medium text-accent">What&rsquo;s going on</p>
                <p className="leading-relaxed">{spec.explanation}</p>
              </div>
              <div>
                <p className="mb-3 font-medium">
                  {aiIdeas ? "Ideas in your explanation" : explain.trim() && coach.status !== "loading" ? "Tick the ideas your answer included" : "The key ideas"}
                </p>
                <ul className="space-y-2">
                  {spec.keyIdeas.map((idea, i) => {
                    if (aiIdeas) {
                      return (
                        <li key={idea} className="flex items-start gap-3 py-1">
                          <span
                            className={cn(
                              "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs",
                              aiIdeas[i] ? "bg-brand text-brand-ink" : "bg-ink/5 text-muted",
                            )}
                          >
                            {aiIdeas[i] ? <Check className="h-3.5 w-3.5" /> : "–"}
                          </span>
                          <span className={aiIdeas[i] ? "" : "text-muted"}>
                            {idea}
                            <span className="sr-only">{aiIdeas[i] ? ": in your explanation" : ": not in your explanation yet"}</span>
                          </span>
                        </li>
                      );
                    }
                    const on = ticked.has(i);
                    return (
                      <li key={idea}>
                        <button
                          role="checkbox"
                          aria-checked={on}
                          disabled={!explain.trim() || coach.status === "loading"}
                          onClick={() =>
                            setTicked((t) => {
                              const n = new Set(t);
                              if (on) n.delete(i);
                              else n.add(i);
                              return n;
                            })
                          }
                          className="flex w-full items-start gap-3 rounded-xl py-1 text-left disabled:cursor-default"
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs",
                              on ? "bg-brand text-brand-ink" : "bg-ink/5 text-muted",
                            )}
                          >
                            {on ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </span>
                          <span>{idea}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="text-sm text-muted">
                Added to{" "}
                <Link href="/profile" className="font-medium text-accent underline-offset-4 hover:underline">
                  what works for you
                </Link>
                . It helps plan what to study next.
              </p>
              {spec.realWorld && (
                <p className="text-ink/80">
                  <span className="font-medium">In the real world: </span>
                  {spec.realWorld}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <Link href={backHref}>
                    More simulations <ArrowRight />
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep("Run");
                    setRevealed(false);
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

function ParamControl({
  param: p,
  value,
  onChange,
  highlight,
}: {
  param: ParamDef;
  value: number;
  onChange: (v: number) => void;
  highlight: boolean;
}) {
  const id = useId();
  if (isChoice(p)) {
    return (
      <div>
        <p className={cn("mb-2 font-medium", highlight && "text-accent")}>{p.label}</p>
        <div role="radiogroup" aria-label={p.label} className="flex flex-wrap gap-2">
          {p.presets!.map((o) => (
            <button
              key={o.label}
              role="radio"
              aria-checked={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                value === o.value ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const presets = p.presets?.filter((o) => o.value >= p.min && o.value <= p.max) ?? [];
  return (
    <div>
      <label htmlFor={id} className={cn("mb-2 flex items-baseline justify-between gap-3 font-medium", highlight && "text-accent")}>
        {p.label}
        <span className="text-accent tabular-nums">{unitText(p, value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueLabel(p, value)}
        className="h-11 w-full accent-[var(--accent)]"
      />
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((o) => (
            <button
              key={o.label}
              onClick={() => onChange(o.value)}
              aria-pressed={value === o.value}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium ring-1 transition-colors duration-150",
                value === o.value ? "bg-accent-soft text-accent ring-accent" : "text-muted ring-line hover:text-ink",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
