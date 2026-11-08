'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, Clock3, LockKeyhole } from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { API_URL, TrackSummary } from '@/lib/api'

const levels = [
  { key: 'BASICO', number: '01', title: 'Nível Iniciante', description: 'Fundamentos essenciais para você começar sua jornada em cibersegurança.', color: '#24b4ff', image: "url('/trilha-basico-bg.png')" },
  { key: 'INTERMEDIARIO', number: '02', title: 'Nível Intermediário', description: 'Aprofunde seus conhecimentos e coloque a teoria em prática.', color: '#ffd34e', image: "url('/trilha-intermediario-bg.png')" },
  { key: 'AVANCADO', number: '03', title: 'Nível Avançado', description: 'Desafios reais e conteúdos avançados para profissionais.', color: '#ff4654', image: "url('/trilha-avancado-bg.png')" },
]

export default function AulasPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
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

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
        {loading && <p className="results-line">Carregando trilhas...</p>}
        {error && <p className="results-line">{error}</p>}
        {!loading && !error && levels.map((level) => {
          const levelTracks = tracks.filter((track) => track.nivel === level.key)
          return (
            <section className="learning-level" key={level.key} style={{ '--level-color': level.color } as React.CSSProperties}>
              <aside className="learning-level-intro">
                <div className="learning-level-title"><i /><h1>{level.title}</h1></div>
                <p>{level.description}</p>
              </aside>
              <div className="learning-level-cards">
                {levelTracks.length ? levelTracks.map((track) => (
                  <article key={track.id} className={`learning-path-card ${track.bloqueada ? 'is-locked' : ''}`} style={{ '--track-image': level.image } as React.CSSProperties}>
                    <div className="learning-path-image" />
                    <div className="learning-path-body">
                      <span className="learning-path-badge">{level.key === 'BASICO' ? 'INICIANTE' : level.key === 'INTERMEDIARIO' ? 'INTERMEDIÁRIO' : 'AVANÇADO'}</span>
                      <h2>{track.titulo}</h2>
                      <p>{track.descricao}</p>
                      <div className="learning-path-meta">
                        <span><BookOpen size={15} /> {track.totalAulas} aulas</span>
                        <span><Clock3 size={15} /> 2 horas</span>
                        <strong>{track.percentual}%</strong>
                      </div>
                      {track.bloqueada
                        ? <span className="learning-path-lock"><LockKeyhole size={14} /> Conclua as trilhas anteriores</span>
                        : <Link href={`/aulas/modulo/${track.id}`}>{track.percentual ? 'Continuar trilha' : 'Ver trilha'}</Link>}
                    </div>
                  </article>
                )) : <ComingSoon />}
              </div>
            </section>
          )
        })}
      </section>
    </main>
  )
}

function ComingSoon() {
  return (
    <article className="learning-path-card learning-path-soon">
      <div className="learning-path-image" />
      <div className="learning-path-body">
        <span>EM BREVE</span>
        <h2>Nova trilha</h2>
        <p>Novos conteúdos serão disponibilizados em breve.</p>
      </div>
    </article>
  )
}