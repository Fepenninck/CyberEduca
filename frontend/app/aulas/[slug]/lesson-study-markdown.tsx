'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowRight, Check, Clock3 } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'
import { API_URL } from '@/lib/api'

type NavigationLesson = { id: string; titulo: string; ordem: number } | null
type Lesson = { id: string; titulo: string; conteudo: string; ordem: number; concluida: boolean; trilha: { id: string; titulo: string }; anterior: NavigationLesson; proxima: NavigationLesson }

const YOUTUBE_IFRAME_PATTERN = /<iframe\b[^>]*\bsrc=["'](https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:\?[^"']*)?)["'][^>]*><\/iframe>\s*/gi

function extractYoutubeEmbeds(conteudo: string) {
  const videos: string[] = []
  const markdown = conteudo.replace(YOUTUBE_IFRAME_PATTERN, (_, src: string) => {
    videos.push(src)
    return ''
  })

  return { markdown, videos }
}

export function LessonStudy({ lessonId }: { lessonId: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLesson() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(API_URL + '/aulas/' + lessonId)
        if (!response.ok) throw new Error('Não foi possível carregar a aula.')
        setLesson(await response.json())
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erro inesperado.')
      } finally {
        setLoading(false)
      }
    }
    loadLesson()
  }, [lessonId])

  async function completeLesson() {
    if (!lesson || lesson.concluida) return
    setSaving(true)
    try {
      const response = await fetch(API_URL + '/aulas/' + lesson.id + '/concluir', { method: 'POST' })
      if (!response.ok) throw new Error('Não foi possível salvar a conclusão.')
      setLesson({ ...lesson, concluida: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="app-shell"><CyberHeader /><p className="content-wrap">Carregando aula...</p></main>
  if (error || !lesson) return <main className="app-shell"><CyberHeader /><p className="content-wrap">{error || 'Aula não encontrada.'}</p></main>
  const { markdown, videos } = extractYoutubeEmbeds(lesson.conteudo)

  return (
    <main className="app-shell">
      <CyberHeader />
      <article className="lesson-content mx-auto">
        <Link href="/trilhas" className="back-link"><ArrowLeft size={16} /> Voltar para trilhas</Link>
        <div className="lesson-topline"><span>{lesson.trilha.titulo}</span><span>Aula {String(lesson.ordem).padStart(2, '0')}</span></div>
        <div className="eyebrow">Aula</div>
        <h1>{lesson.titulo}</h1>
        <div className="lesson-meta"><span><Clock3 size={16} /> Duração a definir</span></div>
        <div className="lesson-divider" />
        <section className="prose-content">
          {videos.map((src) => <div key={src} className="my-8 overflow-hidden rounded-md border border-[#29384d]" style={{ aspectRatio: '16 / 9' }}><iframe src={src} title={`Vídeo da aula: ${lesson.titulo}`} className="block h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>)}
          <ReactMarkdown components={{ img: ({ src, alt }) => <img src={src} alt={alt ?? ''} className="my-8 w-full rounded-md border border-[#29384d]" /> }}>
            {markdown || 'Este conteúdo ainda está em branco. Escreva a sua aula no banco de dados.'}
          </ReactMarkdown>
        </section>
        <div className="lesson-actions">
          <button className={'complete-button ' + (lesson.concluida ? 'is-done' : '')} onClick={completeLesson} disabled={saving || lesson.concluida}>
            {lesson.concluida ? <><Check size={18} /> Aula concluída</> : saving ? 'Salvando...' : 'Marcar como concluída'}
          </button>
          <nav className="lesson-nav-buttons" aria-label="Navegação entre aulas">
            {lesson.anterior && <Link href={'/aulas/' + lesson.anterior.id}><ArrowLeft size={16} /> Anterior</Link>}
            {lesson.proxima && <Link href={'/aulas/' + lesson.proxima.id}>Próxima aula <ArrowRight size={16} /></Link>}
          </nav>
        </div>
      </article>
    </main>
  )
}
