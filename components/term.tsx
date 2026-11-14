"use client";

import { useState } from "react";
import type { Term as TermT } from "@/lib/data";

/** Highlighted key term with a plain-English definition on hover or focus. */
export function Term({ term, children }: { term: TermT; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-describedby={open ? `def-${term.term}` : undefined}
        className="rounded bg-mark px-0.5 font-medium text-ink underline decoration-ink/30 decoration-dotted underline-offset-4"
      >
        {children}
      </button>
      {open && (
        <span
          id={`def-${term.term}`}
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-2xl bg-ink px-4 py-3 text-[15px] leading-relaxed font-normal text-white shadow-lg"
        >
          <span className="block text-xs font-medium tracking-wide text-white/70 uppercase">{term.term}</span>
          {term.def}
        </span>
      )}
    </span>
  );
}

/** Wraps any occurrence of the section's terms inside a sentence. */
export function WithTerms({ text, terms }: { text: string; terms: TermT[] }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const t = terms.find((x) => x.term.toLowerCase() === part.toLowerCase());
        return t ? (
          <Term key={i} term={t}>
            {part}
          </Term>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
