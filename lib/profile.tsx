"use client";

import { useSyncExternalStore } from "react";
import type { Interest } from "@/lib/data";
import { DEFAULT_PREFS, ZERO, defaultView, needsFromScores, type Prefs, type Scores, type ViewId } from "@/lib/dimensions";

/** scores drive every adaptation; view is the lecture layout (the student can override it). */
type State = { scores: Scores; prefs: Prefs; view: ViewId; interest: Interest };

const KEY = "neura-profile-v2";
// v1 stored label-based profiles. Removed on first load; scores start fresh.
const OLD_KEYS = ["neura-profile-v1", "neura-session-v1"];
const DEFAULT: State = { scores: ZERO, prefs: DEFAULT_PREFS, view: "standard", interest: "trains" };

// Tiny external store. localStorage is demo persistence only: it survives a refresh mid-pitch.
let state: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
    state = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    state = DEFAULT;
  }
  return state!;
}

function write(patch: Partial<State>) {
  state = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProfile() {
  const s = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return {
    ...s,
    needs: needsFromScores(s.scores),
    setView: (view: ViewId) => write({ view }),
    setInterest: (interest: Interest) => write({ interest }),
    /** Changing scores or preferences re-picks the layout from them. */
    setScores: (scores: Scores) => write({ scores, view: defaultView(scores, read().prefs) }),
    setPrefs: (patch: Partial<Prefs>) => {
      const prefs = { ...read().prefs, ...patch };
      write({ prefs, view: defaultView(read().scores, prefs) });
    },
  };
}

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. Used to avoid animating the saved layout in on load. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
