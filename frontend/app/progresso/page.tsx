'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Target } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'
import { API_URL, TrackSummary } from '@/lib/api'

export default function ProgressoPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [error, setError] = useState('')
  useEffect(() => { fetch(`${API_URL}/progresso`).then(async (response) => { if (!response.ok) throw new Error('Não foi possível carregar seu progresso.'); setTracks(await response.json()) }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.')) }, [])
  const data = useMemo(() => {
    const total = tracks.reduce((sum, track) => sum + track.totalAulas, 0)
    const completed = tracks.reduce((sum, track) => sum + Math.round(track.totalAulas * track.percentual / 100), 0)
    return { total, completed, percent: total ? Math.round(completed / total * 100) : 0, active: tracks.filter((track) => track.percentual > 0 && track.percentual < 100).length }
  }, [tracks])

  return <main className="app-shell"><CyberHeader />
    <section className="page-hero progress-hero"><span className="eyebrow">Sua evolução</span><h1>Meu <span>progresso</span>.</h1><p>Acompanhe suas aulas, continue de onde parou e celebre cada avanço.</p></section>
    <section className="content-wrap progress-page">
      {error ? <p>{error}</p> : <><div className="overview-grid"><article className="overall-card"><span className="eyebrow">Visão geral</span><div className="overall-number">{data.percent}<small>%</small></div><div className="progress-track"><span style={{ width: `${data.percent}%`, background: '#b2ff00' }} /></div><p>{data.completed} de {data.total} aulas concluídas.</p></article><article className="metric-card"><CheckCircle2 size={22} /><strong>{data.completed}</strong><span>Aulas concluídas</span></article><article className="metric-card"><BookOpen size={22} /><strong>{data.active}</strong><span>Trilhas em andamento</span></article><article className="metric-card"><Target size={22} /><strong>{tracks.filter((track) => track.percentual === 100 && track.totalAulas > 0).length}</strong><span>Trilhas concluídas</span></article></div>
      <div className="progress-columns"><div><div className="section-heading"><div><span className="eyebrow">Trilhas</span><h2>Seu caminho de aprendizagem</h2></div></div><div className="progress-track-list">{tracks.length === 0 ? <div className="track-progress-card"><h3>Ainda não há trilhas</h3><p>Seu progresso aparecerá aqui quando você cadastrar e começar uma trilha.</p></div> : tracks.map((track, index) => <article className="progress-track-card" key={track.id}><span className="track-mark small" style={{ background: index % 2 ? '#57b8ff' : '#b2ff00' }}>{String(index + 1).padStart(2, '0')}</span><div className="progress-track-info"><div><h3>{track.titulo}</h3><strong>{track.percentual}%</strong></div><span>{track.totalAulas} aulas</span><div className="progress-track"><span style={{ width: `${track.percentual}%`, background: index % 2 ? '#57b8ff' : '#b2ff00' }} /></div></div><Link href={`/trilhas/${track.id}`} aria-label={`Abrir ${track.titulo}`}><ArrowRight size={18} /></Link></article>)}</div></div><aside className="streak-card"><span className="eyebrow">Continue aprendendo</span><h2>{data.active ? 'Você está no caminho certo.' : 'Escolha sua primeira trilha.'}</h2><p>Ao concluir uma aula, seu progresso é salvo automaticamente e permanece disponível quando você voltar.</p><Link className="text-link" href="/trilhas">Explorar trilhas <ArrowRight size={16} /></Link></aside></div></>}
    </section>
  </main>
}
