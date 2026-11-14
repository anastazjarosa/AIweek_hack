// Behaviour-based layout suggestion. Pure functions; the UI only suggests, never switches silently.
//
// A section counts as skimmed when the student scrolls past it in under 30% of the time it
// takes to read (about 4 words a second). When most recent sections are skimmed, the skim
// score passes 0.7 and we offer the Sprints layout.

export const WORDS_PER_SECOND = 4;
export const SKIM_RATIO = 0.3;
export const SUGGEST_AT = 0.7;
export const MIN_READS = 3;
const WINDOW = 4;

export type Read = { words: number; seconds: number };

export const expectedSeconds = (words: number) => words / WORDS_PER_SECOND;
const skimmed = (r: Read) => r.seconds < expectedSeconds(r.words) * SKIM_RATIO;

/** Share of the most recent sections that were skimmed, 0-1. */
export function skimScore(reads: Read[]): number {
  const recent = reads.slice(-WINDOW);
  return recent.length ? recent.filter(skimmed).length / recent.length : 0;
}

export function shouldSuggestSprints(reads: Read[]): boolean {
  return reads.length >= MIN_READS && skimScore(reads) >= SUGGEST_AT;
}

/** Evidence shown with the suggestion: average seconds spent vs needed on skimmed sections. */
export function skimEvidence(reads: Read[]): { spent: number; needed: number } {
  const s = reads.slice(-WINDOW).filter(skimmed);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    spent: Math.max(1, Math.round(avg(s.map((r) => r.seconds)))),
    needed: Math.round(avg(s.map((r) => expectedSeconds(r.words)))),
  };
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
