"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SimLab } from "@/components/sim/sim-lab";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GenerateResponse } from "@/lib/sim/api-types";

// What the server really does, in order. The ticks are paced, not measured.
const steps = ["Reading your question", "Choosing a tested model", "Checking the experiment against the model"];

type State = { status: "loading"; step: number } | { status: "done"; result: GenerateResponse };

export function GeneratedLab({ question }: { question: string }) {
  const [state, setState] = useState<State>({ status: "loading", step: 0 });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const ticks = [1, 2].map((s, i) => setTimeout(() => setState((st) => (st.status === "loading" ? { ...st, step: s } : st)), 1400 * (i + 1)));
    fetch("/api/sim/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: ctrl.signal,
    })
      .then((r) => r.json() as Promise<GenerateResponse>)
      .then((result) => setState({ status: "done", result }))
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") {
          setState({ status: "done", result: { source: "error", error: "Couldn't reach the lab. Check your connection and try again." } });
        }
      });
    return () => {
      ctrl.abort();
      ticks.forEach(clearTimeout);
    };
  }, [question, attempt]);

  const retry = () => {
    setState({ status: "loading", step: 0 });
    setAttempt((a) => a + 1);
  };

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <BackLink />
        <p className="mb-2 text-sm text-muted">Building your experiment</p>
        <h1 className="mb-8 text-3xl font-light tracking-[-0.02em] sm:text-4xl">&ldquo;{question}&rdquo;</h1>
        <Card className="p-6 sm:p-8" aria-live="polite">
          <ol className="space-y-4">
            {steps.map((s, i) => {
              const done = i < state.step;
              const active = i === state.step;
              return (
                <li key={s} className={done ? "flex items-center gap-3 text-accent" : active ? "flex items-center gap-3 font-medium" : "flex items-center gap-3 text-muted"}>
                  {done ? (
                    <Check className="h-5 w-5 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border border-line" />
                  )}
                  {s}
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-sm text-muted">This usually takes 10 to 30 seconds.</p>
        </Card>
      </div>
    );
  }

  const r = state.result;
  if (r.source === "ai" || r.source === "library") {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl bg-accent-soft px-5 py-3 text-[15px]"
          role="status"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <p>
            {r.source === "ai" ? (
              <>
                <span className="font-medium">Built for your question by the AI.</span> The results come from a tested model,
                and the app checked the answer itself.
              </>
            ) : (
              r.note
            )}
          </p>
        </motion.div>
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
            <Button onClick={retry}>
              <RotateCcw /> Try again
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/lab" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> All simulations
    </Link>
  );
}
