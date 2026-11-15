"use client";

import { Lock } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PipFigure } from "@/components/pip/pip-figure";
import {
  OFFERED_ANIMALS,
  animalForYear,
  animalLabel,
  SWATCHES,
  SWATCH_IDS,
  colourways,
  isCustomisable,
  outfitSwatch,
  outfits,
  pipMotion,
  type Animal,
  type Colourway,
  type OutfitId,
  type SwatchId,
} from "@/lib/pip";
import { useHydrated, useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export default function WardrobePage() {
  const hydrated = useHydrated();
  const { pip, setPip, scores, prefs } = useProfile();
  const osReduced = useReducedMotion();
  const motion = pipMotion(scores, !!osReduced || prefs.calmTheme);
  const [preview, setPreview] = useState<"pip" | "pop">("pip");
  const owned = hydrated ? pip.unlocked : [];

  return (
    <AppShell crumb="Pip’s wardrobe" showLayout={false}>
      <h1 className="mb-2 text-4xl font-light tracking-[-0.02em]">Pip&rsquo;s wardrobe</h1>
      <p className="mb-10 max-w-[60ch] text-muted">
        Pip sits quietly in the corner while you study. Finish a whole break away from the screen and a surprise outfit
        unlocks. {owned.length} of {outfits.length} found so far.
      </p>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <section aria-label="Preview" className="rounded-3xl bg-surface p-6 ring-1 ring-line">
          <div className="mb-4 grid h-56 place-items-center rounded-2xl bg-canvas">
            {hydrated && (
              <PipFigure
                colour={pip.colour}
                animal={pip.animal}
                outfit={preview === "pip" ? pip.outfit : null}
                outfitColour={outfitSwatch(pip, pip.outfit)}
                mode={preview}
                face="happy"
                motion={motion}
                size={150}
              />
            )}
          </div>
          <div role="radiogroup" aria-label="Preview" className="mb-3 flex gap-2">
            {(["pip", "pop"] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={preview === m}
                onClick={() => setPreview(m)}
                className={cn(
                  "h-9 flex-1 rounded-full text-sm",
                  preview === m ? "bg-accent-soft font-medium text-accent ring-1 ring-inset ring-accent" : "ring-1 ring-line hover:ring-ink/30",
                )}
              >
                {m === "pip" ? "Pip" : "Pop"}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">
            {preview === "pip"
              ? "Pip cheers on focus and breaks."
              : "Pop is Pip’s cheeky side. Pop names the urge to drift, and Pip answers with a plan."}
          </p>
        </section>

        <div className="space-y-10">
          {OFFERED_ANIMALS.length > 1 && (
          <section>
            <h2 className="mb-1 text-lg font-medium">Animal</h2>
            <p className="mb-4 max-w-[60ch] text-sm text-muted">
              Pip is the animal from your birth year, like the zodiac. Type a year, or just pick any animal.
            </p>
            <label className="mb-4 flex items-center gap-3 text-[15px]">
              Birth year
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                placeholder="e.g. 2003"
                value={hydrated && pip.birthYear ? pip.birthYear : ""}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  if (Number.isInteger(y) && y >= 1900 && y <= 2100) setPip({ birthYear: y, animal: animalForYear(y) });
                  else if (e.target.value === "") setPip({ birthYear: null });
                }}
                className="h-10 w-32 rounded-full bg-surface px-4 ring-1 ring-line focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <div role="radiogroup" aria-label="Pip's animal" className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {OFFERED_ANIMALS.map((a: Animal) => (
                <button
                  key={a}
                  role="radio"
                  aria-checked={hydrated && pip.animal === a}
                  onClick={() => setPip({ animal: a })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl bg-surface p-2 text-sm ring-1",
                    hydrated && pip.animal === a ? "font-medium ring-2 ring-accent" : "ring-line hover:ring-ink/30",
                  )}
                >
                  <PipFigure colour={pip.colour} animal={a} motion="none" size={56} />
                  {animalLabel(a)}
                </button>
              ))}
            </div>
          </section>
          )}

          {Object.keys(colourways).length > 1 && (
          <section>
            <h2 className="mb-4 text-lg font-medium">Colour</h2>
            <div role="radiogroup" aria-label="Pip's colour" className="flex flex-wrap gap-3">
              {(Object.keys(colourways) as Colourway[]).map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={hydrated && pip.colour === c}
                  onClick={() => setPip({ colour: c })}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-full bg-surface pr-5 pl-2 text-[15px] ring-1",
                    hydrated && pip.colour === c ? "font-medium ring-2 ring-accent" : "ring-line hover:ring-ink/30",
                  )}
                >
                  <span aria-hidden className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: colourways[c].body }} />
                  {colourways[c].label}
                </button>
              ))}
            </div>
          </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-medium">Outfits</h2>
            <div role="radiogroup" aria-label="Pip's outfit" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <OutfitTile
                label="No outfit"
                selected={hydrated && pip.outfit === null}
                onSelect={() => setPip({ outfit: null })}
                colour={pip.colour}
                animal={pip.animal}
                outfit={null}
              />
              {outfits.map((o) =>
                owned.includes(o.id) ? (
                  <OutfitTile
                    key={o.id}
                    label={o.label}
                    selected={pip.outfit === o.id}
                    onSelect={() => setPip({ outfit: o.id })}
                    colour={pip.colour}
                    animal={pip.animal}
                    swatch={outfitSwatch(pip, o.id)}
                    outfit={o.id}
                  />
                ) : (
                  <div
                    key={o.id}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface/60 p-4 text-center"
                  >
                    <span className="grid h-[84px] place-items-center">
                      <Lock className="h-6 w-6 text-muted" aria-hidden />
                    </span>
                    <span className="text-sm font-medium">Mystery outfit</span>
                    <span className="text-xs text-muted">Finish a whole off-screen break</span>
                  </div>
                ),
              )}
            </div>
            {hydrated && isCustomisable(pip.outfit) && (
              <div className="mt-6">
                <h3 className="mb-3 text-[15px] font-medium">
                  Colour of the {outfits.find((o) => o.id === pip.outfit)!.label.toLowerCase()}
                </h3>
                <div role="radiogroup" aria-label="Outfit colour" className="flex flex-wrap gap-3">
                  {SWATCH_IDS.map((id: SwatchId) => (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={outfitSwatch(pip, pip.outfit) === id}
                      aria-label={SWATCHES[id].label}
                      title={SWATCHES[id].label}
                      onClick={() => setPip({ outfitColours: { ...pip.outfitColours, [pip.outfit as OutfitId]: id } })}
                      className={cn(
                        "h-10 w-10 rounded-full ring-1 ring-black/10",
                        outfitSwatch(pip, pip.outfit) === id && "ring-2 ring-offset-2 ring-offset-canvas ring-accent",
                      )}
                      style={{ background: SWATCHES[id].fill }}
                    />
                  ))}
                </div>
              </div>
            )}          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium">Pip in the corner</h2>
            <label className="flex max-w-md items-start gap-3 text-[15px]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
                checked={hydrated && !pip.hidden}
                onChange={(e) => setPip({ hidden: !e.target.checked })}
              />
              <span>
                Show Pip while I study
                <span className="block text-sm text-muted">Pip only moves at block starts, breaks and returns, and stays quiet during focus.</span>
              </span>
            </label>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function OutfitTile({
  label,
  selected,
  onSelect,
  colour,
  animal,
  swatch,
  outfit,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  colour: Colourway;
  animal: Animal;
  swatch?: SwatchId;
  outfit: OutfitId | null;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl bg-surface p-4 text-sm ring-1",
        selected ? "font-medium ring-2 ring-accent" : "ring-line hover:ring-ink/30",
      )}
    >
      <PipFigure colour={colour} animal={animal} outfit={outfit} outfitColour={swatch} motion="none" size={76} />
      {label}
    </button>
  );
}

