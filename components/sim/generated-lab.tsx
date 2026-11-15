"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot, Check, Loader2, RotateCcw, ShieldCheck, Sparkles, X, Cpu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SimLab } from "@/components/sim/sim-lab";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiHeaders, readSSE } from "@/lib/client-api";
import type { GenerateResponse } from "@/lib/sim/api-types";
import { cn } from "@/lib/utils";

type Trace = { step: "guard" | "designer" | "proposal" | "verifier" | "result"; ok?: boolean; text: string };
type State = { status: "loading"; trace: Trace[] } | { status: "done"; result: GenerateResponse; trace: Trace[] };

const stepIcon = { guard: ShieldCheck, designer: Bot, proposal: Sparkles, verifier: Cpu, result: Check } as const;
const stepName = { guard: "Input guard", designer: "Designer agent", proposal: "Proposal", verifier: "Engine verifier", result: "Result" } as const;

export function GeneratedLab({ question }: { question: string }) {
  const [state, setState] = useState<State>({ status: "loading", trace: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const trace: Trace[] = [];
    const done = (result: GenerateResponse) => setState({ status: "done", result, trace: [...trace] });
    (async () => {
      try {
        const res = await fetch("/api/sim/generate?stream=1", {
          method: "POST",
          headers: apiHeaders({ accept: "text/event-stream" }),
          body: JSON.stringify({ question }),
          signal: ctrl.signal,
        });
        if (res.headers.get("content-type")?.includes("text/event-stream")) {
          await readSSE(res, (event, data) => {
            if (event === "trace") {
              trace.push(data as Trace);
              setState({ status: "loading", trace: [...trace] });
            } else if (event === "result") done(data as GenerateResponse);
          });
        } else {
          done((await res.json()) as GenerateResponse);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") done({ source: "error", error: "Couldn't reach the lab. Check your connection and try again." });
      }
    })();
    return () => ctrl.abort();
  }, [question, attempt]);

  const retry = () => {
    setState({ status: "loading", trace: [] });
    setAttempt((a) => a + 1);
  };

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <BackLink />
        <p className="mb-2 text-sm text-muted">Building your experiment</p>
        <h1 className="mb-8 text-3xl font-light tracking-[-0.02em] sm:text-4xl">&ldquo;{question}&rdquo;</h1>
        <Card className="overflow-hidden" aria-live="polite">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="font-medium">Live agent pipeline</p>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> working
            </span>
          </div>
          <TraceList trace={state.trace} live />
          <p className="border-t border-line px-6 py-3 text-sm text-muted">
            Every experiment passes the input guard, a schema check and a fair test on the real model before you see it.
          </p>
        </Card>
      </div>
    );
  }

  const r = state.result;
  if (r.source === "pending") return <PendingReview reviewId={r.reviewId} note={r.note} question={question} trace={state.trace} />;
  if (r.source === "ai" || r.source === "library") {
    return (
      <div>
        <motion.details
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="group mx-auto mb-6 max-w-3xl rounded-2xl bg-accent-soft px-5 py-3 text-[15px]"
          role="status"
        >
          <summary className="flex cursor-pointer list-none items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="flex-1">
              {r.source === "ai" ? (
                <>
                  <span className="font-medium">Built for your question by the AI.</span> The results come from a tested model,
                  and the app checked the answer itself.
                </>
              ) : (
                r.note
              )}
            </span>
            <span className="text-sm font-medium whitespace-nowrap text-accent">
              <span className="group-open:hidden">How it was built</span>
              <span className="hidden group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="-mx-5 mt-3 border-t border-accent/20">
            <TraceList trace={state.trace} />
          </div>
        </motion.details>
        <SimLab spec={r.spec} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <h1 className="mb-6 text-3xl font-light tracking-[-0.02em] sm:text-4xl">&ldquo;{question}&rdquo;</h1>
      <Card className="p-6 sm:p-8">
        {r.source === "none" ? (
          <>
            <p className="mb-2 text-lg font-medium">The lab can&rsquo;t build that one yet.</p>
            <p className="mb-6 text-ink/80">{r.reason}</p>
            <div className="flex flex-wrap gap-3">
              {r.suggestion && (
                <Button asChild>
                  <Link href={`/lab/${r.suggestion.id}`}>
                    Try &ldquo;{r.suggestion.title}&rdquo; <ArrowRight />
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href="/lab">Ask something else</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-6 text-lg">{r.error}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={retry}>
                <RotateCcw /> Try again
              </Button>
              <Button asChild variant="secondary">
                <Link href="/lab">Ask something else</Link>
              </Button>
            </div>
          </>
        )}
        {state.trace.length > 0 && (
          <div className="-mx-6 mt-6 border-t border-line sm:-mx-8">
            <TraceList trace={state.trace} />
          </div>
        )}
      </Card>
    </div>
  );
}

type ReviewState = { status: "pending" | "approved" | "rejected"; note?: string; spec?: import("@/lib/sim/spec").SimSpec };

/** Human in the loop, student side: wait for the lecturer, then open the approved (maybe edited) experiment. */
function PendingReview({ reviewId, note, question, trace }: { reviewId: string; note: string; question: string; trace: Trace[] }) {
  const [state, setState] = useState<ReviewState>({ status: "pending" });
  useEffect(() => {
    if (state.status !== "pending") return;
    let active = true;
    const check = async () => {
      try {
        const res = await fetch(`/api/sim/review/${reviewId}`, { headers: apiHeaders() });
        if (res.ok && active) {
          const data = (await res.json()) as ReviewState;
          if (data.status !== "pending") setState(data);
        }
      } catch {}
    };
    void check();
    const t = window.setInterval(() => void check(), 3000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [reviewId, state.status]);

  if (state.status === "approved" && state.spec) {
    return (
      <div>
        <p role="status" className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl bg-accent-soft px-5 py-3 text-[15px]">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="font-medium">Approved by your lecturer.</span> Built by the AI, checked by the engine and reviewed by a human.
            {state.note ? ` Note: ${state.note}` : ""}
          </span>
        </p>
        <SimLab spec={state.spec} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <h1 className="mb-6 text-3xl font-light tracking-[-0.02em] sm:text-4xl">&ldquo;{question}&rdquo;</h1>
      <Card className="p-6 sm:p-8" aria-live="polite">
        {state.status === "rejected" ? (
          <>
            <p className="mb-2 text-lg font-medium">Your lecturer didn&rsquo;t approve this one.</p>
            <p className="mb-6 text-ink/80">{state.note}</p>
            <Button asChild>
              <Link href="/lab">Try another experiment</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mb-2 flex items-center gap-2 text-lg font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden /> Your lecturer is checking this experiment
            </p>
            <p className="mb-2 text-ink/80">{note}</p>
            <p className="text-sm text-muted">It opens here automatically as soon as it&rsquo;s approved.</p>
          </>
        )}
      </Card>
      {trace.length > 0 && (
        <Card className="mt-4">
          <TraceList trace={trace} />
        </Card>
      )}
    </div>
  );
}

function TraceList({ trace, live = false }: { trace: Trace[]; live?: boolean }) {
  return (
    <ol className="space-y-0 px-6 py-4">
      <AnimatePresence initial={false}>
        {trace.map((t, i) => {
          const Icon = stepIcon[t.step];
          const bad = t.ok === false;
          const last = live && i === trace.length - 1 && t.step !== "result";
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              {i < trace.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
              <span
                className={cn(
                  "relative grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  bad ? "bg-clay-soft text-clay" : t.ok ? "bg-brand text-brand-ink" : "bg-accent-soft text-accent",
                )}
              >
                {last ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : bad ? <X className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="pt-1">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">{stepName[t.step]}</p>
                <p className="text-[15px]">{t.text}</p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
      {trace.length === 0 && (
        <li className="flex items-center gap-3 text-muted">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Starting…
        </li>
      )}
    </ol>
  );
}

function BackLink() {
  return (
    <Link href="/lab" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> All simulations
    </Link>
  );
}
