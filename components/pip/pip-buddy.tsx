"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Shirt, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { OutfitReveal } from "@/components/pip/outfit-reveal";
import { PipFigure, type PipFace, type PipMove, type PipPose } from "@/components/pip/pip-figure";
import { lecture, type Section } from "@/lib/data";
import {
  earnedUnlock,
  outfitSwatch,
  pickUnlock,
  pipLines,
  pipMotion,
  stillDuringFocus,
  struggleLine,
  urgeLines,
  type UrgeKind,
} from "@/lib/pip";
import { useHydrated, useProfile } from "@/lib/profile";
import { sectionForBlock } from "@/lib/screentime/planner";
import { blockLeftSec, fmtClock, getSession, useSession, type Session } from "@/lib/screentime/session";
import { cn } from "@/lib/utils";

type Msg = { who: "pip" | "pop" | "me"; text: string; list?: string[]; offerExplain?: boolean };

// Chat log for this browser tab. Module-level so it survives moving between pages.
let chatLog: Msg[] = [{ who: "pip", text: pipLines.idle }];

const BUBBLE_MS = 5000;
const URGE_MS = 9000;
const POINT_MS = 8000;
const REVEAL_DELAY_MS = 2200;

type Snapshot = { phase: Session["phase"]; blocks: number; idle: number; suggestion: Session["suggestion"] };
const snap = (s: Session | null): Snapshot | null =>
  s && { phase: s.phase, blocks: s.blocks.length, idle: s.idleEvents, suggestion: s.suggestion };

function currentSection(s: Session | null): Section {
  return s?.blocks.length ? sectionForBlock(s.blocks.length) : lecture.sections[0];
}

function explainMsgs(section: Section): Msg[] {
  const term = section.terms[0];
  return [
    { who: "pip", text: `Here's “${section.title}” in three small steps:`, list: section.points.slice(0, 3) },
    ...(term ? [{ who: "pip" as const, text: `Key word: ${term.term}. It means ${term.def.charAt(0).toLowerCase()}${term.def.slice(1)}` }] : []),
  ];
}

/**
 * The study buddy in the bottom-left corner. It watches the existing screen-time session and only
 * reacts to transitions (block start, break, return), urges and struggle signals. It never changes
 * the session: every reaction is read-only apart from Pip's own wardrobe.
 */
