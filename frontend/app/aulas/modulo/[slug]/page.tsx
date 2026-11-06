import TrackModulePage from "@/app/trilhas/[slug]/page";
import { LibraryCourse } from "@/components/activities/library-course";

export default async function AulaModuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug.startsWith("biblioteca-"))
    return <LibraryCourse key={slug} id={slug} />;
  return <TrackModulePage params={params} />;
}
