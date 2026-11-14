import type { LessonMaterial } from '@/lib/lesson-material'
import './lesson-sources.css'

export function LessonSources({ lesson }: { lesson: LessonMaterial }) {
  const sources = Array.from(new Map([
    { title: lesson.sourceTitle, url: lesson.source },
    ...(lesson.readings ?? []),
  ].map(source => [source.url, source])).values())

  return (
    <footer className="lesson-sources" aria-label="Fontes e créditos">
      <div>Fontes: {sources.map((source, index) => (
        <span key={source.url}>
          {index > 0 && ' · '}
          <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
        </span>
      ))}</div>
      {lesson.video && <div>Vídeo: <a href={lesson.video.source} target="_blank" rel="noreferrer">NIC.br / Cidadão na Rede</a> · CC BY-ND · Sem edição.</div>}
      <div>Conteúdo e ilustrações didáticas: CyberEduca+. Exemplos fictícios.</div>
    </footer>
  )
}
