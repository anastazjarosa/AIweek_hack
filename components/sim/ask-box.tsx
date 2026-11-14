"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { QUESTION_MAX } from "@/lib/sim/api-types";

const examples = [
  "Why don't heavier things fall faster?",
  "Why does milk go off faster when it's warm?",
  "How far could I throw a ball on Mars?",
];

/** "Ask for any experiment": sends the question to /lab/new, where the agent builds it. */
export function AskBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const id = useId();
  const go = (question: string) => {
    const t = question.trim();
    if (t.length >= 3) router.push(`/lab/new?q=${encodeURIComponent(t)}`);
  };
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <label htmlFor={id} className="mb-1 flex items-center gap-2 text-lg font-medium">
        <Sparkles className="h-5 w-5 text-accent" aria-hidden /> Ask for any experiment
      </label>
      <p className="mb-4 text-[15px] text-muted">
        Type a science question. The AI picks a tested model and builds a predict, run and explain experiment for it.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          id={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={QUESTION_MAX}
          placeholder="e.g. Why do things fall at the same speed?"
          className="h-12 flex-1 rounded-full border border-line bg-canvas/40 px-5 text-base focus:border-accent focus:outline-none"
        />
        <Button type="submit" size="lg" disabled={q.trim().length < 3}>
          Build it <ArrowRight />
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="py-1.5 text-sm text-muted">Try:</span>
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => go(e)}
            className="rounded-full px-3 py-1.5 text-sm text-ink ring-1 ring-line transition-colors duration-150 hover:ring-accent"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
