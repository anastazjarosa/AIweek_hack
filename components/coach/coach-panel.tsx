"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, BookOpen, Lightbulb, SearchCheck, X } from "lucide-react";
import Link from "next/link";
import { PipFigure, type PipFace } from "@/components/pip/pip-figure";
import { outfitSwatch } from "@/lib/pip";
import { useProfile } from "@/lib/profile";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiHeaders, readSSE } from "@/lib/client-api";
import { useEvents } from "@/lib/learner/events";
import { detectPatterns } from "@/lib/learner/patterns";
import { computeProfile } from "@/lib/learner/profile";
import type { SimSpec } from "@/lib/sim/spec";
import { cn } from "@/lib/utils";

type Mode = "ask" | "hint" | "check";
type Tone = "friendly" | "funny" | "quest";
const tones: { id: Tone; label: string; hint: string }[] = [
  { id: "friendly", label: "😊 Friendly", hint: "Warm and encouraging" },
  { id: "funny", label: "😄 Funny", hint: "Science puns included" },
  { id: "quest", label: "🎮 Quest", hint: "Earn XP, unlock power-ups" },
];
const TONE_KEY = "mosaic-pip-tone";
const readTone = (): Tone => {
  try {
    const t = localStorage.getItem(TONE_KEY);
    return t === "funny" || t === "quest" ? t : "friendly";
  } catch {
    return "friendly";
  }
};
type Cite = { id: string; title: string; href?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
  sources?: Cite[];
  citations?: string[];
  escalated?: boolean;
  offline?: boolean;
  pending?: boolean;
  escalationId?: string;
  humanReviewed?: boolean;
};

export type CoachTarget = { kind: "lecture" } | { kind: "sim"; spec: SimSpec; libraryId?: string };

const starters: Record<CoachTarget["kind"], string[]> = {
  lecture: ["What was the Cambrian explosion?", "Why is the peppered moth a good example of natural selection?", "How do we know how old fossils are?"],
  sim: ["Why doesn't mass change the result?", "What should I change next to test my idea?", "Where would I see this in real life?"],
};

