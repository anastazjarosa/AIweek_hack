import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SimLab } from "@/components/sim/sim-lab";
import { findSim, library } from "@/lib/sim/library";

export function generateStaticParams() {
  return library.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/lab/[id]">) {
  const spec = findSim((await params).id);
  return { title: spec ? `${spec.title} · Mosaic` : "Simulation Lab · Mosaic" };
}

export default async function SimPage({ params }: PageProps<"/lab/[id]">) {
  const spec = findSim((await params).id);
  if (!spec) notFound();
  return (
    <AppShell
      showLayout={false}
      crumb={
        <span>
          <Link href="/lab" className="hover:text-ink">
            Simulation Lab
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{spec.title}</span>
        </span>
      }
    >
      <SimLab spec={spec} />
    </AppShell>
  );
}
