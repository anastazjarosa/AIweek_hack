// Pip, the study-buddy body double. Pure rules only: what Pip looks like, how much it may move
// and what it says. Components read from here; nothing in the screen-time engine depends on Pip.
import { levelFor, type Scores } from "./dimensions";
import type { StruggleReason } from "./screentime/engine";

export type Colourway = "matcha" | "peach" | "lavender";
export type OutfitId = "scarf" | "beret" | "headphones" | "backpack" | "party_hat";

export type PipPrefs = {
  colour: Colourway;
  outfit: OutfitId | null;
  unlocked: OutfitId[];
  /** Unlocked but not yet opened in the blind-box reveal. */
  pendingReveal: OutfitId | null;
  hidden: boolean;
};

export const DEFAULT_PIP: PipPrefs = { colour: "matcha", outfit: null, unlocked: [], pendingReveal: null, hidden: false };

export const colourways: Record<Colourway, { label: string; body: string; shade: string; belly: string; line: string }> = {
  matcha: { label: "Matcha", body: "#A9CB8C", shade: "#8DB46E", belly: "#CFE3BC", line: "#3D5A2A" },
  peach: { label: "Peach", body: "#F7BE9B", shade: "#EDA27A", belly: "#FCDCC6", line: "#7A3F1E" },
  lavender: { label: "Lavender", body: "#C9B8E6", shade: "#B09BD8", belly: "#E4DAF4", line: "#4A3770" },
};

export const outfits: { id: OutfitId; label: string }[] = [
  { id: "scarf", label: "Cosy scarf" },
  { id: "beret", label: "Beret" },
  { id: "headphones", label: "Headphones" },
  { id: "backpack", label: "Tiny backpack" },
  { id: "party_hat", label: "Party hat" },
];

export const outfitLabel = (id: OutfitId) => outfits.find((o) => o.id === id)!.label;

/**
 * How much Pip may move. Reduced motion (OS setting or calm theme) means no movement at all:
 * state shows through the face only. High structure keeps Pip in one spot with small, slow moves.
 */
export type PipMotion = "none" | "minimal" | "full";

export function pipMotion(scores: Scores, reducedMotion: boolean): PipMotion {
  if (reducedMotion) return "none";
  return levelFor(scores.predictability) === "high" ? "minimal" : "full";
}

/** High focus need: no idle breathing during a focus block, just a still reading pose. */
export const stillDuringFocus = (scores: Scores) => levelFor(scores.focus) === "high";

/** A break unlocks an outfit only when the student stayed away for all of it. */
export function earnedUnlock(br: { plannedMin: number; offscreenSec: number }) {
  return br.offscreenSec >= br.plannedMin * 60 - 1;
}

/** Next surprise outfit, or null when the wardrobe is complete. `rand` is 0-1 (Math.random in the app). */
export function pickUnlock(unlocked: OutfitId[], rand: number): OutfitId | null {
  const locked = outfits.map((o) => o.id).filter((id) => !unlocked.includes(id));
  if (!locked.length) return null;
  return locked[Math.min(locked.length - 1, Math.floor(rand * locked.length))];
}

const mins = (sec: number) => Math.max(1, Math.ceil(sec / 60));
const minutesText = (sec: number) => `${mins(sec)} minute${mins(sec) === 1 ? "" : "s"} left`;

export type UrgeKind = "phone" | "tab";

/** Pop names the pull without encouraging it; Pip answers with one concrete strategy. */
export function urgeLines(kind: UrgeKind, blockLeftSec: number): { pop: string; pip: string } {
  if (kind === "tab") {
    return {
      pop: "Another tab is calling. That's the pull of something new and shiny talking!",
      pip: `Close it for now and park the thought on paper. ${minutesText(blockLeftSec)}, then a break.`,
    };
  }
  return {
    pop: "You want to check your phone. That's the unpredictable-reward pull talking!",
    pip: `Put it in another room, face down. ${minutesText(blockLeftSec)}, then a break.`,
  };
}

export function struggleLine(reason: StruggleReason): { text: string; offerExplain: boolean } {
  switch (reason) {
    case "wrong_answers":
    case "replays":
      return { text: "This bit looks tricky. Want me to explain it another way?", offerExplain: true };
    case "overloaded":
      return { text: "That's a lot at once. A short break is a good call.", offerExplain: false };
    case "idle":
      return { text: "Your mind's wandering. That's normal. A break usually helps.", offerExplain: false };
  }
}

export const pipLines = {
  blockStart: (n: number, minutes: number, title: string) =>
    `Block ${n}: ${minutes} minutes on ${title}. I'll sit quietly with you.`,
  breakStart: "Break time. Look away from the screen and stretch. I'll keep your place.",
  finalStart: "That's today's screen time. One last off-screen task, then you're done.",
  returnFull: "Welcome back! You stayed away for the whole break.",
  returnEarly: "Welcome back! Finish a whole break next time for a surprise.",
  idle: "Hi, I'm Pip. Tap me any time. I stay quiet while you focus.",
};
