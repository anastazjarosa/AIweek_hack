import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GeneratedLab } from "@/components/sim/generated-lab";
import { QUESTION_MAX } from "@/lib/sim/api-types";

export const metadata = { title: "New experiment · Mosaic" };

export default async function NewSimPage({ searchParams }: PageProps<"/lab/new">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, QUESTION_MAX);
  if (!q || q.length < 3) redirect("/lab");
  return (
    <AppShell
      showLayout={false}
      crumb={
        <span>
          <Link href="/lab" className="hover:text-ink">
            Simulation Lab
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">New experiment</span>
        </span>
      }
    >
      {/* A new key per question resets the page state. */}
      <GeneratedLab key={q} question={q} />
    </AppShell>
  );
}
