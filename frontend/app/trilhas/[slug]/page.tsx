'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ClipboardCheck, Clock3, Home, Menu, MonitorPlay, Play, PlayCircle, UserRound } from 'lucide-react'
import { API_URL, TrackDetail } from '@/lib/api'
import { UserMenu } from '@/components/user-menu'
import { DashboardNavigation } from '@/components/dashboard-navigation'

type LessonContent = { id: string; titulo: string; conteudo: string; ordem: number; concluida: boolean }
const youtubePattern = /<iframe\b[^>]*\bsrc=["'](https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:\?[^"']*)?)["'][^>]*><\/iframe>\s*/gi

function splitLessonContent(content: string) {
  const videos: string[] = []
  return { markdown: content.replace(youtubePattern, (_, source: string) => { videos.push(source); return '' }), videos }
}

export function TrackModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [savingCompletion, setSavingCompletion] = useState(false)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    params.then(({ slug }) => fetch(`${API_URL}/trilhas/${slug}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Trilha não encontrada.')
        const loadedTrack: TrackDetail = await response.json()
        setTrack(loadedTrack)
        setSelectedLesson(null)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.'))
    )
  }, [params])

  async function selectLesson(lessonId: string) {
    setLoadingLesson(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/aulas/${lessonId}`)
      if (!response.ok) throw new Error('Não foi possível carregar a aula.')
      setSelectedLesson(await response.json())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro inesperado.')
    } finally {
      setLoadingLesson(false)
    }
  }

  async function completeLesson() {
    if (!displayedLesson || displayedLesson.concluida) return
    setSavingCompletion(true)
    try {
      const response = await fetch(`${API_URL}/aulas/${displayedLesson.id}/concluir`, { method: 'POST' })
      if (!response.ok) throw new Error('Não foi possível confirmar a aula.')
      const result: { percentualTrilha: number } = await response.json()
      setSelectedLesson((lesson) => lesson ? { ...lesson, concluida: true } : lesson)
      setTrack((current) => current ? { ...current, percentual: result.percentualTrilha, aulas: current.aulas.map((lesson) => lesson.id === displayedLesson.id ? { ...lesson, concluida: true } : lesson) } : current)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro inesperado.')
    } finally {
      setSavingCompletion(false)
    }
  }

  useEffect(() => {
    if (!track || selectedLesson) return
    const firstLesson = track.aulas.find((lesson) => !lesson.concluida) ?? track.aulas[0]
    if (firstLesson) selectLesson(firstLesson.id)
  }, [track, selectedLesson])

  if (error && !track) return <main className="app-shell dashboard-page"><DashboardHeader /><p className="content-wrap">{error}</p></main>
  if (!track) return <main className="app-shell dashboard-page"><DashboardHeader /><p className="content-wrap">Carregando trilha...</p></main>

  const completedLessons = track.aulas.filter((lesson) => lesson.concluida).length
  const initialLesson = track.aulas.find((lesson) => !lesson.concluida) ?? track.aulas[0]
  const activeLessonId = selectedLesson?.id ?? initialLesson?.id
  const displayedLesson = selectedLesson ?? initialLesson
  const lessonBody = selectedLesson ? splitLessonContent(selectedLesson.conteudo) : null
  const trackNumber = track.nivel === 'BASICO' ? '01' : track.nivel === 'INTERMEDIARIO' ? '02' : '03'

  return <main className="app-shell dashboard-page">
    <DashboardHeader />
    <section className="track-detail-hero track-detail-hero-no-image"><div className="content-wrap">
      <Link href="/aulas" className="back-link"><ArrowLeft size={16} /> Voltar para trilhas</Link>
      <div className="detail-grid"><div><span className={`eyebrow track-number track-number-${trackNumber}`}>Trilha {trackNumber}</span><div className="flex flex-wrap items-center gap-3"><h1>{track.titulo}</h1></div><p>{track.descricao}</p><div className="detail-stats"><div><strong>{track.aulas.length}</strong><span>Aulas</span></div><div><strong>2 horas</strong><span>Duração</span></div><div><strong>1</strong><span>Módulo</span></div></div></div></div>
    </div></section>
    <section className="content-wrap curriculum track-learning"><div className="section-heading"><div><span className="eyebrow">Conteúdo</span><h2>Conteúdos da trilha</h2></div></div>
      <div className="track-learning-grid">
        <aside className="track-module-navigation"><button type="button" className={isExpanded ? 'is-active' : ''} onClick={() => setIsExpanded((expanded) => !expanded)} aria-expanded={isExpanded}><span className="module-play-icon"><Play size={14} fill="currentColor" /></span><span><small>Módulo 01</small><strong>Conteúdos da trilha</strong><em>{track.aulas.length} aulas · 2 horas</em></span><ChevronDown size={18} className={isExpanded ? 'is-expanded' : ''} /></button>{isExpanded && <div className="track-module-lessons">{track.aulas.map((lesson) => <button type="button" className={`${lesson.id === activeLessonId ? 'is-selected ' : ''}${lesson.concluida ? 'is-completed' : ''}`} onClick={() => selectLesson(lesson.id)} key={lesson.id}><span>{lesson.concluida ? <Check size={14} /> : <Clock3 size={14} />}</span><p><small>Aula {String(lesson.ordem).padStart(2, '0')}</small><strong>{lesson.titulo}</strong></p></button>)}</div>}</aside>

        <article className="track-lesson-viewer">{displayedLesson ? <><div className="track-lesson-viewer-heading"><span>Aula {String(displayedLesson.ordem).padStart(2, '0')}</span><h3>{displayedLesson.titulo}</h3><p>{loadingLesson ? 'Carregando conteúdo da aula...' : 'Confira o conteúdo e avance no seu ritmo.'}</p></div>{loadingLesson ? <div className="track-lesson-loading">Carregando aula...</div> : lessonBody ? <div className="track-lesson-content">{lessonBody.videos.map((source) => <div className="track-video" key={source}><iframe src={source} title={`Vídeo da aula: ${selectedLesson?.titulo ?? ''}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>)}<ReactMarkdown components={{ img: ({ src, alt }) => <img src={src} alt={alt ?? ''} /> }}>{lessonBody.markdown || 'Este conteúdo ainda está em preparação.'}</ReactMarkdown></div> : <button type="button" className="track-lesson-preview" onClick={() => selectLesson(displayedLesson.id)}><span><Play size={26} fill="currentColor" /></span><strong>Carregar conteúdo da aula</strong></button>}</> : <div className="track-lesson-loading">Nenhuma aula disponível.</div>}</article>

        <aside className="track-learning-aside"><article className="track-progress-summary"><div><strong>Seu progresso na trilha</strong><b>{track.percentual}%</b></div><div className="dashboard-progress-bar"><span style={{ width: `${track.percentual}%` }} /></div><p>{completedLessons} de {track.aulas.length} aulas concluídas</p></article>{displayedLesson && <article className="track-next-lesson"><span>Aula atual</span><div><span className="track-next-icon"><Play size={16} fill="currentColor" /></span><p><small>Aula {String(displayedLesson.ordem).padStart(2, '0')}</small><strong>{displayedLesson.titulo}</strong></p></div><button type="button" className={displayedLesson.concluida ? 'is-completed' : ''} onClick={completeLesson} disabled={savingCompletion || displayedLesson.concluida}>{displayedLesson.concluida ? <><Check size={16} /> Aula concluída</> : savingCompletion ? 'Confirmando...' : <><Check size={16} /> Marcar como concluída</>}</button></article>}</aside>
      </div>
    </section>
  </main>
}

function DashboardHeader() {
  return <DashboardNavigation active="aulas" />
}

export default TrackModulePage
