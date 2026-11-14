"use client";

import { Lock } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PipFigure } from "@/components/pip/pip-figure";
import { colourways, outfits, pipMotion, type Colourway, type OutfitId } from "@/lib/pip";
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
                outfit={preview === "pip" ? pip.outfit : null}
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

          <section>
            <h2 className="mb-4 text-lg font-medium">Outfits</h2>
            <div role="radiogroup" aria-label="Pip's outfit" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <OutfitTile
                label="No outfit"
                selected={hydrated && pip.outfit === null}
                onSelect={() => setPip({ outfit: null })}
                colour={pip.colour}
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
          </section>

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
  outfit,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  colour: Colourway;
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
      <PipFigure colour={colour} outfit={outfit} motion="none" size={76} />
      {label}
    </button>
  );
}
