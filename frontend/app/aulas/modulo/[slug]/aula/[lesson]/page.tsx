import TrackModulePage from "@/app/trilhas/[slug]/page";
export default async function ModuleLessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson } = await params;
  return <TrackModulePage params={Promise.resolve({ slug, lesson })} />;
}
