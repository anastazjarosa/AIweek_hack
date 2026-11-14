import { notFound } from "next/navigation";
import { LectureView } from "@/components/lecture/lecture-view";
import { lecture } from "@/lib/data";

export function generateStaticParams() {
  return [{ slug: lecture.slug }];
}

export default async function LecturePage({ params }: PageProps<"/lecture/[slug]">) {
  const { slug } = await params;
  if (slug !== lecture.slug) notFound();
  return <LectureView />;
}
