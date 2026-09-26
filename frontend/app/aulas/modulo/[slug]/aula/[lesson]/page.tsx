import { LessonStudy } from '@/app/aulas/[slug]/lesson-study-markdown'

export default async function ModuleLessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson } = await params
  return <LessonStudy lessonId={lesson} moduleId={slug} />
}