/** "Ask the coach" button plus the drawer it opens. */
export function CoachButton({ target, label = "Ask Pip", className }: { target: CoachTarget; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const { pip } = useProfile();
  const reduce = useReducedMotion();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover((h) => h + 1)}
        onFocus={() => setHover((h) => h + 1)}
        onMouseLeave={() => setHover(0)}
        className={cn(
          "group inline-flex h-12 items-center gap-2 rounded-full bg-ink py-1 pr-5 pl-1.5 text-sm font-medium text-surface shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition-transform duration-150 hover:-translate-y-0.5",
          className,
        )}
      >
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-surface/95">
          {/* A new key on each hover replays the wave. */}
          <PipFigure key={hover} colour={pip.colour} animal={pip.animal} outfit={pip.outfit} outfitColour={outfitSwatch(pip, pip.outfit)} size={34} face={hover ? "joy" : "happy"} move={hover ? "wave" : null} motion={reduce ? "none" : "full"} breathe />
        </span>
        {label}
      </button>
      <AnimatePresence>{open && <CoachDrawer target={target} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function CoachDrawer({ target, onClose }: { target: CoachTarget; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [tone, setToneState] = useState<Tone>(readTone);
  const [xp, setXp] = useState(0);
  const setTone = (t: Tone) => {
    setToneState(t);
    try {
      localStorage.setItem(TONE_KEY, t);
    } catch {}
  };
  const { pip } = useProfile();
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const last = msgs.at(-1);
  const face: PipFace = busy ? "look" : last?.escalated ? "worried" : last?.role === "assistant" ? (tone === "funny" ? "cheeky" : "happy") : "calm";
  const events = useEvents();
  const patterns = useMemo(() => detectPatterns(computeProfile(events)).map((d) => d.pattern.id), [events]);
  const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    const waiting = msgs.filter((m) => m.role === "assistant" && m.escalationId && !m.humanReviewed).map((m) => m.escalationId!);
    if (!waiting.length) return;
    let active = true;
    const poll = async () => {
      for (const id of waiting) {
        try {
          const response = await fetch(`/api/teacher/escalations/${id}`, { headers: apiHeaders() });
          if (!response.ok) continue;
          const result = (await response.json()) as { status: string; answer?: string };
          if (active && result.status === "answered" && result.answer) {
            setMsgs((current) => current.map((message) => message.escalationId === id
              ? { ...message, content: result.answer!, humanReviewed: true, pending: false }
              : message));
          }
        } catch (error) {
          console.error("[coach] Could not check human review status", error);
        }
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [msgs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async (message: string, mode: Mode) => {
    const m = message.trim();
    if (!m || busy) return;
    setBusy(true);
    setText("");
    const history = msgs.filter((x) => !x.pending).map(({ role, content }) => ({ role, content }));
    const shown = mode === "hint" ? "Give me a hint" : mode === "check" ? `Check my thinking: ${m}` : m;
    setMsgs((x) => [...x, { role: "user", content: shown, mode }, { role: "assistant", content: "", pending: true }]);
    const patch = (p: Partial<Msg>) => setMsgs((x) => x.map((y, i) => (i === x.length - 1 ? { ...y, ...p } : y)));
    try {
      const context = target.kind === "sim" ? (target.libraryId ? { kind: "sim", simId: target.libraryId } : { kind: "sim", spec: target.spec }) : { kind: "lecture" };
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: apiHeaders({ accept: "text/event-stream" }),
        body: JSON.stringify({ context, history, message: m, mode, tone, patterns }),
      });
      if (!res.ok || !res.headers.get("content-type")?.includes("text/event-stream")) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        patch({ content: err.error ?? "Something went wrong. Try again.", pending: false });
      } else {
        let acc = "";
        await readSSE(res, (event, data) => {
          if (event === "sources") patch({ sources: data as Cite[] });
          else if (event === "delta") {
            acc += data as string;
            patch({ content: acc.replace("[[ASK_TEACHER]]", "") });
          } else if (event === "final") {
            const f = data as { text: string; citations: string[]; escalated: boolean; offline: boolean };
            patch({ content: f.text, citations: f.citations, escalated: f.escalated, offline: f.offline, pending: false });
            if (tone === "quest") setXp((v) => v + (mode === "check" ? 15 : mode === "hint" ? 5 : 10));
          } else if (event === "interrupt") {
            const interrupt = data as { id: string };
            patch({
              content: "Paused for human review. Your lecturer will review the question and the course evidence before the coach continues.",
              escalated: true,
              escalationId: interrupt.id,
              pending: false,
            });
          }
        });
      }
    } catch {
      patch({ content: "I couldn't reach the coach. Check your connection and try again.", pending: false });
    }
    setBusy(false);
  };

  const jump = (c: Cite) => {
    if (!c.href) return;
    onClose();
    setTimeout(() => document.querySelector(c.href!)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-ink/30" onClick={onClose} aria-hidden />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Pip, your study coach"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-[440px] flex-col bg-canvas shadow-2xl"
      >
        <header className="border-b border-line bg-surface px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft">
              <PipFigure colour={pip.colour} animal={pip.animal} outfit={pip.outfit} outfitColour={outfitSwatch(pip, pip.outfit)} size={48} face={face} move={!busy && last?.role === "assistant" && !last.pending ? "hop" : null} motion={reduce ? "none" : "full"} breathe />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Pip</p>
              <p className="text-sm text-muted">Hints, not answers. Every fact cites {target.kind === "lecture" ? "your lecture" : "this experiment"}.</p>
            </div>
            <button onClick={onClose} aria-label="Close coach" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div role="radiogroup" aria-label="Pip's tone" className="mt-3 flex flex-wrap gap-1.5">
            {tones.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={tone === t.id}
                title={t.hint}
                onClick={() => setTone(t.id)}
                className={cn("h-8 rounded-full px-3 text-xs font-medium transition-colors duration-150", tone === t.id ? "bg-ink text-surface" : "ring-1 ring-line hover:ring-accent")}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tone === "quest" && (
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="rounded-full bg-brand px-2 py-0.5 font-semibold text-brand-ink">Level {Math.floor(xp / 50) + 1}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label="XP to next level" aria-valuenow={xp % 50} aria-valuemin={0} aria-valuemax={50}>
                <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${((xp % 50) / 50) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
              <span className="tabular-nums text-muted">{xp} XP</span>
            </div>
          )}
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {msgs.length === 0 && (
            <div>
              <p className="mb-3 text-[15px] text-ink/80">
                Hi, I&rsquo;m Pip! Ask me anything about {target.kind === "lecture" ? "this lecture" : `“${target.spec.title}”`}. I&rsquo;ll point you to the
                right part and ask questions that help you work it out yourself.
              </p>
              <div className="space-y-2">
                {starters[target.kind].map((s) => (
                  <button key={s} onClick={() => send(s, "ask")} className="block w-full rounded-2xl bg-surface px-4 py-3 text-left text-[15px] ring-1 ring-line hover:ring-accent">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-10 rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[15px] text-surface">
                {m.content}
              </div>
            ) : (
              <div key={i} className="mr-6 flex gap-2">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft">
                  <PipFigure colour={pip.colour} animal={pip.animal} outfit={pip.outfit} outfitColour={outfitSwatch(pip, pip.outfit)} size={26} face={m.escalated ? "worried" : "happy"} motion="none" />
                </span>
                <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-[15px] leading-relaxed ring-1 ring-line" aria-live="polite">
                  {m.content ? <Cited text={m.content} sources={m.sources ?? []} onJump={jump} /> : <span className="inline-flex gap-1 text-muted">Thinking<span className="animate-pulse">…</span></span>}
                </div>
                {!m.pending && (m.citations?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.citations!.map((id) => {
                      const c = m.sources?.find((s) => s.id === id);
                      return (
                        <button
                          key={id}
                          onClick={() => c && jump(c)}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent hover:underline"
                        >
                          <BookOpen className="h-3 w-3" aria-hidden /> {c?.title ?? id}
                        </button>
                      );
                    })}
                  </div>
                )}
                {m.escalated && (
                  <p className="mt-2 rounded-2xl bg-mark/60 px-3 py-2 text-sm">
                    <span className="font-medium">{m.humanReviewed ? "Reviewed by your lecturer." : "Paused for your lecturer."}</span>{" "}
                    {m.humanReviewed ? "The human-reviewed response is shown above." : "A human reviewer can inspect the evidence and guide or override the coach."}{" "}
                    {!m.humanReviewed && <Link href="/teacher" className="font-medium text-accent underline underline-offset-2">Open review queue</Link>}
                  </p>
                )}
                {m.offline && !m.pending && <p className="mt-1 text-xs text-muted">Offline coach: answered straight from the material.</p>}
                </div>
              </div>
            ),
          )}
        </div>

        <footer className="border-t border-line bg-surface px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              disabled={busy || !msgs.length}
              onClick={() => send(lastUser ?? "", "hint")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm ring-1 ring-line hover:ring-accent disabled:opacity-40"
            >
              <Lightbulb className="h-3.5 w-3.5 text-accent" aria-hidden /> {msgs.some((m) => m.mode === "hint") ? "Another hint" : "Give me a hint"}
            </button>
            <button
              disabled={busy || !text.trim()}
              onClick={() => send(text, "check")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm ring-1 ring-line hover:ring-accent disabled:opacity-40"
            >
              <SearchCheck className="h-3.5 w-3.5 text-accent" aria-hidden /> Check my thinking
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text, "ask");
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="coach-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="coach-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text, "ask");
                }
              }}
              rows={1}
              maxLength={800}
              placeholder="Ask a question…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-canvas/40 px-4 py-2.5 text-[15px] focus:border-accent focus:outline-none"
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink disabled:opacity-40">
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </footer>
      </motion.aside>
    </>
  );
}

/** Renders [source-id] markers as small numbered links. */
function Cited({ text, sources, onJump }: { text: string; sources: Cite[]; onJump: (c: Cite) => void }) {
  const parts = text.split(/(\[[a-z]+(?:-[a-z0-9]+)*\])/g);
  const order: string[] = [];
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([a-z]+(?:-[a-z0-9]+)*)\]$/);
        if (!m) return <span key={i}>{p}</span>;
        const src = sources.find((s) => s.id === m[1]);
        if (!src) return null;
        if (!order.includes(src.id)) order.push(src.id);
        return (
          <button key={i} onClick={() => onJump(src)} title={src.title} className="mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-accent-soft px-1 align-text-top text-[11px] font-semibold text-accent">
            {order.indexOf(src.id) + 1}
          </button>
        );
      })}
    </>
  );
}
