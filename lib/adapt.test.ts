import { describe, expect, it } from "vitest";
import { shouldSuggestSprints, skimEvidence, skimScore, wordCount } from "./adapt";

// 100 words takes 25 s to read; under 7.5 s counts as skimmed.
const skim = { words: 100, seconds: 3 };
const read = { words: 100, seconds: 30 };

describe("skimScore", () => {
  it("is 0 with no reads", () => {
    expect(skimScore([])).toBe(0);
  });

  it("looks only at the 4 most recent sections", () => {
    expect(skimScore([read, read, skim, skim, skim, skim])).toBe(1);
    expect(skimScore([skim, skim, read, read, read, read])).toBe(0);
  });
});

describe("shouldSuggestSprints", () => {
  it("suggests once at least 3 recent sections are mostly skimmed", () => {
    expect(shouldSuggestSprints([skim, skim, skim])).toBe(true);
    expect(shouldSuggestSprints([read, skim, skim, skim])).toBe(true); // 0.75
  });

  it("does not suggest on too little evidence or for careful readers", () => {
    expect(shouldSuggestSprints([skim, skim])).toBe(false);
    expect(shouldSuggestSprints([read, read, skim, skim])).toBe(false); // 0.5
    expect(shouldSuggestSprints([read, read, read])).toBe(false);
  });
});

describe("skimEvidence", () => {
  it("averages time spent and time needed over skimmed sections only", () => {
    expect(skimEvidence([read, { words: 80, seconds: 2 }, { words: 120, seconds: 4 }])).toEqual({ spent: 3, needed: 25 });
  });
});

describe("wordCount", () => {
  it("counts words across whitespace", () => {
    expect(wordCount("  one two\nthree  ")).toBe(3);
  });
});
