"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { checkQuestions, profiles, type ProfileId } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Stage = "choose" | "pick" | "check" | "result";

const pickOptions: { id: ProfileId; label: string; hint: string }[] = [
  { id: "adhd", label: "ADHD", hint: "Short sprints, instant feedback" },
  { id: "dyslexia", label: "Dyslexia", hint: "Audio first, readable layouts" },
  { id: "autism", label: "Autism", hint: "Predictable structure, interest-based examples" },
  { id: "standard", label: "No label, just preferences", hint: "Start standard, tweak as you go" },
];

const traitsFor: Record<ProfileId, string[]> = {
  adhd: ["Short sprints", "Instant feedback", "Quick wins"],
  dyslexia: ["Audio first", "Short sentences", "Readable layout"],
  autism: ["Clear structure", "Predictable layout", "Interest-based examples"],
  standard: ["Full notes", "Visible progress", "Self-paced reading"],
};

export default function Onboarding() {
  const router = useRouter();
  const { setProfile, setTraits, traits } = useProfile();
  const [stage, setStage] = useState<Stage>("choose");
  const [picked, setPicked] = useState<ProfileId[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [primary, setPrimary] = useState<ProfileId>("standard");

  const finishPick = () => {
    const first = picked[0] ?? "standard";
    const t = Array.from(new Set(picked.flatMap((p) => traitsFor[p]))).slice(0, 4);
    setPrimary(first);
    setProfile(first);
    setTraits(t);
    setStage("result");
  };

  const answer = (ai: number) => {
    const next = [...answers.slice(0, qi), ai];
    setAnswers(next);
    if (qi < checkQuestions.length - 1) {
      setQi(qi + 1);
      return;
    }
    const score: Record<ProfileId, number> = { adhd: 0, dyslexia: 0, autism: 0, standard: 0 };
    const traitCount = new Map<string, number>();
    next.forEach((a, i) => {
      const ans = checkQuestions[i].answers[a];
      Object.entries(ans.weights).forEach(([k, v]) => (score[k as ProfileId] += v ?? 0));
      traitCount.set(ans.trait, (traitCount.get(ans.trait) ?? 0) + 1);
    });
    const top = (Object.keys(score) as ProfileId[]).sort((a, b) => score[b] - score[a])[0];
    const t = [...traitCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 4);
    setPrimary(top);
    setProfile(top);
    setTraits(t);
    setStage("result");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-6">
        <Logo />
        <span className="text-sm text-muted">Setting up your study profile</span>
      </header>
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
                  <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">How do you learn best?</h1>
                  <p className="mb-10 text-lg text-muted">Two ways in. Both take less than two minutes.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ChoiceCard
                      icon={<Compass />}
                      title="I know what works for me"
                      body="Pick one or more profiles."
                      onClick={() => setStage("pick")}
                    />
                    <ChoiceCard
                      icon={<Sparkles />}
                      title="Take a 2-minute check"
                      body="Six quick questions about how you study."
                      onClick={() => setStage("check")}
                    />
                  </div>
                </div>
              )}

              {stage === "pick" && (
                <div>
                  <BackLink onClick={() => setStage("choose")} />
                  <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">What works for you?</h1>
                  <p className="mb-8 text-lg text-muted">Choose as many as fit. The first one leads.</p>
                  <div className="mb-8 space-y-3">
                    {pickOptions.map((o) => {
                      const on = picked.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          aria-pressed={on}
                          onClick={() => setPicked(on ? picked.filter((x) => x !== o.id) : [...picked, o.id])}
                          className={cn(
                            "flex w-full items-center justify-between rounded-2xl border bg-surface px-5 py-4 text-left transition-colors duration-150",
                            on ? "border-accent bg-accent-soft" : "border-line hover:border-ink/30",
                          )}
                        >
                          <span>
                            <span className="block font-medium">{o.label}</span>
                            <span className="text-sm text-muted">{o.hint}</span>
                          </span>
                          <span
                            className={cn(
                              "grid h-6 w-6 place-items-center rounded-full border",
                              on ? "border-accent bg-accent text-accent-ink" : "border-line",
                            )}
                          >
                            {on && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Button size="lg" onClick={finishPick} disabled={!picked.length}>
                    Continue <ArrowRight />
                  </Button>
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
                        {qi + 1} of {checkQuestions.length}
                      </span>
                    </div>
                    <Progress value={((qi + 1) / checkQuestions.length) * 100} />
                  </div>
                  <h1 className="mb-8 text-3xl leading-tight font-light tracking-[-0.02em]">{checkQuestions[qi].q}</h1>
                  <div className="space-y-3">
                    {checkQuestions[qi].answers.map((a, ai) => (
                      <button
                        key={a.label}
                        onClick={() => answer(ai)}
                        className={cn(
                          "w-full rounded-2xl border bg-surface px-5 py-4 text-left text-[17px] transition-colors duration-150 hover:border-accent hover:bg-accent-soft",
                          answers[qi] === ai ? "border-accent bg-accent-soft" : "border-line",
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stage === "result" && (
                <div>
                  <p className="mb-3 text-sm font-medium text-accent">Your study profile</p>
                  <h1 className="mb-8 text-4xl font-light tracking-[-0.02em]">
                    Here&rsquo;s how you work best.
                  </h1>
                  <Card className="mb-6 p-8">
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {traits.map((t) => (
                        <li key={t} className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3.5 font-medium">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-ink">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6 border-t border-line pt-5 text-muted">
                      We&rsquo;ll start you on the{" "}
                      <span className="font-medium text-ink">{profiles.find((p) => p.id === primary)?.label}</span> layout.
                    </p>
                  </Card>
                  <p className="mb-8 rounded-2xl border border-line px-5 py-4 text-sm leading-relaxed text-muted">
                    This isn&rsquo;t a diagnosis. It&rsquo;s how you told us you work best. You can change it anytime.
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

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}
