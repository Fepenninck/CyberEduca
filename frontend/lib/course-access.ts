import { libraryCourses } from './course-library'
import { apiFetch, type TrackSummary } from './api'

export function unlockedLearningCourses(tracks: TrackSummary[], read: (key: string) => string | null): string[] {
  const unlocked: string[] = []
  for (const level of ['BASICO', 'INTERMEDIARIO', 'AVANCADO'] as const) {
    for (const track of tracks.filter(t => t.nivel === level && t.totalAulas > 0)) {
      if (track.bloqueada) return unlocked
      unlocked.push(track.id)
      if (track.percentual < 100) return unlocked
    }
    for (const course of libraryCourses.filter(c => c.level === level)) {
      unlocked.push(course.id)
      let completed: unknown
      try { completed = JSON.parse(read(`cybereduca-library-${course.id}`) || '[]') } catch { return unlocked }
      if (!Array.isArray(completed) || !course.lessons.every(lesson => completed.includes(lesson.id))) return unlocked
    }
  }
  return unlocked
}

export async function loadLearningAccess(): Promise<string[]> {
  const response = await apiFetch('/trilhas', { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível verificar o progresso das trilhas. Entre na sua conta e tente novamente.')
  const tracks: TrackSummary[] = await response.json()
  return unlockedLearningCourses(tracks, key => localStorage.getItem(key))
}
export function unlockedLibraryCourses(read: (key: string) => string | null): string[] {
  const unlocked: string[] = []
  for (const course of libraryCourses) {
    unlocked.push(course.id)
    let completed: unknown
    try { completed = JSON.parse(read(`cybereduca-library-${course.id}`) || '[]') } catch { break }
    if (!Array.isArray(completed) || !course.lessons.every(lesson => completed.includes(lesson.id))) break
  }
  return unlocked
}
