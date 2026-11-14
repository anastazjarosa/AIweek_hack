"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PipFigure } from "@/components/pip/pip-figure";
import { Button } from "@/components/ui/button";
import { outfitLabel, type Colourway, type OutfitId, type PipMotion } from "@/lib/pip";

/** Blind-box opening for an outfit earned by finishing a whole off-screen break. */
export function OutfitReveal({
  outfit,
  colour,
  motion: level,
  onWear,
  onLater,
}: {
  outfit: OutfitId;
  colour: Colourway;
  motion: PipMotion;
  onWear: () => void;
  onLater: () => void;
}) {
  const [open, setOpen] = useState(false);
  const still = level === "none";
  const openRef = useRef<HTMLButtonElement>(null);
  const wearRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (open ? wearRef : openRef).current?.focus();
  }, [open]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal aria-labelledby="reveal-title" className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-xl">
        <p className="mb-1 text-sm font-medium text-accent">You finished a whole break off-screen</p>
        <h2 id="reveal-title" className="mb-6 text-2xl font-light tracking-[-0.01em]">
          {open ? `Pip got a ${outfitLabel(outfit).toLowerCase()}!` : "A surprise for Pip"}
        </h2>

        <div className="relative mx-auto mb-8 grid h-44 w-44 place-items-center" aria-live="polite">
          {open ? (
            <motion.div
              initial={still ? false : { opacity: 0, y: 24, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1.2] }}
            >
              <PipFigure colour={colour} outfit={outfit} face="joy" motion={level} size={140} />
            </motion.div>
          ) : (
            <motion.div
              animate={still ? undefined : { rotate: [0, -4, 4, -3, 3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.4 }}
              className="relative h-32 w-32"
              aria-label="A closed mystery box"
              role="img"
            >
              <div className="absolute inset-x-0 bottom-0 h-24 rounded-2xl bg-brand ring-2 ring-accent/60" />
              <div className="absolute inset-x-[-6px] top-2 h-8 rounded-xl bg-[#c8621e] ring-2 ring-accent/60" />
              <div className="absolute inset-y-2 left-1/2 w-4 -translate-x-1/2 bg-mark" />
              <span className="absolute inset-x-0 bottom-6 text-center text-4xl font-medium text-brand-ink">?</span>
            </motion.div>
          )}
        </div>

        {open ? (
          <div className="flex justify-center gap-2">
            <Button ref={wearRef} onClick={onWear}>
              Wear it now
            </Button>
            <Button variant="secondary" onClick={onLater}>
              Save for later
            </Button>
          </div>
        ) : (
          <Button ref={openRef} size="lg" onClick={() => setOpen(true)}>
            Open the box
          </Button>
        )}
      </div>
    </div>
  );
}
