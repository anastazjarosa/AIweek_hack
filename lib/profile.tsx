"use client";

import { useSyncExternalStore } from "react";
import type { Interest } from "@/lib/data";
import { DEFAULT_PIP, type PipPrefs } from "@/lib/pip";
import { DEFAULT_PREFS, ZERO, defaultView, needsFromScores, type Prefs, type Scores, type ViewId } from "@/lib/dimensions";

/** scores drive every adaptation; view is the lecture layout (the student can override it). */
type State = { scores: Scores; prefs: Prefs; view: ViewId; interest: Interest; pip: PipPrefs };

const KEY = "mosaic-profile-v1";
// Keys from earlier builds (label-based profiles, old app name). Removed on first load.
const OLD_KEYS = ["neura-profile-v1", "neura-session-v1", "neura-profile-v2", "neura-session-v2"];
const DEFAULT: State = { scores: ZERO, prefs: DEFAULT_PREFS, view: "standard", interest: "trains", pip: DEFAULT_PIP };

// Tiny external store. localStorage is demo persistence only: it survives a refresh mid-pitch.
let state: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<State>;
    // Nested objects merge too, so a profile saved by an older build still gets new defaults.
    state = {
      ...DEFAULT,
      ...saved,
      scores: { ...DEFAULT.scores, ...saved.scores },
      prefs: { ...DEFAULT.prefs, ...saved.prefs },
      pip: { ...DEFAULT_PIP, ...saved.pip },
    };
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
    /** Pip's look and wardrobe. Demo persistence: in the real product this is the user profile document. */
    setPip: (patch: Partial<PipPrefs>) => write({ pip: { ...read().pip, ...patch } }),
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
