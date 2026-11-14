"use client";

import { Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lecture } from "@/lib/data";
import { taskLabels } from "@/lib/screentime/planner";
import { fmtMinutes, reasonLabels, sessionActions, useSession, type Session } from "@/lib/screentime/session";

/** Shape a backend would return from GET /session/{id}/screentime. */
function screentimeSummary(s: Session) {
  return {
    session_id: s.id,
    started_at: s.startedAt,
    needs: s.needs,
    daily_cap_min: s.capMin,
    active_screen_sec: Math.round(s.screenSec),
    offscreen_learning_sec: Math.round(s.offscreenSec),
    blocks: s.blocks.map((b) => ({
      n: b.n,
      planned_min: b.plannedMin,
      active_sec: Math.round(b.activeSec),
      ended_by: b.endedBy ?? "in_progress",
      snoozed: b.snoozed,
      recall_score: b.recall ? `${b.recall.correct}/${b.recall.total}` : null,
    })),
    breaks: s.breaks.map((br) => ({
      after_block: br.afterBlock,
      kind: br.kind,
      trigger_reason: br.reason,
      task_type: br.taskType,
      offscreen_sec: Math.round(br.offscreenSec),
    })),
  };
}

export default function SummaryPage() {
  const s = useSession();
  const started = s && s.blocks.length > 0;
  return (
    <AppShell crumb="Screen time">
      <h1 className="mb-2 text-4xl font-light tracking-[-0.02em]">Screen time</h1>
      <p className="mb-10 text-muted">How today&rsquo;s session split between the screen and learning away from it.</p>
      {!started ? (
        <Card className="flex flex-col items-start gap-4 p-8">
          <p className="text-lg">No session yet today.</p>
          <Button onClick={sessionActions.openSetup}>
            <Timer /> Start focus session
          </Button>
        </Card>
      ) : (
        <Summary s={s} />
      )}
    </AppShell>
  );
}

function Summary({ s }: { s: Session }) {
  const total = s.screenSec + s.offscreenSec || 1;
  const snoozes = s.blocks.filter((b) => b.snoozed).length;
  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm text-muted">On screen, actively studying</p>
            <p className="text-4xl font-light">{fmtMinutes(s.screenSec)}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted">Off-screen learning</p>
            <p className="text-4xl font-light text-accent">{fmtMinutes(s.offscreenSec)}</p>
          </div>
        </div>
        <div className="mb-3 flex h-4 overflow-hidden rounded-full bg-ink/5" aria-hidden>
          <span className="h-full bg-ink/70" style={{ width: `${(s.screenSec / total) * 100}%` }} />
          <span className="h-full bg-accent" style={{ width: `${(s.offscreenSec / total) * 100}%` }} />
        </div>
        <p className="text-sm text-muted">
          {s.blocks.length} focus blocks · {s.breaks.length} breaks taken · {snoozes} snoozed · limit {s.capMin} min
          {s.speed > 1 && ` · demo clock ${s.speed}×`}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-4 font-medium">Focus blocks</p>
          <ol className="divide-y divide-line">
            {s.blocks.map((b) => (
              <li key={b.n} className="flex items-center justify-between py-3 text-[15px]">
                <span>
                  <span className="mr-2 text-accent tabular-nums">{b.n}.</span>
                  {lecture.sections.find((x) => x.id === b.sectionId)?.title}
                  <span className="block text-sm text-muted">
                    {fmtMinutes(b.activeSec)} of {b.plannedMin} min · {b.endedBy === "early" ? "ended early" : b.endedBy ?? "in progress"}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{b.recall ? `Recall ${b.recall.correct}/${b.recall.total}` : "—"}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-6">
          <p className="mb-4 font-medium">Breaks</p>
          {s.breaks.length === 0 ? (
            <p className="text-muted">No breaks yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {s.breaks.map((br, i) => (
                <li key={i} className="py-3 text-[15px]">
                  <span className="flex justify-between">
                    <span>{br.taskType === "final_summary" ? "Off-screen summary" : taskLabels[br.taskType]}</span>
                    <span className="text-sm text-muted tabular-nums">{fmtMinutes(br.offscreenSec)} away</span>
                  </span>
                  <span className="text-sm text-muted">
                    After block {br.afterBlock} · {br.kind} · {reasonLabels[br.reason]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <details className="rounded-3xl border border-line bg-surface p-6">
        <summary className="cursor-pointer font-medium">Session log (GET /session/{s.id}/screentime)</summary>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-canvas p-4 text-xs leading-relaxed">
          {JSON.stringify(screentimeSummary(s), null, 2)}
        </pre>
      </details>
    </div>
  );
}
