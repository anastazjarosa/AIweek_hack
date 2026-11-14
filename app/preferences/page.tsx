"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { dimensions, levelFor, personas, scaleLabels, views, type Format } from "@/lib/dimensions";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const formats: { id: Format; label: string }[] = [
  { id: null, label: "No preference" },
  { id: "audio", label: "Audio" },
  { id: "visual", label: "Visual" },
  { id: "text", label: "Text" },
];

export default function PreferencesPage() {
  const { scores, prefs, view, setScores, setPrefs } = useProfile();
  return (
    <AppShell crumb="How I like to learn">
      <h1 className="mb-2 text-4xl font-light tracking-[-0.02em]">How I like to learn</h1>
      <p className="mb-10 max-w-xl text-muted">
        Four needs, any mix. Changes apply straight away. Your settings always win over our defaults.
      </p>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-7 lg:col-span-7">
          <ul className="space-y-8">
            {dimensions.map((d) => (
              <li key={d.key}>
                <div className="mb-1 flex items-baseline justify-between">
                  <label htmlFor={`dim-${d.key}`} className="text-lg font-medium">
                    {d.label}
                  </label>
                  <span className="text-sm text-muted tabular-nums">
                    {scores[d.key]} / 4 · {levelFor(scores[d.key])}
                  </span>
                </div>
                <p className="mb-3 text-sm text-muted">
                  &ldquo;{d.statements[0]}&rdquo; &ldquo;{d.statements[1]}&rdquo;
                </p>
                <input
                  id={`dim-${d.key}`}
                  type="range"
                  min={0}
                  max={4}
                  step={0.5}
                  value={scores[d.key]}
                  onChange={(e) => setScores({ ...scores, [d.key]: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>{scaleLabels[0]}</span>
                  <span>{scaleLabels[4]}</span>
                </div>
                {levelFor(scores[d.key]) === "high" && <p className="mt-2 text-sm text-accent">{d.high}</p>}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <Card className="p-7">
            <p className="mb-4 font-medium">Preferences (optional)</p>
            <p className="mb-2 text-sm text-muted">Format</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {formats.map((f) => (
                <button
                  key={f.label}
                  aria-pressed={prefs.format === f.id}
                  onClick={() => setPrefs({ format: f.id })}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm font-medium",
                    prefs.format === f.id ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent" : "bg-canvas hover:bg-accent-soft",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Toggle label="Voice input" hint="Answer and take notes by speaking." on={prefs.voiceInput} onChange={(v) => setPrefs({ voiceInput: v })} />
            <Toggle label="Calm theme" hint="Softer colours and no motion." on={prefs.calmTheme} onChange={(v) => setPrefs({ calmTheme: v })} />
            <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
              Lectures open in the <span className="font-medium text-ink">{views.find((v) => v.id === view)?.label}</span> layout.
              When two needs compete, we choose the calmer layout.
            </p>
          </Card>

          <Card className="p-7">
            <p className="mb-1 font-medium">Demo personas</p>
            <p className="mb-4 text-sm text-muted">Load a set of scores to show how adaptations change.</p>
            <ul className="space-y-2">
              {personas.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setScores(p.scores)}
                    className="w-full rounded-2xl bg-canvas px-4 py-3 text-left text-sm hover:bg-accent-soft"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/onboarding" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
              <RotateCcw className="h-4 w-4" /> Rate the 8 statements again
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="mb-3 flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-sm text-muted">{hint}</span>
      </span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-accent" : "bg-ink/15")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
