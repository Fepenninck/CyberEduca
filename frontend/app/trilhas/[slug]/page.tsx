'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Circle, PlayCircle } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'
import { API_URL, TrackDetail } from '@/lib/api'

const levelLabels = {
  BASICO: 'Básico',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
}

const levelStyles = {
  BASICO: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  INTERMEDIARIO: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  AVANCADO: 'border-red-500/30 bg-red-500/10 text-red-400',
}

export default function TrilhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    params.then(({ slug }) => fetch(`${API_URL}/trilhas/${slug}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Trilha não encontrada.')
        setTrack(await response.json())
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.')))
  }, [params])

  if (error) return <main className="app-shell"><CyberHeader /><p className="content-wrap">{error}</p></main>
  if (!track) return <main className="app-shell"><CyberHeader /><p className="content-wrap">Carregando trilha...</p></main>
  const nextLesson = track.aulas.find((lesson) => !lesson.concluida) ?? track.aulas[0]

  return <main className="app-shell">
    <CyberHeader />
    <section className="track-detail-hero"><div className="content-wrap">
      <Link href="/trilhas" className="back-link"><ArrowLeft size={16} /> Todas as trilhas</Link>
      <div className="detail-grid"><div><span className="eyebrow">Trilha de aprendizagem</span><div className="flex flex-wrap items-center gap-3"><h1>{track.titulo}</h1><span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${levelStyles[track.nivel]}`}>{levelLabels[track.nivel]}</span></div><p>{track.descricao}</p><div className="detail-stats"><div><strong>{track.aulas.length}</strong><span>Aulas</span></div><div><strong>1</strong><span>Módulo</span></div></div></div>
      <aside className="track-progress-card"><div className="progress-ring"><strong>{track.percentual}%</strong></div><div><span>Seu progresso</span><h3>{track.percentual === 100 ? 'Trilha concluída' : 'Em andamento'}</h3></div><div>{nextLesson ? <Link className="reference-cta" href={`/aulas/${nextLesson.id}`}>{track.percentual > 0 ? 'Continuar' : 'Começar'} <ArrowRight size={15} /></Link> : <span>Adicione aulas para começar.</span>}</div></aside></div>
    </div></section>
    <section className="content-wrap curriculum"><div className="section-heading"><div><span className="eyebrow">Conteúdo</span><h2>Módulo 01 — Aulas da trilha</h2></div><span>{track.aulas.filter((lesson) => lesson.concluida).length}/{track.aulas.length} concluídas</span></div>
      <div className="module-list"><article className="module-card"><button type="button" className="module-header" onClick={() => setIsExpanded((expanded) => !expanded)} aria-expanded={isExpanded} aria-controls="module-01-lessons"><span className="module-number">01</span><div><h3>Conteúdos da trilha</h3><span>Escolha uma aula para iniciar ou continuar.</span></div><ChevronDown size={20} className={isExpanded ? 'module-toggle-icon is-expanded' : 'module-toggle-icon'} aria-hidden="true" /></button>{isExpanded && <div id="module-01-lessons" className="lesson-list">{track.aulas.map((lesson) => <Link className="lesson-row" href={`/aulas/${lesson.id}`} key={lesson.id}><span className={`lesson-icon ${lesson.concluida ? 'completed' : ''}`}>{lesson.concluida ? <Check size={15} /> : <Circle size={15} />}</span><span className="lesson-title"><strong>{String(lesson.ordem).padStart(2, '0')}. {lesson.titulo}</strong><small>{lesson.concluida ? 'Concluída' : 'Disponível para estudar'}</small></span><PlayCircle size={18} /></Link>)}</div>}</article></div>
    </section>
  </main>
}
