"use client";

import { BarChart3, BookOpen, FlaskConical, LayoutGrid, Shirt, Timer, Upload, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ViewSwitcher } from "@/components/view-switcher";
import { PipBuddy } from "@/components/pip/pip-buddy";
import { SessionLayer } from "@/components/session/session-layer";
import { sessionActions, useSession } from "@/lib/screentime/session";
import { user } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/lab", label: "Simulation Lab", icon: FlaskConical },
  { href: "/dashboard#modules", label: "My modules", icon: BookOpen },
  { href: "/dashboard#upload", label: "Upload", icon: Upload },
  { href: "/summary", label: "Screen time", icon: BarChart3 },
  { href: "/preferences", label: "How I like to learn", icon: UserRound },
  { href: "/wardrobe", label: "Pip’s wardrobe", icon: Shirt },
];

export function AppShell({
  children,
  crumb,
  showLayout = true,
}: {
  children: React.ReactNode;
  crumb?: React.ReactNode;
  /** The lecture layout switch; hidden on pages it doesn't change. */
  showLayout?: boolean;
}) {
  const pathname = usePathname();
  const { view, setView } = useProfile();
  const session = useSession();
  const canStart = !session || ["idle", "done"].includes(session.phase);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 pt-6 pb-28 md:flex">
        <div className="mb-10 px-2">
          <Logo href="/dashboard" />
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }, i) => {
            const active =
              i === 0
                ? pathname === "/dashboard" || pathname.startsWith("/lecture")
                : href === "/lab"
                  ? pathname === "/lab" || pathname.startsWith("/lab/")
                  : pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors duration-150",
                  active ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-muted hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-sm font-medium text-accent">
            MP
          </span>
          <div className="text-sm leading-tight">
            <p className="font-medium">{user.name} Patel</p>
            <p className="text-muted">Year 1 · Biology</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="text-sm text-muted">{crumb}</div>
            <div className="flex flex-wrap items-center gap-3">
              {canStart && (
                <button
                  onClick={sessionActions.openSetup}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-brand-ink hover:bg-brand-hover"
                >
                  <Timer className="h-4 w-4" /> Start focus session
                </button>
              )}
              {showLayout && (
                <>
                  <span className="hidden text-sm text-muted lg:inline">Layout</span>
                  <ViewSwitcher id="app" value={view} onChange={setView} />
                </>
              )}
            </div>
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-10 pb-32">{children}</main>
        <SessionLayer />
        <PipBuddy />
      </div>
    </div>
  );
}
