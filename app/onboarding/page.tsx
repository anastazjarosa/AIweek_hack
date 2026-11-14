"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConsentGate } from "@/components/consent-gate";
import { Logo } from "@/components/logo";
import { ScoreBars } from "@/components/score-bars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dimensions, scaleLabels, scoresFromAnswers, views } from "@/lib/dimensions";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Stage = "choose" | "check" | "result";

const statements = dimensions.flatMap((d) => d.statements);

export default function Onboarding() {
  const router = useRouter();
  const { scores, view, setScores } = useProfile();
  const [stage, setStage] = useState<Stage>("choose");
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const answer = (v: number) => {
    const next = [...answers.slice(0, qi), v];
    setAnswers(next);
    if (qi < statements.length - 1) {
      setQi(qi + 1);
      return;
    }
    setScores(scoresFromAnswers(next));
    setStage("result");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-6">
        <Logo />
        <span className="text-sm text-muted">How you like to learn</span>
      </header>
      {/* Consent comes before the student shares anything about how they learn. */}
      <ConsentGate />
      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-[640px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage === "check" ? `check-${qi}` : stage}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {stage === "choose" && (
                <div>
                  <p className="mb-3 text-sm font-medium text-accent">Optional head start</p>
                  <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">How do you learn best?</h1>
                  <p className="mb-10 text-lg text-muted">
                    Mosaic learns from what you do, so you can skip this. Answering gives it a head start; you can change
                    everything later.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ChoiceCard
                      icon={<Sparkles />}
                      title="Rate 8 statements"
                      body="Say how much each one is like you."
                      onClick={() => setStage("check")}
                    />
                    <ChoiceCard
                      icon={<SlidersHorizontal />}
                      title="Set it myself"
                      body="Four sliders and a few preferences."
                      onClick={() => router.push("/preferences")}
                    />
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Skip: learn from what I do <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {stage === "check" && (
                <div>
                  <div className="mb-10">
                    <div className="mb-3 flex items-center justify-between text-sm text-muted">
                      <button
                        onClick={() => (qi === 0 ? setStage("choose") : setQi(qi - 1))}
                        className="inline-flex items-center gap-1.5 hover:text-ink"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <span className="tabular-nums">
                        {qi + 1} of {statements.length}
                      </span>
                    </div>
                    <Progress value={((qi + 1) / statements.length) * 100} />
                  </div>
                  <p className="mb-3 text-sm text-muted">How much is this like you?</p>
                  <h1 className="mb-10 text-3xl leading-tight font-light tracking-[-0.02em]">&ldquo;{statements[qi]}&rdquo;</h1>
                  <div role="radiogroup" aria-label="How much is this like you" className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((v) => (
                      <button
                        key={v}
                        role="radio"
                        aria-checked={answers[qi] === v}
                        aria-label={`${v} of 4${scaleLabels[v] ? `, ${scaleLabels[v]}` : ""}`}
                        onClick={() => answer(v)}
                        className={cn(
                          "h-14 rounded-2xl border bg-surface text-lg font-medium transition-colors duration-150 hover:border-accent hover:bg-accent-soft",
                          answers[qi] === v ? "border-accent bg-accent-soft" : "border-line",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-muted">
                    <span>{scaleLabels[0]}</span>
                    <span>{scaleLabels[4]}</span>
                  </div>
                </div>
              )}

              {stage === "result" && (
                <div>
                  <p className="mb-3 text-sm font-medium text-accent">How you like to learn</p>
                  <h1 className="mb-8 text-4xl font-light tracking-[-0.02em]">Here&rsquo;s what we&rsquo;ll adapt.</h1>
                  <Card className="mb-6 p-8">
                    <ScoreBars scores={scores} />
                    <p className="mt-6 border-t border-line pt-5 text-muted">
                      Your lectures will open in the{" "}
                      <span className="font-medium text-ink">{views.find((v) => v.id === view)?.label}</span> layout.
                    </p>
                  </Card>
                  <p className="mb-8 rounded-2xl border border-line px-5 py-4 text-sm leading-relaxed text-muted">
                    These are your needs and preferences, not a label. You can change them anytime in &ldquo;How I
                    like to learn&rdquo;.
                  </p>
                  <Button size="lg" onClick={() => router.push("/dashboard")}>
                    Go to my dashboard <ArrowRight />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-3xl border border-line bg-surface p-7 text-left transition-colors duration-150 hover:border-accent"
    >
      <span className="mb-10 grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <span className="mb-1.5 block text-lg font-medium">{title}</span>
      <span className="flex items-center justify-between text-muted">
        {body}
        <ArrowRight className="h-4 w-4 text-accent transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
