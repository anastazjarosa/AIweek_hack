import { Activity, ArrowRight, CalendarDays, Check, FlaskConical, Lock, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { ConceptPreview } from "@/components/concept-preview";
import { LearningLoop } from "@/components/home/learning-loop";
import { DropTest } from "@/components/landing/drop-test";
import { LearnerShowcase } from "@/components/landing/learner-showcase";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { LoopStage } from "@/lib/home";

const pillars = [
  {
    icon: FlaskConical,
    kicker: "Learn by doing",
    title: "Ask any science question. Get an experiment.",
    body: "The AI picks a tested physics, chemistry or biology model and builds a predict, run and explain experiment around your question. The model does the maths, so the answer is always right.",
    example: ["“Why does milk go off faster when it’s warm?”", "→ Reaction rate lab: 25 °C vs 35 °C"],
  },
  {
    icon: Activity,
    kicker: "Knows you",
    title: "Learns how you study from what you do.",
    body: "No labels, no quiz about your brain. Mosaic notices how long you focus, whether you dig deep or skim, and where your answers slip, and shows you the evidence.",
    example: ["“You focus best in blocks of about 10 minutes.”", "5 focus blocks; 4 ended early with a break."],
  },
  {
    icon: CalendarDays,
    kicker: "Plans your path",
    title: "Add exam dates. Get a plan that fits.",
    body: "Sessions sized to your focus span, extra time on weak topics, and a coach for the hard part: starting. Two minutes is enough to begin.",
    example: ["Physics exam in 12 days", "Today: Practise forces · 10 min"],
  },
];

const loopExample: LoopStage[] = [
  { id: "know", label: "Knows you", verb: "Profile", status: "Focus ~10 min", href: "/profile", empty: false },
  { id: "learn", label: "Learn by doing", verb: "Lab and lessons", status: "7 experiments this week", href: "/lab", empty: false },
  { id: "results", label: "Shows weak spots", verb: "Results", status: "Forces needs work", href: "/profile", empty: false },
  { id: "plan", label: "Plans your path", verb: "Planner", status: "Physics exam in 12 days", href: "/planner", empty: false },
];

const compare: [string, string, string][] = [
  ["What you get", "Summaries of your documents", "Experiments you run yourself"],
  ["How it teaches", "The same way for everyone", "Adapts to what works for you"],
  ["Planning", "None", "Exam plan and habit coaching"],
  ["Relationship", "A tool you open", "A companion that follows your progress"],
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden h-9 items-center rounded-full px-4 text-sm text-muted hover:text-ink sm:inline-flex">
            How it works
          </a>
          <Button asChild variant="ghost" size="sm">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signin">Start learning</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero: the product proves itself in the first ten seconds. */}
        <section className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 pt-8 pb-20 sm:px-6 lg:grid-cols-12 lg:pt-16">
          <div aria-hidden className="pointer-events-none absolute -top-10 right-0 -z-10 h-[520px] w-[520px] rounded-full bg-glow/30 blur-3xl" />
          <div className="lg:col-span-5">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface/70 px-3 py-1.5 text-sm text-ink ring-1 ring-line">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden /> No labels. No quiz about your brain.
            </p>
            <h1 className="mb-6 text-[44px] leading-[1.03] font-light tracking-[-0.035em] sm:text-6xl">
              It learns how you learn.
              <br />
              <span className="text-accent">Then teaches that way.</span>
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-ink/75">
              Deep diver or quick answers, hands-on or listener: Mosaic notices from what you do, then reshapes every lesson,
              experiment and study plan to fit. Try a lesson on the right.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signin">
                  Start learning <ArrowRight />
                </Link>
              </Button>
              <a href="#how" className="inline-flex h-12 items-center px-3 font-medium text-ink underline-offset-4 hover:underline">
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" aria-hidden /> Never diagnoses
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-accent" aria-hidden /> Your data stays on your device
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <DropTest />
          </div>
        </section>

        <section id="learners" className="scroll-mt-8 border-t border-line bg-surface/40">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
            <p className="mb-3 text-sm font-medium text-accent">One lesson, every kind of learner</p>
            <h2 className="mb-4 max-w-3xl text-3xl leading-tight font-light tracking-[-0.02em] sm:text-4xl">
              Some people need the why. Some need the gist. Some need to try it first.
            </h2>
            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-ink/75">
              Pick a way of learning and watch the same lesson change shape. Most people are a mix, and it changes week to week,
              so Mosaic follows what you actually do, never a fixed label.
            </p>
            <LearnerShowcase />
          </div>
        </section>

        <section id="how" className="scroll-mt-8 border-t border-line">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
            <p className="mb-3 text-sm font-medium text-accent">Three things, working together</p>
            <h2 className="mb-12 max-w-2xl text-3xl leading-tight font-light tracking-[-0.02em] sm:text-4xl">
              It teaches by doing, gets to know you, and plans the way. Each part makes the others better.
            </h2>
            <div className="grid gap-5 lg:grid-cols-3">
              {pillars.map((p, i) => (
                <article key={p.kicker} className="flex flex-col rounded-[28px] border border-line bg-surface p-7">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                      <p.icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="text-sm font-light text-muted tabular-nums">0{i + 1}</span>
                  </div>
                  <p className="mb-1 text-xs font-medium tracking-[0.08em] text-accent uppercase">{p.kicker}</p>
                  <h3 className="mb-3 text-xl leading-snug font-medium">{p.title}</h3>
                  <p className="mb-6 leading-relaxed text-ink/75">{p.body}</p>
                  <div className="mt-auto rounded-2xl bg-canvas/70 px-4 py-3 text-[15px]">
                    <p className="font-medium">{p.example[0]}</p>
                    <p className="text-muted">{p.example[1]}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
            <p className="mb-3 text-sm font-medium text-accent">The learning loop</p>
            <h2 className="mb-10 max-w-2xl text-3xl leading-tight font-light tracking-[-0.02em] sm:text-4xl">
              Your profile shapes the lesson. Your results reshape the plan. Then it goes round again.
            </h2>
            <LearningLoop stages={loopExample} current="learn" interactive={false} />
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="mb-3 text-sm font-medium text-accent">Same lecture, your shape</p>
              <h2 className="mb-4 text-3xl leading-tight font-light tracking-[-0.02em] sm:text-4xl">Read it, hear it, sprint it, or keep it predictable.</h2>
              <p className="leading-relaxed text-ink/75">
                Every lecture comes in four layouts. Pick one, or let Mosaic suggest a switch when it notices you skimming. It
                never changes anything on its own.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ConceptPreview />
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-6">
            <h2 className="mb-10 max-w-2xl text-3xl leading-tight font-light tracking-[-0.02em] sm:text-4xl">
              Not another tool that summarises your notes.
            </h2>
            <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-line text-sm font-medium sm:text-base">
                <div className="p-4 sm:p-6" />
                <div className="p-4 text-muted sm:p-6">Typical AI study tools</div>
                <div className="bg-accent-soft p-4 text-accent sm:p-6">Mosaic</div>
              </div>
              {compare.map(([k, a, b]) => (
                <div key={k} className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-line text-[14px] last:border-b-0 sm:text-[15px]">
                  <div className="p-4 font-medium sm:p-6">{k}</div>
                  <div className="flex gap-2 p-4 text-muted sm:p-6">
                    <X className="mt-0.5 hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                    {a}
                  </div>
                  <div className="flex gap-2 bg-accent-soft/50 p-4 sm:p-6">
                    <Check className="mt-0.5 hidden h-4 w-4 shrink-0 text-accent sm:block" aria-hidden />
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-6">
          <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[28px] bg-ink px-8 py-12 text-surface sm:px-12 md:flex-row md:items-center">
            <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
            <div className="relative">
              <p className="mb-2 text-3xl font-light tracking-[-0.02em] sm:text-4xl">Your first experiment takes two minutes.</p>
              <p className="text-surface/70">No setup quiz needed. Mosaic learns from what you do.</p>
            </div>
            <Link href="/signin" className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-6 font-medium text-brand-ink hover:bg-brand-hover">
              Start learning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>Learn by doing. Known by what you do. Planned around you.</p>
          <p>© 2026 Mosaic · Hackathon demo</p>
        </div>
      </footer>
    </div>
  );
}
