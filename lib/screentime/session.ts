"use client";

// Client-side session store. The log shape mirrors what a backend would store per session;
// /summary shows it in place of GET /session/{id}/screentime.
import { useSyncExternalStore } from "react";
import {
  adaptAfterRecall,
  baseBlockMinutes,
  breakAfter,
  chooseTask,
  rules,
  struggleReason,
  warningSeconds,
  type Needs,
  type StruggleReason,
  type TaskType,
} from "./engine";
import { sectionForBlock } from "./planner";

export type Phase = "idle" | "setup" | "focus" | "break" | "recall" | "final" | "done";
export type BreakReason = "scheduled" | StruggleReason | "daily_cap";

export type BlockLog = {
  n: number;
  sectionId: string;
  plannedMin: number;
  activeSec: number;
  endedBy?: "timer" | "early" | "cap" | "ended";
  snoozed: boolean;
  recall?: { correct: number; total: number };
};

export type BreakLog = {
  afterBlock: number;
  kind: "short" | "long" | "early" | "final";
  reason: BreakReason;
  taskType: TaskType | "final_summary";
  plannedMin: number;
  offscreenSec: number;
};

export type Session = {
  id: string;
  startedAt: string;
  speed: number;
  capMin: number;
  needs: Needs;
  phase: Phase;
  blocks: BlockLog[];
  breaks: BreakLog[];
  screenSec: number;
  offscreenSec: number;
  nextBlockMin: number;
  simplify: boolean;
  lastTaskType?: TaskType;
  breakLeftSec: number;
  // live signals for struggle detection, reset each block
  wrongInARow: number;
  idleEvents: number;
  replays: Record<string, number>;
  snoozesLeft: number;
  resuggest?: { atActiveSec: number; reason: StruggleReason };
  suggestion: StruggleReason | null;
  warningsFired: number[];
  toast: { id: number; text: string } | null;
};

const KEY = "neura-session-v1";
let session: Session | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Session | null {
  if (!loaded) {
    loaded = true;
    try {
      session = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      session = null;
    }
  }
  return session;
}

