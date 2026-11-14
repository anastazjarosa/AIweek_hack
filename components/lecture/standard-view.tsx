"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { LectureTitle } from "@/components/lecture/lecture-view";
import { QuizOption, optionState } from "@/components/lecture/quiz-option";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lecture } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { sessionActions, useSession } from "@/lib/screentime/session";
import { cn } from "@/lib/utils";

const tabs = ["Notes", "Flashcards", "Quiz", "Map"] as const;

export function StandardView() {
  const { prefs } = useProfile();
  const [tab, setTab] = useState<(typeof tabs)[number]>(prefs.format === "visual" ? "Map" : "Notes");
  return (
    <div>
      <LectureTitle />
      <div role="tablist" className="mb-8 flex gap-6 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-[15px] transition-colors duration-150",
              tab === t ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Notes" && <Notes />}
      {tab === "Flashcards" && <Flashcards />}
      {tab === "Quiz" && <Quiz />}
      {tab === "Map" && <ConceptMap />}
    </div>
  );
}

function Notes() {
  // After a weak recall check, the "tutor" switches to the short-sentence version.
  const session = useSession();
  const simplify = !!session?.simplify && session.phase !== "done";
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <nav className="hidden lg:col-span-3 lg:block">
        <ul className="sticky top-24 space-y-2 text-sm">
          {lecture.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-muted hover:text-ink">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-[68ch] space-y-10 lg:col-span-9">
        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
          <p className="mb-3 font-medium">3 key ideas</p>
          <ol className="space-y-2 leading-relaxed">
            {lecture.keyIdeas.map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="text-accent tabular-nums">{i + 1}.</span>
                {k}
              </li>
            ))}
          </ol>
        </section>
        {simplify && (
          <p className="rounded-2xl bg-accent-soft px-5 py-3 text-sm text-accent">
            Simpler wording is on after your last recall check. It switches off when the session ends.
          </p>
        )}
        {lecture.sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="mb-3 text-2xl font-medium">{s.title}</h2>
            {simplify ? (
              <ul className="space-y-2 text-lg leading-relaxed">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed text-ink/85">{s.body}</p>
            )}
          </section>
        ))}
        <section className="border-t border-line pt-6">
          <p className="mb-3 text-sm font-medium">References</p>
          <ul className="space-y-2 text-sm text-muted">
            {lecture.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}

function Flashcards() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = lecture.flashcards[i];
  const go = (d: number) => {
    setFlipped(false);
    setI((x) => (x + d + lecture.flashcards.length) % lecture.flashcards.length);
  };
  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => setFlipped((f) => !f)} className="block w-full text-left" aria-live="polite">
        <Card className={cn("grid min-h-[260px] place-items-center p-10 text-center transition-colors", flipped && "bg-accent-soft")}>
          <div>
            <p className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">{flipped ? "Answer" : "Question"}</p>
            <p className="text-2xl font-light">{flipped ? card.back : card.front}</p>
          </div>
        </Card>
      </button>
      <div className="mt-5 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => go(-1)} aria-label="Previous card">
          <ArrowLeft />
        </Button>
        <span className="text-sm text-muted tabular-nums">
          {i + 1} / {lecture.flashcards.length} · tap card to flip
        </span>
        <Button variant="secondary" size="sm" onClick={() => go(1)} aria-label="Next card">
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function Quiz() {
  const qs = lecture.sections.map((s) => s.check);
  const [picks, setPicks] = useState<(number | null)[]>(qs.map(() => null));
  const answered = picks.filter((p) => p !== null).length;
  const score = picks.filter((p, i) => p === qs[i].answer).length;
  return (
    <div className="max-w-2xl space-y-8">
      {qs.map((q, qi) => (
        <div key={q.q}>
          <p className="mb-3 font-medium">
            {qi + 1}. {q.q}
          </p>
          <div className="space-y-2">
            {q.options.map((o, oi) => (
              <QuizOption
                key={o}
                label={o}
                state={optionState(picks[qi], oi, q.answer)}
                onClick={() => {
                  setPicks((p) => p.map((x, k) => (k === qi ? oi : x)));
                  sessionActions.reportAnswer(oi === q.answer);
                }}
              />
            ))}
          </div>
          {picks[qi] !== null && <p className="mt-2 text-sm text-muted">{q.why}</p>}
        </div>
      ))}
      {answered === qs.length && (
        <Card className="flex items-center justify-between p-6">
          <p className="font-medium">
            You scored {score} / {qs.length}
          </p>
          <Button variant="secondary" size="sm" onClick={() => setPicks(qs.map(() => null))}>
            <RotateCcw /> Retry
          </Button>
        </Card>
      )}
    </div>
  );
}

const groups = [
  { id: "memory", label: "Memory" },
  { id: "stage", label: "Stages" },
  { id: "effect", label: "Effects" },
  { id: "tip", label: "Study tips" },
];

/** Concept map from the seed: one column per level, each node lists where it leads. */
function ConceptMap() {
  const { nodes, edges } = lecture.visualMap;
  const label = (id: string) => nodes.find((n) => n.id === id)?.label;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {groups.map((g) => (
        <div key={g.id}>
          <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{g.label}</p>
          <ul className="space-y-3">
            {nodes
              .filter((n) => n.group === g.id)
              .map((n) => (
                <li key={n.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                  <p className="font-medium">{n.label}</p>
                  {edges
                    .filter((e) => e.from === n.id)
                    .map((e) => (
                      <p key={e.to} className="mt-1 text-sm text-muted">
                        → {e.label ? `${e.label} ` : ""}
                        <span className="text-accent">{label(e.to)}</span>
                      </p>
                    ))}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
