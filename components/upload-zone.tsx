"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { processingSteps } from "@/lib/data";
import { views } from "@/lib/dimensions";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function UploadZone({ onDone }: { onDone: (fileName: string) => void }) {
  const { view } = useProfile();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!file) return;
    if (step >= processingSteps.length) {
      const t = setTimeout(() => {
        onDone(file);
        setFile(null);
        setStep(0);
      }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [file, step, onDone]);

  const start = (name?: string) => {
    if (file) return;
    setStep(0);
    setFile(name || "Lecture 4 - How new species form.pdf");
  };

  const label = views.find((v) => v.id === view)?.label;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        start(e.dataTransfer.files?.[0]?.name);
      }}
      className={cn(
        "rounded-3xl border-2 border-dashed p-8 transition-colors duration-150",
        over ? "border-accent bg-accent-soft" : "border-line bg-surface/60",
      )}
    >
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          start(e.target.files?.[0]?.name);
          e.target.value = "";
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {!file ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:text-left"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium">Drop lecture slides, a textbook chapter or a coursework brief</p>
              <p className="text-sm text-muted">PDF, PowerPoint, Word, or a photo of your notes</p>
            </div>
            <button
              onClick={() => input.current?.click()}
              className="h-10 rounded-full border border-line bg-surface px-5 text-sm font-medium hover:border-ink/30"
            >
              Choose a file
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="busy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-live="polite"
          >
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <p className="truncate font-medium">{file}</p>
            </div>
            <Progress value={(Math.min(step, processingSteps.length) / processingSteps.length) * 100} className="mb-6" />
            <ol className="grid gap-3 sm:grid-cols-3">
              {processingSteps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors duration-200",
                      done && "bg-accent-soft text-accent",
                      active && "bg-surface ring-1 ring-line",
                      !done && !active && "text-muted",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-line" />
                    )}
                    <span>
                      {s}
                      {i === 2 && label && <span className="block text-xs opacity-80">{label} layout</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