function commit(next: Session | null) {
  session = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function update(fn: (s: Session) => Session | void) {
  const s = load();
  if (!s) return;
  const copy = structuredClone(s);
  commit(fn(copy) ?? copy);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSession() {
  return useSyncExternalStore(subscribe, load, () => null);
}

export function getSession() {
  return load();
}

// ---------- helpers ----------

const current = (s: Session) => s.blocks[s.blocks.length - 1];
export const blockLeftSec = (s: Session) => {
  const b = current(s);
  return b ? Math.max(0, b.plannedMin * 60 - b.activeSec) : 0;
};

function newBlock(s: Session, minutes: number) {
  const n = s.blocks.length + 1;
  s.blocks.push({ n, sectionId: sectionForBlock(n).id, plannedMin: minutes, activeSec: 0, snoozed: false });
  s.phase = "focus";
  s.wrongInARow = 0;
  s.idleEvents = 0;
  s.replays = {};
  s.snoozesLeft = rules.struggle.snoozes_per_block;
  s.resuggest = undefined;
  s.suggestion = null;
  s.warningsFired = [];
}

function toast(s: Session, text: string) {
  s.toast = { id: Date.now(), text };
}

function checkStruggle(s: Session) {
  if (s.phase !== "focus" || s.suggestion) return;
  const reason = struggleReason({
    wrongInARow: s.wrongInARow,
    idleEvents: s.idleEvents,
    maxReplays: Math.max(0, ...Object.values(s.replays)),
    overloaded: false,
  });
  if (reason) s.suggestion = reason;
}

function endBlock(s: Session, endedBy: NonNullable<BlockLog["endedBy"]>, reason: BreakReason) {
  const b = current(s);
  b.endedBy = endedBy;
  s.suggestion = null;
  s.toast = null;
  if (endedBy === "cap") {
    s.phase = "final";
    s.breaks.push({ afterBlock: b.n, kind: "final", reason, taskType: "final_summary", plannedMin: rules.final_task_minutes, offscreenSec: 0 });
    s.breakLeftSec = rules.final_task_minutes * 60;
    return;
  }
  const scheduled = breakAfter(b.n);
  const kind = endedBy === "early" ? "early" : scheduled.kind;
  const minutes = endedBy === "early" ? rules.short_break_minutes : scheduled.minutes;
  const taskType = chooseTask(s.needs, s.breaks.length, s.lastTaskType);
  s.lastTaskType = taskType;
  s.breaks.push({ afterBlock: b.n, kind, reason, taskType, plannedMin: minutes, offscreenSec: 0 });
  s.breakLeftSec = minutes * 60;
  s.phase = "break";
}

// ---------- actions ----------

export const sessionActions = {
  openSetup() {
    const s = load();
    if (s && s.phase !== "done" && s.phase !== "idle" && s.phase !== "setup") return;
    commit({ ...(s ?? blank()), phase: "setup" } as Session);
  },
  cancelSetup() {
    const s = load();
    if (s?.phase === "setup") commit(s.blocks.length ? { ...s, phase: "done" } : null);
  },
  start(opts: { needs: Needs; speed: number; capMin: number }) {
    const s: Session = { ...blank(), ...opts, id: `ses_${Date.now().toString(36)}`, startedAt: new Date().toISOString() };
    s.nextBlockMin = baseBlockMinutes(opts.needs);
    newBlock(s, s.nextBlockMin);
    commit(s);
  },
  /** Called by the ticker with real elapsed seconds. */
  tick(realSec: number, activeOnScreen: boolean) {
    const s = load();
    if (!s) return;
    if (s.phase === "focus") {
      if (!activeOnScreen) return;
      update((x) => {
        const d = realSec * x.speed;
        const b = current(x);
        b.activeSec += d;
        x.screenSec += d;
        const left = blockLeftSec(x);
        for (const w of warningSeconds(x.needs)) {
          if (left <= w && !x.warningsFired.includes(w) && left > 0) {
            x.warningsFired.push(w);
            toast(x, w >= 60 ? `Break in ${w / 60} minutes` : `Break in ${w} seconds`);
          }
        }
        if (x.resuggest && b.activeSec >= x.resuggest.atActiveSec && !x.suggestion) {
          x.suggestion = x.resuggest.reason;
          x.resuggest = undefined;
        }
        if (x.screenSec >= x.capMin * 60) endBlock(x, "cap", "daily_cap");
        else if (left <= 0) endBlock(x, "timer", "scheduled");
      });
    } else if (s.phase === "break" || s.phase === "final") {
      if (s.breakLeftSec <= 0) return;
      update((x) => {
        const d = Math.min(realSec * x.speed, x.breakLeftSec);
        x.breakLeftSec -= d;
        x.offscreenSec += d;
        x.breaks[x.breaks.length - 1].offscreenSec += d;
      });
    }
  },
  reportAnswer(correct: boolean) {
    update((x) => {
      if (x.phase !== "focus") return;
      x.wrongInARow = correct ? 0 : x.wrongInARow + 1;
      checkStruggle(x);
    });
  },
  reportIdle() {
    update((x) => {
      if (x.phase !== "focus") return;
      x.idleEvents += 1;
      checkStruggle(x);
    });
  },
  reportReplay(contentId: string) {
    update((x) => {
      if (x.phase !== "focus") return;
      x.replays[contentId] = (x.replays[contentId] ?? 0) + 1;
      checkStruggle(x);
    });
  },
  overloaded() {
    update((x) => {
      if (x.phase === "focus") x.suggestion = "overloaded";
    });
  },
  acceptSuggestion() {
    update((x) => {
      if (x.phase === "focus" && x.suggestion) endBlock(x, "early", x.suggestion);
    });
  },
  snooze() {
    update((x) => {
      if (!x.suggestion || x.snoozesLeft <= 0) return;
      x.snoozesLeft -= 1;
      current(x).snoozed = true;
      x.resuggest = { atActiveSec: current(x).activeSec + rules.struggle.snooze_minutes * 60, reason: x.suggestion };
      x.suggestion = null;
      x.wrongInARow = 0;
      x.idleEvents = 0;
      x.replays = {};
    });
  },
  changeTask(type: TaskType) {
    update((x) => {
      const br = x.breaks[x.breaks.length - 1];
      if (x.phase !== "break" || !br) return;
      br.taskType = type;
      x.lastTaskType = type;
    });
  },
  finishBreak() {
    update((x) => {
      if (x.phase === "break") x.phase = "recall";
      else if (x.phase === "final") x.phase = "done";
    });
  },
  completeRecall(correct: number, total: number) {
    update((x) => {
      const b = current(x);
      b.recall = { correct, total };
      const a = adaptAfterRecall(b.plannedMin, correct, total);
      x.nextBlockMin = a.nextMinutes;
      x.simplify = a.simplify;
    });
  },
  nextBlock() {
    update((x) => {
      if (x.phase === "recall") newBlock(x, Math.min(x.nextBlockMin, Math.max(1, Math.ceil((x.capMin * 60 - x.screenSec) / 60))));
    });
  },
  end() {
    update((x) => {
      if (x.phase === "focus") current(x).endedBy = "ended";
      x.phase = "done";
      x.suggestion = null;
      x.toast = null;
    });
  },
  dismissToast() {
    update((x) => {
      x.toast = null;
    });
  },
  clear() {
    commit(null);
  },
};

function blank(): Session {
  return {
    id: "",
    startedAt: "",
    speed: rules.demo.speed,
    capMin: rules.daily_cap_minutes_default,
    needs: { focus: "low", info_intake: "low", organising: "low", predictability: "low" },
    phase: "idle",
    blocks: [],
    breaks: [],
    screenSec: 0,
    offscreenSec: 0,
    nextBlockMin: 20,
    simplify: false,
    breakLeftSec: 0,
    wrongInARow: 0,
    idleEvents: 0,
    replays: {},
    snoozesLeft: rules.struggle.snoozes_per_block,
    suggestion: null,
    warningsFired: [],
    toast: null,
  };
}

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtMinutes = (sec: number) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

export const reasonLabels: Record<BreakReason, string> = {
  scheduled: "Scheduled",
  wrong_answers: "3 wrong answers in a row",
  idle: "Drifted off twice",
  replays: "Replayed the same part 3 times",
  overloaded: "You said “I'm overloaded”",
  daily_cap: "Daily screen limit reached",
};
