"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { apiHeaders } from "@/lib/client-api";
import type { Escalation } from "@/lib/teacher/store";

type LogEntry = { at: number; session: string; agent: string; event: string; detail?: string };
const triggerLabel: Record<Escalation["trigger"], string> = {
  high_stakes: "High-stakes decision",
  ambiguous: "Ambiguous edge case",
  circular: "Repeated impasse",
  low_confidence: "Low evidence confidence",
  agent_requested: "Coach requested review",
};

export default function TeacherReviewPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/escalations", { headers: apiHeaders() });
      if (!response.ok) throw new Error("Could not load the review queue.");
      const data = (await response.json()) as { escalations: Escalation[]; logs: LogEntry[] };
      setItems(data.escalations);
      setLogs(data.logs);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the review queue.");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const review = async (item: Escalation, action: "answer" | "override" | "resume") => {
    const text = drafts[item.id]?.trim() ?? "";
    if (!text || busy) return;
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/teacher/escalations/${item.id}`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(action === "resume" ? { action, guidance: text } : { action, answer: text }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not submit the review.");
      setDrafts((value) => ({ ...value, [item.id]: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the review.");
    } finally {
      setBusy("");
    }
  };

  return (
    <AppShell crumb="Teacher review">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-accent">Human review</p>
          <h1 className="text-4xl font-light tracking-[-0.02em]">Escalation queue</h1>
          <p className="mt-2 max-w-2xl text-muted">Inspect the saved checkpoint and evidence, then answer, override, or guide the coach and resume.</p>
        </div>
        <button onClick={() => void refresh()} className="h-10 rounded-full px-4 text-sm font-medium ring-1 ring-line hover:ring-accent">Refresh</button>
      </div>

      <p className="mb-5 rounded-2xl bg-accent-soft/70 px-4 py-3 text-sm text-muted">
        Demo review surface: reviewer access is not role-authenticated and queue data is held in server memory. Add school authentication and durable storage before production use.
      </p>
      {error && <p role="alert" className="mb-5 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted">No questions are waiting for review.</Card>
      ) : (
        <div className="space-y-5">
          {items.map((item) => {
            const relatedLogs = logs.filter((entry) => entry.session === item.session);
            return (
              <Card key={item.id} className="p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "open" ? "bg-mark/70 text-ink" : "bg-accent-soft text-accent"}`}>
                    {item.status === "open" ? "Needs review" : `Resolved: ${item.resolution?.action ?? "answered"}`}
                  </span>
                  <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">{triggerLabel[item.trigger]}</span>
                  <span className="ml-auto text-xs text-muted">{new Date(item.at).toLocaleString()}</span>
                </div>
                <h2 className="text-lg font-medium">{item.question}</h2>
                <p className="mt-1 text-sm text-muted">{item.context} · {item.reason}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <section className="rounded-2xl bg-canvas/70 p-4">
                    <h3 className="mb-2 text-sm font-medium">Checkpoint evidence</h3>
                    <p className="text-sm text-muted">Retrieval confidence: {Math.round(item.checkpoint.confidence * 100)}%</p>
                    <ul className="mt-2 list-inside list-disc text-sm">
                      {item.checkpoint.sources.map((source) => <li key={source.id}>{source.title}</li>)}
                      {!item.checkpoint.sources.length && <li>No relevant course sources were found.</li>}
                    </ul>
                    {item.checkpoint.draft && (
                      <div className="mt-3 border-t border-line pt-3">
                        <p className="mb-1 text-xs font-medium text-muted">Coach draft (not sent to the student)</p>
                        <p className="text-sm">{item.checkpoint.draft}</p>
                      </div>
                    )}
                    <details className="mt-3 border-t border-line pt-3">
                      <summary className="cursor-pointer text-sm font-medium">Conversation checkpoint</summary>
                      <ol className="mt-2 space-y-2 text-sm">
                        {item.checkpoint.history.map((turn, index) => (
                          <li key={`${item.id}-${index}`}><span className="font-medium">{turn.role === "user" ? "Student" : "Coach"}:</span> {turn.content}</li>
                        ))}
                      </ol>
                    </details>
                  </section>
                  <section className="rounded-2xl bg-canvas/70 p-4">
                    <h3 className="mb-2 text-sm font-medium">Agent activity</h3>
                    {relatedLogs.length ? (
                      <ul className="space-y-2 text-sm">
                        {relatedLogs.slice(0, 8).map((entry, index) => (
                          <li key={`${entry.at}-${index}`}><span className="font-medium">{entry.agent}:</span> {entry.event}{entry.detail ? ` — ${entry.detail}` : ""}</li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted">No additional activity recorded.</p>}
                  </section>
                </div>

                {item.status === "answered" ? (
                  <div className="mt-4 rounded-2xl bg-accent-soft/60 p-4">
                    <p className="mb-1 text-xs font-medium text-accent">Reviewer response</p>
                    <p className="text-sm">{item.answer}</p>
                    {item.resolution?.guidance && <p className="mt-2 text-sm text-muted">Guidance: {item.resolution.guidance}</p>}
                  </div>
                ) : (
                  <div className="mt-4">
                    <label htmlFor={`review-${item.id}`} className="mb-1.5 block text-sm font-medium">Human answer or coach guidance</label>
                    <textarea
                      id={`review-${item.id}`}
                      value={drafts[item.id] ?? ""}
                      onChange={(event) => setDrafts((value) => ({ ...value, [item.id]: event.target.value }))}
                      maxLength={2000}
                      rows={3}
                      placeholder="Add a grounded answer, correction, or direction for the coach."
                      className="w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-sm focus:border-accent focus:outline-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button disabled={!drafts[item.id]?.trim() || !!busy} onClick={() => void review(item, "answer")} className="h-10 rounded-full bg-brand px-4 text-sm font-medium text-brand-ink disabled:opacity-40">Send human answer</button>
                      <button disabled={!drafts[item.id]?.trim() || !!busy} onClick={() => void review(item, "override")} className="h-10 rounded-full px-4 text-sm font-medium ring-1 ring-line hover:ring-accent disabled:opacity-40">Override coach draft</button>
                      <button disabled={!drafts[item.id]?.trim() || !!busy} onClick={() => void review(item, "resume")} className="h-10 rounded-full px-4 text-sm font-medium ring-1 ring-line hover:ring-accent disabled:opacity-40">Resume coach with guidance</button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
