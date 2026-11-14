"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, Pause, Play, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioBar } from "@/components/audio-bar";
import { QuizOption, optionState } from "@/components/lecture/quiz-option";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lecture } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { logEvent } from "@/lib/learner/events";
import { sessionActions } from "@/lib/screentime/session";

const SPRINT = 5 * 60;
const cards = lecture.sections;

export function SprintsView() {
  const { needs } = useProfile();
  const [banner, setBanner] = useState(true);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [firstTry, setFirstTry] = useState(0);
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(SPRINT);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, done]);

  const card = cards[i];
  const progress = ((i + (picked !== null ? 1 : 0)) / cards.length) * 100;

  const pick = (oi: number) => {
    setPicked(oi);
    sessionActions.reportAnswer(oi === card.check.answer);
    logEvent({ t: "quiz", topic: "history-of-life", correct: oi === card.check.answer });
    if (oi === card.check.answer) setFirstTry((n) => n + 1);
  };
  const next = () => {
    if (i === cards.length - 1) {
      setDone(true);
      return;
    }
    setI(i + 1);
    setPicked(null);
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setFirstTry(0);
    setDone(false);
    setLeft(SPRINT);
    setRunning(true);
  };

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence initial={false}>
        {banner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl bg-accent-soft px-5 py-4 text-[15px]"
          >
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="flex-1">
              <span className="font-medium">Missed yesterday? No stress.</span>{" "}
              <span className="text-ink/75">We moved this lecture to today and kept your streak.</span>
            </p>
            <button onClick={() => setBanner(false)} aria-label="Dismiss" className="text-ink/50 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{lecture.title} · Sprint 1</p>
          <p className="text-lg font-medium">
            Card {Math.min(i + 1, cards.length)} of {cards.length}
          </p>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 font-medium tabular-nums ring-1 ring-line"
          aria-label={running ? "Pause timer" : "Resume timer"}
        >
          {running ? <Pause className="h-4 w-4 text-accent" /> : <Play className="h-4 w-4 text-accent" />}
          {mm}
        </button>
      </div>
      <Progress value={done ? 100 : progress} className="mb-8 h-2" />

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="p-10 text-center">
              <Celebration />
              <h2 className="mb-2 text-3xl font-light tracking-[-0.02em]">Sprint done.</h2>
              <p className="mb-8 text-muted">
                {cards.length} concepts in {Math.max(1, Math.round((SPRINT - left) / 60))} min. {firstTry} right first time.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/dashboard">
                    Take a 2-minute break <ArrowRight />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={`/lecture/${lecture.slug}/lab`}>Try the moth lab</Link>
                </Button>
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw /> Go again
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Card className="p-8 sm:p-10">
              <p className="mb-3 text-sm font-medium text-accent">{card.title}</p>
              <p className="mb-3 text-3xl leading-snug font-light tracking-[-0.01em]">{card.points[0]}</p>
              <p className="mb-8 text-lg text-muted">{card.points[1]}</p>
              {needs.processing === "high" && <AudioBar seconds={45} label={card.title} contentId={card.id} className="mb-8" />}
              <div className="border-t border-line pt-6">
                <p className="mb-3 font-medium">Quick check</p>
                <p className="mb-4">{card.check.q}</p>
                <div className="space-y-2">
                  {card.check.options.map((o, oi) => (
                    <QuizOption key={o} label={o} state={optionState(picked, oi, card.check.answer)} onClick={() => pick(oi)} />
                  ))}
                </div>
                <AnimatePresence>
                  {picked !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="mt-5 flex flex-wrap items-center justify-between gap-4"
                      aria-live="polite"
                    >
                      <p className={picked === card.check.answer ? "font-medium text-accent" : "text-clay"}>
                        {picked === card.check.answer ? "Nice. " : "Not quite. "}
                        <span className="font-normal text-ink/75">{card.check.why}</span>
                      </p>
                      <Button onClick={next}>
                        {i === cards.length - 1 ? "Finish sprint" : "Next card"} <ArrowRight />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Celebration() {
  const dots = Array.from({ length: 10 });
  return (
    <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center" aria-hidden>
      {dots.map((_, k) => {
        const a = (k / dots.length) * Math.PI * 2;
        return (
          <motion.span
            key={k}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(a) * 46, y: Math.sin(a) * 46, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        );
      })}
      <motion.span
        className="grid h-16 w-16 place-items-center rounded-full bg-brand text-brand-ink"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Check className="h-7 w-7" />
      </motion.span>
    </div>
  );
}
