"use client";

// Everything Mosaic keeps, in one place: the privacy page lists it, exports it and deletes it.
// All of it lives in this browser's localStorage; nothing is sent to a Mosaic server.

import { useSyncExternalStore } from "react";

export const CONSENT_KEY = "mosaic-consent-v1";

export const storedData: { key: string; what: string }[] = [
  { key: "mosaic-profile-v1", what: "Your need scores, preferences, chosen layout, interest and Pip's look." },
  { key: "mosaic-events-v1", what: "What you did: experiment predictions and runs, explanations, quiz answers, reading time, focus blocks (up to 600 entries)." },
  { key: "mosaic-planner-v1", what: "Your exam dates, chosen habit coach and study minutes a day." },
  { key: "mosaic-session-v1", what: "The current focus session and its log." },
  { key: CONSENT_KEY, what: "Your age band and when you agreed to this notice." },
];

/** Text that leaves the browser, and where it goes. */
export const sentToAI = [
  "The science question you type into “Ask for any experiment”.",
  "The experiment and your written explanation, when you ask for feedback.",
];

export type AgeBand = "under-13" | "13-15" | "16-17" | "18-plus";
export type Consent = { ageBand: AgeBand; guardian: boolean; at: number; version: 1 };

export const needsGuardian = (band: AgeBand) => band !== "18-plus";

let consent: Consent | null | undefined;
const listeners = new Set<() => void>();

function readConsent(): Consent | null {
  if (consent !== undefined) return consent;
  try {
    consent = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
  } catch {
    consent = null;
  }
  return consent ?? null;
}

export function giveConsent(c: Omit<Consent, "at" | "version">) {
  consent = { ...c, at: Date.now(), version: 1 };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {}
  listeners.forEach((l) => l());
}

/** undefined while rendering on the server (unknown), null when not given yet. */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readConsent,
    () => undefined,
  );
}

/** All stored data as one JSON object, for "Download my data". */
export function exportData(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { key } of storedData) {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) out[key] = JSON.parse(v);
    } catch {}
  }
  return out;
}

/** Deletes everything Mosaic stored (including legacy keys), then reloads to reset every store. */
export function deleteAllData() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("mosaic-") || k.startsWith("neura-"))) localStorage.removeItem(k);
    }
  } catch {}
  // A full reload, not router.push: the stores keep state in module memory, which must reset too.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}
