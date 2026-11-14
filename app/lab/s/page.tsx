import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SimLab } from "@/components/sim/sim-lab";
import { Card } from "@/components/ui/card";
import { MAX_SHARE_LENGTH, decodeSpec } from "@/lib/sim/share";
import { checkSpec } from "@/lib/sim/spec";

export const metadata = { title: "Shared experiment · Mosaic" };

/** Opens a simulation whose spec is in the link (from the agent, MCP or a classmate). */
export default async function SharedSimPage({ searchParams }: PageProps<"/lab/s">) {
  const raw = (await searchParams).d;
  const d = Array.isArray(raw) ? raw[0] : raw;
  const check = d && d.length <= MAX_SHARE_LENGTH ? checkSpec(decodeSpec(d)) : null;
  return (
    <AppShell
      showLayout={false}
      crumb={
        <span>
          <Link href="/lab" className="hover:text-ink">
            Simulation Lab
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{check?.ok ? check.spec.title : "Shared experiment"}</span>
        </span>
      }
    >
      {check?.ok ? (
        <SimLab spec={check.spec} />
      ) : (
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <p className="mb-2 text-lg font-medium">This experiment link doesn&rsquo;t work.</p>
          <p className="mb-6 text-ink/80">It may have been cut short when it was copied.</p>
          <Link href="/lab" className="font-medium text-accent underline-offset-4 hover:underline">
            Go to the Simulation Lab
          </Link>
        </Card>
      )}
    </AppShell>
  );
}
