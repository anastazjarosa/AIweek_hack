"use client";

import { useSyncExternalStore } from "react";
import type { Interest, ProfileId } from "@/lib/data";

type State = { profile: ProfileId; interest: Interest; traits: string[] };

const KEY = "neura-profile-v1";
const DEFAULT: State = { profile: "standard", interest: "trains", traits: [] };

// Tiny external store. localStorage is demo persistence only: it survives a refresh mid-pitch.
let state: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
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
    setProfile: (profile: ProfileId) => write({ profile }),
    setInterest: (interest: Interest) => write({ interest }),
    setTraits: (traits: string[]) => write({ traits }),
  };
}

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. Used to avoid animating the saved profile in on load. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
