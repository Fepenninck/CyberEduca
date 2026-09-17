export type Lesson = { slug: string; title: string; duration: string; status: 'completed' | 'current' | 'locked' }
export type Module = { title: string; lessons: Lesson[] }
export type Track = { slug: string; title: string; description: string; difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'; modules: number; lessons: number; duration: string; progress: number; color: string; category: string; modulesData: Module[] }

// Dados visuais temporários. Os mesmos IDs existem no seed do backend para que
// o link da interface abra uma aula real e persistida no PostgreSQL.
export const tracks: Track[] = [{
  slug: 'nova-trilha', title: 'Nova trilha', description: 'Escreva aqui a descrição da sua trilha.',
  difficulty: 'Iniciante', modules: 1, lessons: 1, duration: 'A definir', progress: 0,
  color: '#b7ff2a', category: 'Em construção',
  modulesData: [{ title: 'Novo módulo', lessons: [{ slug: 'nova-aula', title: 'Nova aula', duration: 'A definir', status: 'current' }] }],
}]

export const allLessons = tracks.flatMap((track) => track.modulesData.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, track }))))
export const getTrack = (slug: string) => tracks.find((track) => track.slug === slug)
export const getLesson = (slug: string) => allLessons.find((lesson) => lesson.slug === slug)
export const stats = { completed: 0, inProgress: 0, finished: 0, overall: 0 }
