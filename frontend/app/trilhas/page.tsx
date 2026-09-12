'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Clock3, Search } from 'lucide-react'
import { CyberHeader } from '@/components/cyber-header'
import { API_URL, TrackSummary } from '@/lib/api'

export default function TrilhasPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/trilhas`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as trilhas.')
        setTracks(await response.json())
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.'))
      .finally(() => setLoading(false))
  }, [])

  const visibleTracks = tracks.filter((track) =>
    `${track.titulo} ${track.descricao}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <main className="app-shell">
      <CyberHeader />
      <section className="page-hero">
        <span className="eyebrow">Aprendizagem</span>
        <h1>Trilhas para evoluir com <span>segurança</span>.</h1>
        <p>Escolha uma trilha, avance pelos módulos e aprenda no seu ritmo.</p>
      </section>
      <section className="content-wrap">
        <div className="toolbar">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar trilhas" aria-label="Buscar trilhas" /></label>
          <span className="filter-row">Seu progresso é salvo automaticamente.</span>
        </div>
        {loading && <p className="results-line">Carregando trilhas...</p>}
        {error && <p className="results-line">{error}</p>}
        {!loading && !error && (
          <>
            <div className="results-line"><span>{visibleTracks.length} trilha{visibleTracks.length === 1 ? '' : 's'} disponível{visibleTracks.length === 1 ? '' : 'eis'}</span></div>
            {visibleTracks.length === 0 ? (
              <div className="track-progress-card"><span className="eyebrow">Ainda não há conteúdo</span><h2>Nenhuma trilha cadastrada</h2><p>Quando você criar uma trilha no banco, ela aparecerá aqui para os alunos.</p></div>
            ) : (
              <div className="track-grid">
                {visibleTracks.map((track, index) => (
                  <article className="track-card" key={track.id} style={{ '--track-color': index % 2 ? '#57b8ff' : '#b2ff00' } as React.CSSProperties}>
                    <div className="track-card-top"><span className="track-category">Trilha {String(index + 1).padStart(2, '0')}</span><span className="track-level">Disponível</span><strong className="track-mark">0{index + 1}</strong></div>
                    <div className="track-card-body">
                      <h2>{track.titulo}</h2><p>{track.descricao}</p>
                      <div className="track-details"><span><BookOpen size={15} /> {track.totalAulas} aula{track.totalAulas === 1 ? '' : 's'}</span><span><Clock3 size={15} /> No seu ritmo</span></div>
                      <div className="progress-label"><span>Progresso</span><strong>{track.percentual}%</strong></div>
                      <div className="progress-track"><span style={{ width: `${track.percentual}%`, background: index % 2 ? '#57b8ff' : '#b2ff00' }} /></div>
                      <Link className="track-link" href={`/trilhas/${track.id}`}>{track.percentual > 0 ? 'Continuar trilha' : 'Ver trilha'} <ArrowRight size={16} /></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
