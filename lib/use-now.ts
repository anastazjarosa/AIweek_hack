"use client";

import { useSyncExternalStore } from "react";

// A shared clock that ticks once a minute, read through useSyncExternalStore so components stay
// pure during render. 0 during server rendering and hydration: callers treat 0 as "not yet known".

let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(l: () => void) {
  listeners.add(l);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((x) => x());
    }, 60_000);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const snapshot = () => (now ||= Date.now());

export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
