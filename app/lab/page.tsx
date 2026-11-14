import { ArrowRight, Atom, FlaskConical, Leaf } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AskBox } from "@/components/sim/ask-box";
import { lecture } from "@/lib/data";
import { library, subjects } from "@/lib/sim/library";
import { templates, type Subject, type TemplateId } from "@/lib/sim/templates";

export const metadata = { title: "Simulation Lab · Mosaic" };

const icons = { physics: Atom, chemistry: FlaskConical, biology: Leaf } satisfies Record<Subject, unknown>;

type Item = { href: string; title: string; question: string; meta: string };

function items(subject: Subject): Item[] {
  const sims: Item[] = library
    .filter((s) => templates[s.template as TemplateId].subject === subject)
    .map((s) => ({
      href: `/lab/${s.id}`,
      title: s.title,
      question: s.question,
      meta: `${templates[s.template as TemplateId].name} · ${s.minutes} min`,
    }));
  if (subject === "biology") {
    sims.push({
      href: `/lecture/${lecture.slug}/lab`,
      title: "The peppered moth",
      question: "How did a moth change colour in 50 years?",
      meta: "Natural selection · 2 min",
    });
  }
  return sims;
}

export default function LabGallery() {
  return (
    <AppShell crumb="Simulation Lab" showLayout={false}>
      <p className="mb-2 text-sm text-muted">Learn by doing</p>
      <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">Simulation Lab</h1>
      <p className="mb-8 max-w-[62ch] text-ink/75">
        Every experiment works the same way: guess what will happen, run it, then explain why. The models are simple but
        follow the real science, so the results are worth arguing with.
      </p>

      <div className="mb-12">
        <AskBox />
      </div>

      <div className="space-y-12">
        {subjects.map(({ id, label }) => {
          const Icon = icons[id];
          return (
            <section key={id} aria-labelledby={`subject-${id}`}>
              <h2 id={`subject-${id}`} className="mb-4 flex items-center gap-2 text-xl font-medium">
                <Icon className="h-5 w-5 text-accent" aria-hidden /> {label}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items(id).map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-6 transition-colors duration-150 hover:border-accent"
                    >
                      <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">{it.meta}</p>
                      <p className="mb-2 text-lg font-medium">{it.title}</p>
                      <p className="mb-5 text-[15px] text-ink/75">{it.question}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                        Start <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
