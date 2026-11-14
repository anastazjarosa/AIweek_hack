"use client";

import { BarChart3, BookOpen, LayoutGrid, Timer, Upload, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { SessionLayer } from "@/components/session/session-layer";
import { sessionActions, useSession } from "@/lib/screentime/session";
import { user } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard#modules", label: "My modules", icon: BookOpen },
  { href: "/dashboard#upload", label: "Upload", icon: Upload },
  { href: "/summary", label: "Screen time", icon: BarChart3 },
  { href: "/onboarding", label: "Profile", icon: UserRound },
];

export function AppShell({ children, crumb }: { children: React.ReactNode; crumb?: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, setProfile } = useProfile();
  const session = useSession();
  const canStart = !session || ["idle", "done"].includes(session.phase);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <div className="mb-10 px-2">
          <Logo href="/dashboard" />
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }, i) => {
            const active = i === 0 ? pathname === "/dashboard" || pathname.startsWith("/lecture") : pathname === href;
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
            <p className="text-muted">Year 2 · Medicine</p>
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
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-[#185a49]"
                >
                  <Timer className="h-4 w-4" /> Start focus session
                </button>
              )}
              <span className="hidden text-sm text-muted lg:inline">Viewing as</span>
              <ProfileSwitcher id="app" value={profile} onChange={setProfile} />
            </div>
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-10 pb-32">{children}</main>
        <SessionLayer />
      </div>
    </div>
  );
}
