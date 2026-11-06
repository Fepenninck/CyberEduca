export function courseButtonLabel(percent: number, started: boolean): string {
  return percent >= 100 ? 'Concluída' : percent > 0 || started ? 'Continuar trilha' : 'Ver trilha'
}
export function markCourseStarted(id: string, lessonId: string) {
  try { localStorage.setItem(`cybereduca-started-${id}`, lessonId); window.dispatchEvent(new Event('course-progress-updated')) } catch { /* A leitura continua sem armazenamento. */ }
}
