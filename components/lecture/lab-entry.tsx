import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { lecture } from "@/lib/data";
import { cn } from "@/lib/utils";

/** The hands-on version of the natural selection slide, offered under each layout's title. */
export function LabEntry({ className }: { className?: string }) {
  return (
    <Link
      href={`/lecture/${lecture.slug}/lab`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-line transition-colors duration-150 hover:ring-accent",
        className,
      )}
    >
      <FlaskConical className="h-5 w-5 shrink-0 text-accent" />
      <span className="flex-1">
        <span className="font-medium text-ink">Try it: moth lab</span>
        <span className="block text-sm text-muted">
          Predict, run and explain how natural selection changed the peppered moth. 2 minutes.
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform duration-150 motion-safe:group-hover:translate-x-0.5" />
    </Link>
  );
}
