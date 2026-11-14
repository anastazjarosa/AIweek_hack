"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Square, Waves } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BreakOverlay } from "@/components/session/break-overlay";
import { RecallScreen } from "@/components/session/recall-screen";
import { SetupDialog } from "@/components/session/setup-dialog";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { rules } from "@/lib/screentime/engine";
import { blockLeftSec, fmtClock, getSession, reasonLabels, sessionActions, useSession } from "@/lib/screentime/session";

/** Mounted once in the app shell: drives the clock and renders every session surface. */
export function SessionLayer() {
  useTicker();
  const s = useSession();
  const pathname = usePathname();
  if (!s) return null;
  return (
    <>
      {s.phase === "setup" && <SetupDialog />}
      {s.phase === "focus" && <FocusWidget />}
      {s.phase === "focus" && <StruggleCard />}
      <Toast />
      {(s.phase === "break" || s.phase === "final") && <BreakOverlay />}
      {s.phase === "recall" && <RecallScreen />}
      {s.phase === "done" && pathname !== "/summary" && <DoneCard />}
    </>
  );
}

function useTicker() {
  useEffect(() => {
    let last = performance.now();
    let lastInput = performance.now();
    let idle = false;
    const onInput = () => {
      lastInput = performance.now();
      idle = false;
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    const id = setInterval(() => {
      const now = performance.now();
      const real = Math.min(2, (now - last) / 1000);
      last = now;
      const s = getSession();
      if (!s || !["focus", "break", "final"].includes(s.phase)) {
        lastInput = now;
        return;
      }
      const threshold = (s.speed > 1 ? rules.demo.idle_seconds : rules.struggle.idle_seconds) * 1000;
      const isIdle = s.phase === "focus" && now - lastInput > threshold;
      if (isIdle && !idle) {
        idle = true;
        sessionActions.reportIdle();
      }
      sessionActions.tick(real, document.visibilityState === "visible" && !isIdle);
    }, 500);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, onInput));
    };
  }, []);
}

function FocusWidget() {
  const s = useSession()!;
  const b = s.blocks[s.blocks.length - 1];
  const left = blockLeftSec(s);
  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-4 rounded-3xl border border-line bg-surface py-3 pr-3 pl-3 shadow-[0_20px_40px_-24px_rgba(84,40,10,0.35)]">
      <ProgressRing value={(left / (b.plannedMin * 60)) * 100} size={60} stroke={5} label={fmtClock(left)} />
      <div className="text-sm leading-tight">
        <p className="font-medium">
          Block {b.n} · {b.plannedMin} min
        </p>
        <p className="text-muted">{s.speed > 1 ? `Demo speed ${s.speed}×` : "Focus time"}</p>
        {s.simplify && <p className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">Simpler wording on</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={sessionActions.overloaded}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-canvas px-3 text-xs font-medium hover:bg-accent-soft"
        >
          <Waves className="h-3.5 w-3.5" /> I&rsquo;m overloaded
        </button>
        <button
          onClick={sessionActions.end}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted hover:bg-ink/5 hover:text-ink"
        >
          <Square className="h-3 w-3" /> End session
        </button>
      </div>
    </div>
  );
}

function StruggleCard() {
  const s = useSession()!;
  return (
    <AnimatePresence>
      {s.suggestion && (
        <motion.div
          role="alertdialog"
          aria-label="Break suggestion"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed right-5 bottom-28 z-40 w-[340px] rounded-3xl bg-ink p-6 text-white shadow-xl"
        >
          <Coffee className="mb-3 h-5 w-5 text-glow" />
          <p className="mb-1 text-lg font-medium">This looks like a good moment for a break.</p>
          <p className="mb-5 text-sm text-white/70">{reasonLabels[s.suggestion]}. A few minutes away usually helps it stick.</p>
          <div className="flex gap-2">
            <Button onClick={sessionActions.acceptSuggestion} className="bg-white text-ink hover:bg-white/90">
              Take a break
            </Button>
            {s.snoozesLeft > 0 && (
              <Button variant="ghost" onClick={sessionActions.snooze} className="text-white hover:bg-white/10">
                Snooze {rules.struggle.snooze_minutes} min
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast() {
  const s = useSession();
  const t = s?.toast;
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(sessionActions.dismissToast, 4000);
    return () => clearTimeout(id);
  }, [t]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
      <AnimatePresence>
        {t && (
          <motion.p
            key={t.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {t.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function DoneCard() {
  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 pl-5 shadow-[0_20px_40px_-24px_rgba(84,40,10,0.35)]">
      <p className="text-sm font-medium">Session finished</p>
      <Button asChild size="sm">
        <Link href="/summary">See summary</Link>
      </Button>
      <button onClick={sessionActions.clear} className="text-sm text-muted hover:text-ink">
        Dismiss
      </button>
    </div>
  );
}
