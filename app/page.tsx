import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ConceptPreview } from "@/components/concept-preview";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { dimensions } from "@/lib/dimensions";

const steps = [
  { title: "Tell us how you learn", body: "Rate 8 short statements, or set four sliders yourself. No labels, just how you work." },
  { title: "Upload your course", body: "Lecture slides, textbook chapters, coursework briefs. Drop in whatever your module gives you." },
  { title: "Study your way", body: "Notes, flashcards and quizzes in the shape that suits you. Switch any time." },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signin">Set up my layout</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 pt-12 pb-24 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-5">
            <h1 className="mb-6 text-5xl leading-[1.05] font-light tracking-[-0.03em] sm:text-6xl">
              Study material that fits your brain.
            </h1>
            <p className="mb-9 max-w-md text-lg leading-relaxed text-muted">
              Upload your lectures and textbooks. Get notes, flashcards and quizzes shaped around how you focus,
              read and remember.
            </p>
            <Button asChild size="lg">
              <Link href="/signin">
                Set up my layout <ArrowRight />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-muted">Set four needs your way: focus, processing, planning and structure.</p>
          </div>
          <div className="lg:col-span-7">
            <ConceptPreview />
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-[1180px] px-6 py-20">
            <h2 className="mb-12 max-w-xl text-3xl font-light tracking-[-0.02em]">
              Four needs, any mix. Every adaptation follows how you set them.
            </h2>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {dimensions.map((d) => (
                <div key={d.key} className="bg-surface p-8">
                  <p className="mb-4 text-xl font-medium">{d.label}</p>
                  <p className="mb-6 leading-relaxed text-muted">&ldquo;{d.statements[0]}&rdquo;</p>
                  <p className="border-t border-line pt-5 text-sm">
                    <span className="mb-1 block text-accent">When it&rsquo;s high</span>
                    {d.high}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-20 lg:grid-cols-12">
            <h2 className="text-3xl font-light tracking-[-0.02em] lg:col-span-4">How it works</h2>
            <ol className="space-y-0 lg:col-span-8">
              {steps.map((st, i) => (
                <li key={st.title} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line py-7 first:border-t-0 first:pt-0">
                  <span className="text-xl font-light text-accent tabular-nums">{i + 1}</span>
                  <div>
                    <p className="mb-1.5 text-xl font-medium">{st.title}</p>
                    <p className="max-w-lg leading-relaxed text-muted">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand px-10 py-12 text-brand-ink md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-3xl font-light tracking-[-0.02em]">Your next lecture, in your shape.</p>
              <p className="text-brand-ink/80">Takes two minutes to set up. Change it any time.</p>
            </div>
            <Button asChild size="lg" className="bg-surface text-ink hover:bg-canvas">
              <Link href="/signin">
                Set up my layout <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <Logo />
          <p>A study tool that adapts to how you work.</p>
          <p>© 2026 Mosaic · Hackathon demo</p>
        </div>
      </footer>
    </div>
  );
}
