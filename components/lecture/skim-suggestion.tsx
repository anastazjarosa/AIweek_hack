"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { shouldSuggestSprints, skimEvidence, wordCount, type Read } from "@/lib/adapt";
import { lecture } from "@/lib/data";
import { useProfile } from "@/lib/profile";

// Asked at most once per page load, whatever the answer.
let asked = false;

/**
 * Watches how long each notes section stays on screen before it is scrolled past, and offers
 * the Sprints layout when most recent sections were skimmed. The student decides.
 */
export function SkimSuggestion({ simplify }: { simplify: boolean }) {
  const { setView } = useProfile();
  const [reads, setReads] = useState<Read[]>([]);
  const [closed, setClosed] = useState(asked);

  useEffect(() => {
    const words = new Map(
      lecture.sections.map((s) => [s.id, wordCount(simplify ? s.points.join(" ") : s.body)]),
    );
    const entered = new Map<string, number>();
    const passed = new Set<string>();
    // The top margin matches the sticky header, so text hidden behind it counts as passed.
    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const e of entries) {
          const id = e.target.id;
          if (e.isIntersecting) {
            if (!entered.has(id)) entered.set(id, now);
          } else if (e.boundingClientRect.top < 0 && entered.has(id) && !passed.has(id)) {
            passed.add(id);
            const read = { words: words.get(id) ?? 0, seconds: (now - entered.get(id)!) / 1000 };
            setReads((r) => [...r, read]);
          }
        }
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );
    lecture.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [simplify]);

  const open = !closed && shouldSuggestSprints(reads);
  const { spent, needed } = skimEvidence(reads);

  const close = () => {
    asked = true;
    setClosed(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Layout suggestion"
          aria-live="polite"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed right-5 bottom-28 left-5 z-40 rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-line sm:left-auto sm:w-[360px]"
        >
          <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Noticed while you read</p>
          <p className="mb-1 text-lg font-medium">You&rsquo;re moving through the notes quickly.</p>
          <p className="mb-5 text-sm text-ink/75">
            About {spent} s on sections that take about {needed} s to read. Short cards with a quick check might suit
            this better.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                close();
                setView("sprints");
                window.scrollTo({ top: 0 });
              }}
            >
              Try Sprints
            </Button>
            <Button variant="ghost" onClick={close}>
              No thanks
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
