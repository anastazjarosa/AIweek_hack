"use client";

import { Headphones } from "lucide-react";
import { AudioBar } from "@/components/audio-bar";
import { WithTerms } from "@/components/term";
import { lecture } from "@/lib/data";

export function ListenView() {
  return (
    <div className="-mx-6 rounded-[32px] bg-cream px-6 py-10 sm:mx-0 sm:px-12 sm:py-14">
      <div className="mx-auto max-w-[62ch]">
        <p className="mb-2 text-base text-muted">{lecture.moduleShort} · {lecture.minutes} minutes to listen</p>
        <h1 className="mb-6 text-5xl font-light tracking-[-0.02em]">{lecture.title}</h1>
        <div className="mb-4 flex items-center gap-2 text-base font-medium">
          <Headphones className="h-4 w-4 text-accent" /> Listen to the whole lecture
        </div>
        <AudioBar seconds={lecture.minutes * 60} label="the whole lecture" className="mb-4" />
        <p className="mb-14 text-base text-muted">Tip: highlighted words have a plain-English meaning. Hover or tab to them.</p>

        <div className="space-y-16">
          {lecture.sections.map((s) => (
            <section key={s.id}>
              <h2 className="mb-5 text-3xl font-medium tracking-[-0.01em]">{s.title}</h2>
              <AudioBar seconds={s.minutes * 45} label={s.title} contentId={s.id} className="mb-7" />
              <ul className="space-y-5 text-xl leading-[1.9] tracking-[0.015em] [word-spacing:0.08em]">
                {s.points.map((pt) => (
                  <li key={pt} className="flex gap-4">
                    <span aria-hidden className="mt-[0.85em] h-2 w-2 shrink-0 rounded-full bg-accent/60" />
                    <span>
                      <WithTerms text={pt} terms={s.terms} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-3xl bg-surface/70 p-8">
          <h2 className="mb-5 text-2xl font-medium">Key words</h2>
          <dl className="space-y-4 text-lg leading-[1.8]">
            {lecture.sections.flatMap((s) => s.terms).map((t) => (
              <div key={t.term}>
                <dt className="inline rounded-md bg-mark px-1 font-medium">{t.term}</dt>
                <dd className="mt-1 text-ink/80">{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
