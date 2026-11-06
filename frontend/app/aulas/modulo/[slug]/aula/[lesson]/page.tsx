import { LessonStudy } from "@/app/aulas/[slug]/lesson-study-markdown";
import { LibraryCourse } from "@/components/activities/library-course";

export default async function ModuleLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson } = await params;
  if (slug.startsWith("biblioteca-"))
    return (
      <LibraryCourse key={`${slug}-${lesson}`} id={slug} lessonId={lesson} />
    );
  return <LessonStudy lessonId={lesson} moduleId={slug} />;
}
