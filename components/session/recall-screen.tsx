"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { QuizOption, optionState } from "@/components/lecture/quiz-option";
import { Button } from "@/components/ui/button";
import { recallQuestions, sectionForBlock } from "@/lib/screentime/planner";
import { sessionActions, useSession } from "@/lib/screentime/session";

export function RecallScreen() {
  const s = useSession()!;
  const b = s.blocks[s.blocks.length - 1];
  const section = sectionForBlock(b.n);
  const qs = recallQuestions(section);
  const [picks, setPicks] = useState<(number | null)[]>(qs.map(() => null));
  const done = picks.every((p) => p !== null);
  const correct = picks.filter((p, i) => p === qs[i].answer).length;

  const pick = (qi: number, oi: number) => {
    const next = picks.map((x, k) => (k === qi ? oi : x));
    setPicks(next);
    if (next.every((p) => p !== null)) {
      sessionActions.completeRecall(next.filter((p, i) => p === qs[i].answer).length, qs.length);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-labelledby="recall-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-canvas"
    >
      <div className="mx-auto max-w-[640px] px-6 py-16">
        <p className="mb-2 text-sm font-medium text-accent">Welcome back</p>
        <h2 id="recall-title" className="mb-2 text-4xl font-light tracking-[-0.02em]">
          Two quick questions
        </h2>
        <p className="mb-10 text-muted">On what you just studied: {section.title}.</p>
        <div className="space-y-8">
          {qs.map((q, qi) => (
            <div key={q.q}>
              <p className="mb-3 font-medium">
                {qi + 1}. {q.q}
              </p>
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <QuizOption key={o} label={o} state={optionState(picks[qi], oi, q.answer)} onClick={() => pick(qi, oi)} />
                ))}
              </div>
              {picks[qi] !== null && <p className="mt-2 text-sm text-muted">{q.why}</p>}
            </div>
          ))}
        </div>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-10 rounded-3xl border border-line bg-surface p-7"
            aria-live="polite"
          >
            <p className="mb-1 text-xl font-medium">
              {correct} of {qs.length} right.
            </p>
            <p className="mb-6 text-muted">
              {correct === qs.length
                ? `Nice recall. Your next block stays at ${s.nextBlockMin} minutes.`
                : `No problem. Your next block is shorter (${s.nextBlockMin} minutes) and the wording will be simpler.`}
            </p>
            <Button size="lg" onClick={sessionActions.nextBlock}>
              Start next block <ArrowRight />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
