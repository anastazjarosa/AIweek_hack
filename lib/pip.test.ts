import { describe, expect, it } from "vitest";
import { ZERO } from "./dimensions";
import { ANIMALS, animalForYear, zodiacAnimal, earnedUnlock, normalisePip, outfits, pickUnlock, pipMotion, stillDuringFocus, struggleLine, urgeLines } from "./pip";

const demo = { focus: 4, processing: 1, organising: 1, predictability: 3 };

describe("pip motion", () => {
  it("reduced motion always wins: face only", () => {
    expect(pipMotion(demo, true)).toBe("none");
    expect(pipMotion(ZERO, true)).toBe("none");
  });
  it("high structure keeps Pip to minimal movement", () => {
    expect(pipMotion(demo, false)).toBe("minimal");
    expect(pipMotion({ ...demo, predictability: 2 }, false)).toBe("full");
  });
  it("high focus keeps Pip still during focus blocks", () => {
    expect(stillDuringFocus(demo)).toBe(true);
    expect(stillDuringFocus({ ...demo, focus: 2 })).toBe(false);
  });
});

describe("outfit unlocks", () => {
  it("only a full off-screen break earns an outfit", () => {
    expect(earnedUnlock({ plannedMin: 5, offscreenSec: 300 })).toBe(true);
    expect(earnedUnlock({ plannedMin: 5, offscreenSec: 120 })).toBe(false);
  });
  it("picks only locked outfits and stops when all are owned", () => {
    const last = outfits[outfits.length - 1];
    const owned = outfits.slice(0, -1).map((o) => o.id);
    expect(pickUnlock(owned, 0.99)).toBe(last.id);
    expect(pickUnlock([], 0)).toBe(outfits[0].id);
    expect(pickUnlock([], 0.999)).toBe(last.id);
    expect(pickUnlock(outfits.map((o) => o.id), 0.5)).toBeNull();
  });
});

describe("zodiac animal", () => {
  it("offers all eight animals and follows the zodiac for a birth year", () => {
    expect(ANIMALS).toHaveLength(8);
    for (let y = 1990; y < 2030; y++) expect(animalForYear(y)).toBe(zodiacAnimal(y));
  });
  it("maps birth years to the twelve animals", () => {
    expect(zodiacAnimal(2020)).toBe("rat");
    expect(zodiacAnimal(2003)).toBe("goat");
    expect(zodiacAnimal(2000)).toBe("dragon");
    expect(zodiacAnimal(1996)).toBe("rat");
    expect(zodiacAnimal(1900)).toBe("rat");
    for (let y = 1990; y < 2030; y++) expect(ANIMALS).toContain(zodiacAnimal(y));
  });
  it("gives years of the animals that are not offered a neighbouring animal", () => {
    expect(zodiacAnimal(2013)).toBe("dragon"); // snake
    expect(zodiacAnimal(2014)).toBe("goat"); // horse
    expect(zodiacAnimal(2018)).toBe("rooster"); // dog
    expect(zodiacAnimal(2019)).toBe("rat"); // pig
  });
});

describe("saved pip profiles", () => {
  it("drops colours, animals and outfits that no longer exist", () => {
    const p = normalisePip({
      colour: "matcha" as never,
      animal: "snake" as never,
      outfit: "backpack" as never,
      unlocked: ["scarf", "party_hat" as never, "cloud" as never],
      outfitColours: { scarf: "red", wings: "red", beret: "nope" } as never,
    });
    expect(p.colour).toBe("peach");
    expect(p.animal).toBe("rabbit");
    expect(normalisePip({ animal: "goat" }).animal).toBe("goat");
    expect(p.outfit).toBeNull();
    expect(p.unlocked).toEqual(["scarf"]);
    expect(p.outfitColours).toEqual({ scarf: "red" });
    expect(normalisePip({ colour: "lavender" as never }).colour).toBe("peach");
  });
});

describe("pip lines", () => {
  it("Pop names the urge, Pip gives a strategy with the time left", () => {
    const l = urgeLines("phone", 6 * 60);
    expect(l.pop).toMatch(/unpredictable-reward pull/);
    expect(l.pip).toMatch(/another room.*6 minutes left, then a break/);
    expect(urgeLines("tab", 50).pip).toMatch(/1 minute left/);
  });
  it("offers another explanation only for content struggle", () => {
    expect(struggleLine("wrong_answers").offerExplain).toBe(true);
    expect(struggleLine("replays").offerExplain).toBe(true);
    expect(struggleLine("overloaded").offerExplain).toBe(false);
  });
});

