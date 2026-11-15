"use client";

import { Check, Cpu, Pencil, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiHeaders } from "@/lib/client-api";
import { directionWords, type Direction, type SimSpec } from "@/lib/sim/spec";
import { encodeSpec } from "@/lib/sim/share";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  at: number;
  question: string;
  spec: SimSpec;
  status: "pending" | "approved" | "rejected";
  note?: string;
  model: string;
  verified: { answer: Direction; metric: string; before: string; after: string } | null;
};
const SAMPLE_IDS = new Set(["hammer-and-feather-moon", "warm-yeast-dough"]);
type Edits = { title: string; intro: string; predictionPrompt: string; explanation: string; keyIdeas: string };

/** AI-built experiments waiting for a teacher: approve, reword, or reject before students see them. */
export function ReviewQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [requireApproval, setRequireApproval] = useState(false);
  const [editing, setEditing] = useState<Record<string, Edits>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/teacher/reviews", { headers: apiHeaders() }).catch(() => null);
    if (!res?.ok) return setError("Could not load the review queue.");
    const data = (await res.json()) as { reviews: Item[]; settings: { requireApproval: boolean } };
    setItems(data.reviews);
    setRequireApproval(data.settings.requireApproval);
    setError("");
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const t = window.setInterval(() => void refresh(), 5000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [refresh]);

  const toggle = async () => {
    const next = !requireApproval;
    setRequireApproval(next);
    await fetch("/api/teacher/settings", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ requireApproval: next }) });
  };

  const decide = async (item: Item, action: "approve" | "reject") => {
    const e = editing[item.id];
    const edits = e
      ? { title: e.title, intro: e.intro, predictionPrompt: e.predictionPrompt, explanation: e.explanation, keyIdeas: e.keyIdeas.split("\n").map((k) => k.trim()).filter(Boolean) }
      : undefined;
    const res = await fetch(`/api/teacher/reviews/${item.id}`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ action, note: notes[item.id], ...(action === "approve" && edits ? { edits } : {}) }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setError(data.error ?? "Could not save the decision.");
    setEditing((x) => {
      const next = { ...x };
      delete next[item.id];
      return next;
    });
    await refresh();
  };

  const startEdit = (it: Item) =>
    setEditing((x) => ({
      ...x,
      [it.id]: { title: it.spec.title, intro: it.spec.intro, predictionPrompt: it.spec.prediction.prompt, explanation: it.spec.explanation, keyIdeas: it.spec.keyIdeas.join("\n") },
    }));

  const pending = items.filter((i) => i.status === "pending");
  const done = items.filter((i) => i.status !== "pending");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-[-0.01em]">AI-built experiments</h2>
          <p className="mt-1 max-w-2xl text-muted">
            Every experiment the AI designs lands here, already checked by the engine. Approve it, reword it, or reject it with a note.
          </p>
        </div>
        <button
          onClick={() => void fetch("/api/teacher/reviews", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "sample" }) }).then(refresh)}
          className="h-10 rounded-full px-4 text-sm font-medium ring-1 ring-line hover:ring-accent"
        >
          Add sample AI drafts
        </button>
      </div>

      <label className="mb-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-line">
        <span>
          <span className="block font-medium">Require my approval before students see AI experiments</span>
          <span className="text-sm text-muted">When on, students wait on a “your lecturer is checking this” screen until you approve.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={requireApproval}
          aria-label="Require approval before students see AI experiments"
          onClick={() => void toggle()}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150", requireApproval ? "bg-accent" : "bg-ink/20")}
        >
          <span className={cn("absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-150", requireApproval && "translate-x-5")} />
        </button>
      </label>

      {error && <p role="alert" className="mb-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}

      {pending.length === 0 && <Card className="mb-6 p-8 text-center text-muted">No AI experiments are waiting for review.</Card>}
      <div className="space-y-5">
        {pending.map((it) => {
          const e = editing[it.id];
          return (
            <Card key={it.id} className="p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-mark/70 px-3 py-1 text-xs font-medium">Needs review</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1 text-xs text-muted">
                  <Sparkles className="h-3 w-3" aria-hidden /> Student asked: &ldquo;{it.question}&rdquo;
                </span>
                {SAMPLE_IDS.has(it.spec.id) && <span className="rounded-full bg-ink/5 px-3 py-1 text-xs text-muted">Sample</span>}
              </div>
              {e ? (
                <div className="space-y-3">
                  {(
                    [
                      ["title", "Title", 1],
                      ["intro", "Introduction", 2],
                      ["predictionPrompt", "Prediction question", 2],
                      ["explanation", "Explanation", 4],
                      ["keyIdeas", "Key ideas (one per line)", 3],
                    ] as const
                  ).map(([k, label, rows]) => (
                    <label key={k} className="block">
                      <span className="mb-1 block text-sm font-medium">{label}</span>
                      <textarea
                        rows={rows}
                        value={e[k]}
                        onChange={(ev) => setEditing((x) => ({ ...x, [it.id]: { ...x[it.id], [k]: ev.target.value } }))}
                        className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-[15px] focus:border-accent focus:outline-none"
                      />
                    </label>
                  ))}
                  <p className="text-sm text-muted">The model, sliders and prediction stay as the engine verified them; your edits are re-checked before saving.</p>
                </div>
              ) : (
                <>
                  <h3 className="mb-1 text-xl font-medium">{it.spec.title}</h3>
                  <p className="mb-3 text-ink/80">{it.spec.intro}</p>
                  <p className="mb-1 text-sm font-medium">Prediction</p>
                  <p className="mb-3 text-[15px]">{it.spec.prediction.prompt}</p>
                  <p className="mb-1 text-sm font-medium">Explanation</p>
                  <p className="mb-3 text-[15px] text-ink/85">{it.spec.explanation}</p>
                  <ul className="mb-3 flex flex-wrap gap-2">
                    {it.spec.keyIdeas.map((k) => (
                      <li key={k} className="rounded-full px-3 py-1 text-sm ring-1 ring-line">{k}</li>
                    ))}
                  </ul>
                </>
              )}
              {it.verified && (
                <p className="mt-2 flex items-center gap-2 rounded-2xl bg-accent-soft px-4 py-2.5 text-sm">
                  <Cpu className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>
                    <span className="font-medium">Engine-verified on the {it.model.toLowerCase()} model:</span> {it.verified.metric.toLowerCase()} {directionWords[it.verified.answer]} ({it.verified.before} → {it.verified.after}).
                  </span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => void decide(it, "approve")}>
                  <Check /> {e ? "Save edits and approve" : "Approve"}
                </Button>
                {!e && (
                  <Button size="sm" variant="secondary" onClick={() => startEdit(it)}>
                    <Pencil /> Edit wording
                  </Button>
                )}
                <Link href={`/lab/s?d=${encodeSpec(it.spec)}`} target="_blank" className="h-9 rounded-full px-4 text-sm leading-9 font-medium text-accent hover:underline">
                  Try it as a student
                </Link>
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`note-${it.id}`}>
                    Note for the student
                  </label>
                  <input
                    id={`note-${it.id}`}
                    value={notes[it.id] ?? ""}
                    onChange={(ev) => setNotes((x) => ({ ...x, [it.id]: ev.target.value }))}
                    placeholder="Note (needed to reject)"
                    className="h-9 w-48 rounded-full border border-line bg-surface px-3 text-sm focus:border-accent focus:outline-none"
                  />
                  <Button size="sm" variant="ghost" disabled={!notes[it.id]?.trim()} onClick={() => void decide(it, "reject")}>
                    <X /> Reject
                  </Button>
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-muted">Decided</h3>
          <ul className="space-y-2">
            {done.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-line">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", it.status === "approved" ? "bg-accent-soft text-accent" : "bg-clay/10 text-clay")}>
                  {it.status === "approved" ? "Approved" : "Rejected"}
                </span>
                <span className="font-medium">{it.spec.title}</span>
                {it.note && <span className="text-muted">· {it.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
