// Pip, the study-buddy body double. Pure rules only: what Pip looks like, how much it may move
// and what it says. Components read from here; nothing in the screen-time engine depends on Pip.
import { levelFor, type Scores } from "./dimensions";
import type { StruggleReason } from "./screentime/engine";

export type Colourway = "peach";
export type OutfitId = "scarf" | "beret" | "headphones" | "sprout" | "wings";

/** The zodiac animals Pip can be, in birth-year order. Snake, horse, dog and pig are not offered. */
export const ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "goat", "monkey", "rooster"] as const;
export type Animal = (typeof ANIMALS)[number];

/** The animals Pip can actually be right now. All the drawings are kept, so adding one back is one word. */
export const OFFERED_ANIMALS: readonly Animal[] = ANIMALS;

export const animalLabel = (a: Animal) => a[0].toUpperCase() + a.slice(1);

/** Full zodiac cycle, starting from the rat. */
const ZODIAC = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig"] as const;
/** Zodiac years whose animal is not offered get the neighbouring animal instead. */
const STAND_IN: Record<string, Animal> = { snake: "dragon", horse: "goat", dog: "rooster", pig: "rat" };

/** Zodiac animal for a birth year (calendar year; the lunar new year boundary is ignored). 2020 is the rat. */
export function zodiacAnimal(year: number): Animal {
  const z = ZODIAC[(((Math.trunc(year) - 4) % 12) + 12) % 12];
  return z in STAND_IN ? STAND_IN[z] : (z as Animal);
}

/** Pip's animal for a birth year, limited to the animals on offer. */
export function animalForYear(year: number): Animal {
  const a = zodiacAnimal(year);
  return OFFERED_ANIMALS.includes(a) ? a : OFFERED_ANIMALS[0];
}

export type PipPrefs = {
  colour: Colourway;
  animal: Animal;
  /** Set when the student typed a birth year; the animal follows it until they pick one by hand. */
  birthYear: number | null;
  outfit: OutfitId | null;
  unlocked: OutfitId[];
  /** Unlocked but not yet opened in the blind-box reveal. */
  pendingReveal: OutfitId | null;
  hidden: boolean;
  /** Chosen colour per outfit. Missing means the outfit's default. */
  outfitColours: Partial<Record<OutfitId, SwatchId>>;
};

export const DEFAULT_PIP: PipPrefs = {
  colour: "peach",
  animal: "rabbit",
  birthYear: null,
  outfit: null,
  unlocked: [],
  pendingReveal: null,
  hidden: false,
  outfitColours: {},
};

export const colourways: Record<Colourway, { label: string; body: string; shade: string; belly: string; line: string }> = {
  peach: { label: "Peach", body: "#F7BE9B", shade: "#EDA27A", belly: "#FCDCC6", line: "#7A3F1E" },
};

export const outfits: { id: OutfitId; label: string }[] = [
  { id: "scarf", label: "Cosy scarf" },
  { id: "beret", label: "Beret" },
  { id: "headphones", label: "Headphones" },
  { id: "sprout", label: "Sprout" },
  { id: "wings", label: "Little wings" },
];

/** Colours an outfit can be worn in. `alt` is a lighter tone for second leaves, highlights and stripes. */
export const SWATCHES = {
  black: { label: "Black", fill: "#2B2B2B", stroke: "#111111", alt: "#555555", light: "#8A8A8A" },
  white: { label: "White", fill: "#F4F1EC", stroke: "#9A948A", alt: "#FFFFFF", light: "#B9B2A6" },
  red: { label: "Red", fill: "#D9483B", stroke: "#8E2A21", alt: "#EE6A5C", light: "#F6E3C8" },
  blue: { label: "Blue", fill: "#4F76D9", stroke: "#2B3F8F", alt: "#6F93F0", light: "#D6E2FF" },
  green: { label: "Green", fill: "#7DB35A", stroke: "#4E7F35", alt: "#8FC46A", light: "#DDF0D6" },
  pink: { label: "Pink", fill: "#E58AA8", stroke: "#A04A68", alt: "#F0A3BB", light: "#FBE0EA" },
  purple: { label: "Purple", fill: "#8B6FD0", stroke: "#4F3C8A", alt: "#A38BE0", light: "#E6DDFA" },
  yellow: { label: "Yellow", fill: "#E8B53A", stroke: "#8A6410", alt: "#F2C95C", light: "#FFF0C2" },
} as const;
export type SwatchId = keyof typeof SWATCHES;
export const SWATCH_IDS = Object.keys(SWATCHES) as SwatchId[];

/** Outfits whose colour the student can change. The wings stay white. */
export const DEFAULT_OUTFIT_COLOUR: Partial<Record<OutfitId, SwatchId>> = {
  scarf: "black",
  headphones: "black",
  beret: "blue",
  sprout: "green",
};
export const isCustomisable = (id: OutfitId | null): id is OutfitId => !!id && id in DEFAULT_OUTFIT_COLOUR;

/** The swatch an outfit is currently worn in. */
export function outfitSwatch(pip: Pick<PipPrefs, "outfitColours">, id: OutfitId | null): SwatchId | undefined {
  if (!isCustomisable(id)) return undefined;
  const chosen = pip.outfitColours?.[id];
  return chosen && chosen in SWATCHES ? chosen : DEFAULT_OUTFIT_COLOUR[id];
}
/**
 * Saved profiles from earlier builds can hold things that no longer exist (matcha, the backpack,
 * the snake...). Anything unknown falls back to the default, so the wardrobe never renders blank.
 */
export function normalisePip(saved: Partial<PipPrefs> | undefined): PipPrefs {
  const s = { ...DEFAULT_PIP, ...saved };
  const outfitIds = outfits.map((o) => o.id);
  return {
    ...s,
    colour: s.colour in colourways ? s.colour : DEFAULT_PIP.colour,
    animal: OFFERED_ANIMALS.includes(s.animal) ? s.animal : DEFAULT_PIP.animal,
    outfit: s.outfit && outfitIds.includes(s.outfit) ? s.outfit : null,
    unlocked: (s.unlocked ?? []).filter((id) => outfitIds.includes(id)),
    pendingReveal: s.pendingReveal && outfitIds.includes(s.pendingReveal) ? s.pendingReveal : null,
    outfitColours: Object.fromEntries(
      Object.entries(s.outfitColours ?? {}).filter(([id, sw]) => isCustomisable(id as OutfitId) && (sw as string) in SWATCHES),
    ),
  };
}

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

