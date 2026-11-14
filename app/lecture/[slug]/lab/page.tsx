import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SpacingLab } from "@/components/lab/spacing-lab";
import { lecture } from "@/lib/data";

export function generateStaticParams() {
  return [{ slug: lecture.slug }];
}

export default async function LabPage({ params }: PageProps<"/lecture/[slug]/lab">) {
  const { slug } = await params;
  if (slug !== lecture.slug) notFound();
  return (
    <AppShell
      showLayout={false}
      crumb={
        <span>
          <Link href={`/lecture/${lecture.slug}`} className="hover:text-ink">
            {lecture.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">Spacing lab</span>
        </span>
      }
    >
      <SpacingLab />
    </AppShell>
  );
}
