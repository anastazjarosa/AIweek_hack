"use client";

import { Activity, BarChart3, BookOpen, CalendarDays, FlaskConical, Home, MessagesSquare, Shirt, ShieldCheck, SlidersHorizontal, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConsentGate } from "@/components/consent-gate";
import { Logo } from "@/components/logo";
import { ViewSwitcher } from "@/components/view-switcher";
import { PipBuddy } from "@/components/pip/pip-buddy";
import { SessionLayer } from "@/components/session/session-layer";
import { sessionActions, useSession } from "@/lib/screentime/session";
import { lecture, user } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Home; match: (p: string) => boolean };

// Navigation follows the learning loop: today's step, then learn → know me → plan.
const groups: { label: string | null; items: Item[] }[] = [
  { label: null, items: [{ href: "/dashboard", label: "Today", icon: Home, match: (p) => p === "/dashboard" }] },
  {
    label: "Learn",
    items: [
      { href: `/lecture/${lecture.slug}`, label: "Lectures", icon: BookOpen, match: (p) => p.startsWith("/lecture") },
      { href: "/lab", label: "Simulation Lab", icon: FlaskConical, match: (p) => p === "/lab" || p.startsWith("/lab/") },
    ],
  },
  {
    label: "Know me",
    items: [
      { href: "/profile", label: "What works for me", icon: Activity, match: (p) => p === "/profile" },
      { href: "/preferences", label: "My settings", icon: SlidersHorizontal, match: (p) => p === "/preferences" },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/planner", label: "Study planner", icon: CalendarDays, match: (p) => p === "/planner" },
      { href: "/summary", label: "Focus history", icon: BarChart3, match: (p) => p === "/summary" },
    ],
  },
];
const extras: Item[] = [
  { href: "/teacher", label: "Teacher review", icon: MessagesSquare, match: (p) => p === "/teacher" },
  { href: "/wardrobe", label: "Pip’s wardrobe", icon: Shirt, match: (p) => p === "/wardrobe" },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck, match: (p) => p === "/privacy" },
];
const allItems = [...groups.flatMap((g) => g.items), ...extras];

export function AppShell({
  children,
  crumb,
  showLayout = false,
}: {
  children: React.ReactNode;
  crumb?: React.ReactNode;
  /** The lecture layout switch. Only lecture pages turn it on: it changes nothing elsewhere. */
  showLayout?: boolean;
}) {
  const pathname = usePathname();
  const { view, setView } = useProfile();
  const session = useSession();
  const canStart = !session || ["idle", "done"].includes(session.phase);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 pt-6 pb-28 md:flex">
        <div className="mb-8 px-2">
          <Logo href="/dashboard" />
        </div>
        <nav aria-label="Main" className="space-y-5">
          {groups.map((g) => (
            <div key={g.label ?? "top"}>
              {g.label && <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-muted/80 uppercase">{g.label}</p>}
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <NavLink item={it} active={it.match(pathname)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-0.5 border-t border-line pt-3">
          {extras.map((it) => (
            <NavLink key={it.href} item={it} active={it.match(pathname)} quiet />
          ))}
          <div className="flex items-center gap-3 px-3 pt-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-medium text-accent">MP</span>
            <div className="text-sm leading-tight">
              <p className="font-medium">{user.name} Patel</p>
              <p className="text-xs text-muted">Year 1 · Biology</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="md:hidden">
                <Logo href="/dashboard" />
              </span>
              <div className="hidden truncate text-sm text-muted sm:block">{crumb}</div>
            </div>
            <div className="flex items-center gap-3">
              {showLayout && (
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="text-sm text-muted">Layout</span>
                  <ViewSwitcher id="app" value={view} onChange={setView} />
                </div>
              )}
              {canStart && (
                <button
                  onClick={sessionActions.openSetup}
                  aria-label="Start focus session"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-3 text-sm font-medium text-brand-ink hover:bg-brand-hover sm:h-11 sm:px-4"
                >
                  <Timer className="h-4 w-4" />
                  <span className="hidden sm:inline">Start focus session</span>
                  <span className="sm:hidden">Focus</span>
                </button>
              )}
            </div>
          </div>
          {showLayout && (
            <div className="flex justify-center px-4 pb-2.5 lg:hidden">
              <ViewSwitcher id="app-sm" value={view} onChange={setView} />
            </div>
          )}
          {/* Phones: the sidebar is hidden, so the same links scroll sideways under the header. */}
          <nav aria-label="Main" className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 md:hidden">
            {allItems.map((it) => {
              const Icon = it.icon;
              const active = it.match(pathname);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm",
                    active ? "bg-ink font-medium text-surface" : "text-muted ring-1 ring-line",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 pb-32 sm:px-6 sm:py-10">{children}</main>
        <SessionLayer />
        <PipBuddy />
        {pathname !== "/privacy" && <ConsentGate />}
      </div>
    </div>
  );
}

function NavLink({ item, active, quiet = false }: { item: Item; active: boolean; quiet?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 transition-colors duration-150",
        quiet ? "h-8 text-[13px]" : "h-10 text-[15px]",
        active ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-muted hover:bg-ink/5 hover:text-ink",
      )}
    >
      {active && <span className="absolute top-2 bottom-2 -left-4 w-1 rounded-r-full bg-accent" aria-hidden />}
      <Icon className={quiet ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {item.label}
    </Link>
  );
}