export function PipBuddy() {
  const hydrated = useHydrated();
  const { pip, scores, prefs, setPip } = useProfile();
  const s = useSession();
  const osReduced = useReducedMotion();
  const motionLevel = pipMotion(scores, !!osReduced || prefs.calmTheme);

  const [move, setMove] = useState<{ m: PipMove; key: number }>({ m: null, key: 0 });
  const [bubbles, setBubbles] = useState<Msg[]>([]);
  const [log, setLog] = useState<Msg[]>(chatLog);
  const [chatOpen, setChatOpen] = useState(false);
  const [urge, setUrge] = useState(false);
  const [pointing, setPointing] = useState(false);
  // The blind box waits a moment so the return wave and welcome are seen first.
  const [revealFor, setRevealFor] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const urgeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pipRef = useRef(pip);
  useEffect(() => {
    pipRef.current = pip;
  }, [pip]);

  useEffect(() => {
    const id = pip.pendingReveal;
    if (!id) return;
    const t = setTimeout(() => setRevealFor(id), REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [pip.pendingReveal]);

  const append = useCallback((msgs: Msg[]) => {
    chatLog = [...chatLog, ...msgs].slice(-30);
    setLog(chatLog);
  }, []);

  const say = useCallback(
    (msgs: Msg[], ms = BUBBLE_MS) => {
      append(msgs);
      clearTimeout(bubbleTimer.current);
      setBubbles(msgs);
      bubbleTimer.current = setTimeout(() => setBubbles([]), ms);
    },
    [append],
  );

  const play = useCallback((m: PipMove) => setMove((x) => ({ m, key: x.key + 1 })), []);

  const startUrge = useCallback(
    (kind: UrgeKind) => {
      const cur = getSession();
      const lines = urgeLines(kind, cur ? blockLeftSec(cur) : 0);
      setUrge(true);
      say(
        [
          { who: "pop", text: lines.pop },
          { who: "pip", text: lines.pip },
        ],
        URGE_MS,
      );
      clearTimeout(urgeTimer.current);
      urgeTimer.current = setTimeout(() => setUrge(false), URGE_MS);
    },
    [say],
  );

  // Transition director: compares each session update with the previous one.
  const prev = useRef<Snapshot | null | undefined>(undefined);
  useEffect(() => {
    const now = snap(s);
    const was = prev.current;
    prev.current = now;
    if (was === undefined || !now) return; // first render after mount: no replay of old transitions

    if (now.phase === "focus" && (now.blocks > (was?.blocks ?? 0) || was?.phase !== "focus")) {
      const b = s!.blocks[s!.blocks.length - 1];
      play("hop");
      say([{ who: "pip", text: pipLines.blockStart(b.n, b.plannedMin, sectionForBlock(b.n).title) }]);
    } else if ((now.phase === "break" || now.phase === "final") && was?.phase === "focus") {
      play("stretch");
      setPointing(true);
      clearTimeout(pointTimer.current);
      pointTimer.current = setTimeout(() => setPointing(false), POINT_MS);
      setUrge(false);
      say([{ who: "pip", text: now.phase === "final" ? pipLines.finalStart : pipLines.breakStart }]);
    } else if (now.phase === "recall" && was?.phase === "break") {
      play("wave");
      const br = s!.breaks[s!.breaks.length - 1];
      const id = earnedUnlock(br) ? pickUnlock(pipRef.current.unlocked, Math.random()) : null;
      if (id) setPip({ unlocked: [...pipRef.current.unlocked, id], pendingReveal: id });
      say([{ who: "pip", text: earnedUnlock(br) ? pipLines.returnFull : pipLines.returnEarly }]);
    } else if (now.phase === "focus" && was?.phase === "focus") {
      if (now.suggestion && !was.suggestion) {
        const l = struggleLine(now.suggestion);
        say([{ who: "pip", text: l.text, offerExplain: l.offerExplain }], 8000);
      } else if (now.idle === 1 && was.idle === 0 && !now.suggestion) {
        startUrge("phone");
      }
    }
  }, [s, play, say, setPip, startUrge]);

  // Coming back from another tab mid-block is an urge moment too. Read-only: the ticker already
  // pauses screen time while the tab is hidden.
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 1500 && getSession()?.phase === "focus") startUrge("tab");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [startUrge]);

  useEffect(
    () => () => {
      clearTimeout(bubbleTimer.current);
      clearTimeout(urgeTimer.current);
      clearTimeout(pointTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChatOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen]);

  if (!hydrated) return null;

  const phase = s?.phase ?? "idle";
  let pose: PipPose = "sit";
  let face: PipFace = "happy";
  let breathe = motionLevel !== "none";
  if (phase === "focus") {
    const still = stillDuringFocus(scores);
    pose = still ? "read" : "sit";
    face = "calm";
    breathe = !still && motionLevel === "full";
    if (s?.suggestion) face = "worried";
    if (urge) face = "alert";
  } else if (phase === "break" || phase === "final") {
    pose = pointing ? "point" : "rest";
    face = pointing ? "look" : "sleep";
    breathe = false;
  } else if (phase === "recall") {
    face = move.m === "wave" ? "joy" : "happy";
  }

  const openChat = () => {
    clearTimeout(bubbleTimer.current);
    setBubbles([]);
    setChatOpen(true);
  };
  const explain = () => {
    append([{ who: "me", text: "Explain this another way" }, ...explainMsgs(currentSection(getSession()))]);
    openChat();
  };
  const timeLeft = () => {
    const cur = getSession();
    append([
      { who: "me", text: "How long until my break?" },
      {
        who: "pip",
        text:
          cur?.phase === "focus"
            ? `${fmtClock(blockLeftSec(cur))} of focus left${cur.speed > 1 ? ` (demo clock, ${cur.speed}×)` : ""}. You've got this.`
            : "No focus block is running. Start one from the top bar when you're ready.",
      },
    ]);
  };
  const phoneUrge = () => {
    const cur = getSession();
    const lines = urgeLines("phone", cur?.phase === "focus" ? blockLeftSec(cur) : 0);
    append([{ who: "me", text: "I want to check my phone" }, { who: "pop", text: lines.pop }, { who: "pip", text: lines.pip }]);
  };

  return (
    <>
      {pip.pendingReveal && revealFor === pip.pendingReveal && phase !== "focus" && (
        <OutfitReveal
          outfit={pip.pendingReveal}
          colour={pip.colour}
          animal={pip.animal}
          motion={motionLevel}
          onWear={() => setPip({ outfit: pip.pendingReveal, pendingReveal: null })}
          onLater={() => setPip({ pendingReveal: null })}
        />
      )}
      {!pip.hidden && (
        <div className="fixed bottom-28 left-3 z-[55] md:bottom-4 md:left-4">
          {/* Bubbles and chat sit above Pip, growing upwards from the corner. */}
          <div className="absolute bottom-full left-0 mb-2 w-[min(340px,calc(100vw-24px))]">
            {chatOpen ? (
              <ChatPanel
                log={log}
                onClose={() => {
                  setChatOpen(false);
                  buttonRef.current?.focus();
                }}
                onExplain={explain}
                onTimeLeft={timeLeft}
                onPhone={phoneUrge}
              />
            ) : (
              <div aria-live="polite" className="flex flex-col items-start gap-2">
                <AnimatePresence>
                  {bubbles.map((b, i) => (
                    <Bubble key={`${b.who}-${b.text}`} msg={b} delay={i * 1.1} onExplain={explain} onOpen={openChat} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-end gap-1">
            <button
              ref={buttonRef}
              onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
              aria-label="Pip, your study buddy. Open chat"
              aria-expanded={chatOpen}
              aria-controls="pip-chat"
              className="rounded-full p-1 focus-visible:outline-offset-0"
            >
              <PipFigure
                key={move.key}
                colour={pip.colour}
                animal={pip.animal}
                outfit={pip.outfit}
                outfitColour={outfitSwatch(pip, pip.outfit)}
                pose={pose}
                face={face}
                move={move.m}
                breathe={breathe}
                motion={motionLevel}
                size={68}
              />
            </button>
            <AnimatePresence>
              {urge && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  aria-hidden
                >
                  <PipFigure colour={pip.colour} animal={pip.animal} mode="pop" motion={motionLevel} size={54} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ msg, delay, onExplain, onOpen }: { msg: Msg; delay: number; onExplain: () => void; onOpen: () => void }) {
  const pop = msg.who === "pop";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className={cn(
        "relative max-w-[300px] rounded-2xl px-4 py-3 text-sm leading-snug shadow-[0_12px_28px_-16px_rgba(84,40,10,0.5)]",
        pop ? "ml-16 bg-ink text-white" : "bg-surface text-ink ring-1 ring-line",
      )}
    >
      <p className={cn("mb-0.5 text-xs font-medium", pop ? "text-glow" : "text-accent")}>{pop ? "Pop" : "Pip"}</p>
      <button onClick={onOpen} className="text-left">
        {msg.text}
      </button>
      {msg.offerExplain && (
        <button onClick={onExplain} className="mt-2 block rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-hover">
          Yes, explain it
        </button>
      )}
    </motion.div>
  );
}

function ChatPanel({
  log,
  onClose,
  onExplain,
  onTimeLeft,
  onPhone,
}: {
  log: Msg[];
  onClose: () => void;
  onExplain: () => void;
  onTimeLeft: () => void;
  onPhone: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [log]);
  return (
    <motion.div
      id="pip-chat"
      role="dialog"
      aria-label="Chat with Pip"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex max-h-[min(520px,60vh)] flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_24px_48px_-24px_rgba(84,40,10,0.45)] ring-1 ring-line"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-medium">Pip</p>
        <button onClick={onClose} aria-label="Close chat" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {log.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug",
              m.who === "me" && "ml-auto bg-accent-soft text-ink",
              m.who === "pip" && "bg-canvas text-ink",
              m.who === "pop" && "bg-ink text-white",
            )}
          >
            {m.who !== "me" && (
              <p className={cn("mb-0.5 text-xs font-medium", m.who === "pop" ? "text-glow" : "text-accent")}>{m.who === "pop" ? "Pop" : "Pip"}</p>
            )}
            {m.text}
            {m.list && (
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                {m.list.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        <button ref={first} onClick={onExplain} className="h-9 rounded-full bg-brand px-3.5 text-sm font-medium text-brand-ink hover:bg-brand-hover">
          Explain this another way
        </button>
        <button onClick={onTimeLeft} className="h-9 rounded-full px-3.5 text-sm ring-1 ring-line hover:ring-ink/30">
          How long until my break?
        </button>
        <button onClick={onPhone} className="h-9 rounded-full px-3.5 text-sm ring-1 ring-line hover:ring-ink/30">
          I want to check my phone
        </button>
        <Link href="/wardrobe" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm text-accent hover:bg-accent-soft">
          <Shirt className="h-4 w-4" /> Pip&rsquo;s wardrobe
        </Link>
      </div>
    </motion.div>
  );
}
