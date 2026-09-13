import { LessonStudy } from './lesson-study-markdown'

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LessonStudy lessonId={slug} />
}
