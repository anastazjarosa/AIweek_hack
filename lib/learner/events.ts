"use client";

// The learning event log: what the student did, never who they are. Stored only in this browser
// (demo persistence), capped, and cleared from the privacy page. The profile is computed from it.

import { useSyncExternalStore } from "react";
import type { TopicId } from "@/lib/learner/topics";

type Base = { at: number };
export type LearnEvent = Base &
  (
    | { t: "prediction"; topic: TopicId; sim: string; correct: boolean }
    /** wrote=false: asked for the answer without trying. ideas/total from AI feedback when available. */
    | { t: "explanation"; topic: TopicId; sim: string; wrote: boolean; ideas: number | null; total: number }
    | { t: "experiment_run"; topic: TopicId; sim: string }
    | { t: "quiz"; topic: TopicId; correct: boolean }
    | { t: "read"; topic: TopicId; words: number; seconds: number }
    | { t: "replay"; topic: TopicId }
    | { t: "focus_block"; plannedMin: number; activeMin: number; endedBy: "timer" | "early" | "cap" | "ended" }
  );
export type NewEvent = LearnEvent extends infer E ? (E extends LearnEvent ? Omit<E, "at"> : never) : never;

export const EVENTS_KEY = "mosaic-events-v1";
const MAX = 600;

let events: LearnEvent[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: LearnEvent[] = [];

function read(): LearnEvent[] {
  if (events) return events;
  try {
    const saved = JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]");
    events = Array.isArray(saved) ? saved : [];
  } catch {
    events = [];
  }
  return events!;
}

function save(next: LearnEvent[]) {
  events = next.slice(-MAX);
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {}
  listeners.forEach((l) => l());
}

export function logEvent(e: NewEvent, at = Date.now()) {
  if (typeof window === "undefined") return;
  save([...read(), { ...e, at } as LearnEvent]);
}

export function replaceEvents(next: LearnEvent[]) {
  save(next);
}

export function clearEvents() {
  save([]);
}

export function useEvents(): LearnEvent[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}
