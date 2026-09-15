'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Clock3, LockKeyhole } from 'lucide-react'
import '../footer.css'
import { CyberHeader } from '@/components/cyber-header'
import { API_URL, TrackSummary } from '@/lib/api'

export default function TrilhasPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`${API_URL}/trilhas`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as trilhas.')
        setTracks(await response.json())
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.'))
      .finally(() => setLoading(false))
  }, [])

  const visibleTracks = tracks
  const tracksPerPage = 4
  const totalPages = Math.max(1, Math.ceil(visibleTracks.length / tracksPerPage))
  const paginatedTracks = visibleTracks.slice((page - 1) * tracksPerPage, page * tracksPerPage)
  const trackThemes = [
    { color: '#24b4ff', image: "url('/trilha-basico-bg.png')" },
    { color: '#ffd34e', image: "url('/trilha-intermediario-bg.png')" },
    { color: '#ff4654', image: "url('/trilha-avancado-bg.png')" },
  ]

  return (
    <main className="app-shell">
      <CyberHeader />
      <section className="page-hero page-hero-video">
        <video className="page-hero-video-media" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/trilhas-hero.mp4" type="video/mp4" />
        </video>
        <div className="page-hero-video-overlay" aria-hidden="true" />
        <div className="page-hero-content">
          <img className="page-hero-title-image" src="/trilhas-titulo.png" alt="Trilhas para evoluir com segurança" />
          <img className="page-hero-subtitle-image" src="/trilhas-subtitulo.png" alt="Escolha uma trilha, avance pelos módulos e aprenda no seu ritmo." />
        </div>
      </section>
      <section className="level-art-section" aria-label="Níveis de aprendizagem">
        <div className="level-art-grid">
          <img src="/nivel-basico.png" alt="Nível básico" />
          <img src="/nivel-intermediario.png" alt="Nível intermediário" />
          <img src="/nivel-avancado-v2.png" alt="Nível avançado" />
        </div>
      </section>
      <section className="content-wrap tracks-content">
        {loading && <p className="results-line">Carregando trilhas...</p>}
        {error && <p className="results-line">{error}</p>}
        {!loading && !error && (
          <>
            {visibleTracks.length === 0 ? (
              <div className="track-progress-card"><span className="eyebrow">Ainda não há conteúdo</span><h2>Nenhuma trilha cadastrada</h2><p>Quando você criar uma trilha no banco, ela aparecerá aqui para os alunos.</p></div>
            ) : (
              <div className="track-grid">
                {paginatedTracks.map((track, index) => (
                  <article className={`track-card ${track.bloqueada ? 'is-locked' : ''}`} key={track.id} style={{ '--track-color': trackThemes[index % trackThemes.length].color, '--track-image': trackThemes[index % trackThemes.length].image } as React.CSSProperties}>
                    <div className="track-card-top"><span className="track-category">Trilha {String(index + 1).padStart(2, '0')}</span><span className="track-level">{track.bloqueada ? <><LockKeyhole size={12} /> Bloqueada</> : 'Disponível'}</span><strong className="track-mark">0{index + 1}</strong></div>
                    <div className="track-card-body">
                      <h2>{track.titulo}</h2><p>{track.descricao}</p>
                      <div className="track-details"><span><BookOpen size={15} /> {track.totalAulas} aula{track.totalAulas === 1 ? '' : 's'}</span><span><Clock3 size={15} /> 2 horas</span></div>
                      <div className="progress-label"><span>Progresso</span><strong>{track.percentual}%</strong></div>
                      <div className="progress-track"><span style={{ width: `${track.percentual}%`, background: index % 2 ? '#57b8ff' : '#b2ff00' }} /></div>
                      {track.bloqueada ? <span className="track-link track-link-locked"><LockKeyhole size={15} /> Conclua a trilha anterior</span> : <Link className="track-link" href={`/trilhas/${track.id}`}>{track.percentual >= 100 ? 'Trilha concluída' : track.percentual > 0 ? 'Continuar trilha' : 'Ver trilha'}</Link>}
                    </div>
                  </article>
                ))}
                {paginatedTracks.length === 3 && <div className="tracks-grid-video"><video autoPlay muted loop playsInline preload="metadata" aria-label="Vídeo decorativo"><source src="/trilhas-grade-video.mp4" type="video/mp4" /></video></div>}
              </div>
            )}
            <nav className="track-pagination" aria-label="Paginação de trilhas">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Página anterior"><ChevronLeft size={18} /></button>
              <span>{page}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Próxima página"><ChevronRight size={18} /></button>
            </nav>
          </>
        )}
      </section>
      <footer className="ce-footer tracks-footer">
        <div className="ce-container"><div className="ce-footer-card"><div className="ce-footer-grid">
          <div className="ce-footer-brand"><Link href="/" className="ce-logo" aria-label="CyberEduca+ início"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><p>Educação acessível para uma vida digital mais segura.</p></div>
          <nav aria-label="Aprendizagem"><h2>Aprendizagem</h2><Link href="/trilhas">Todas as trilhas</Link><Link href="/progresso">Meu progresso</Link></nav>
          <nav aria-label="Conteúdos"><h2>Conteúdos</h2><Link href="/trilhas">Explorar conteúdos</Link><Link href="/em-breve">Recursos</Link></nav>
          <nav aria-label="Privacidade"><h2>Privacidade</h2><Link href="/em-breve">Política de privacidade</Link><Link href="/em-breve">Termos de uso</Link></nav>
          <nav aria-label="Conecte-se"><h2>Conecte-se</h2><a href="https://www.instagram.com/cybereduca.ofc?stkn=MTdxY3I5MGJ5ODF3OA==" target="_blank" rel="noreferrer">Instagram</a><Link href="/em-breve">Ajuda</Link></nav>
        </div></div><div className="ce-footer-bottom"><span>© 2026 CyberEduca+. Todos os direitos reservados.</span><div><Link href="/em-breve">Privacidade</Link><Link href="/em-breve">Cookies</Link><Link href="/em-breve">Termos de uso</Link></div></div></div>
      </footer>
    </main>
  )
}
