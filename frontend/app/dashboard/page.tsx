'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  GraduationCap,
  Home,
  Menu,
  MonitorPlay,
  UserRound,
} from 'lucide-react'
import { API_URL, TrackDetail, TrackSummary } from '@/lib/api'
import { UserMenu } from '@/components/user-menu'

const trackThemes = [
  { color: '#24b4ff', image: '/trilha-basico-bg.png' },
  { color: '#ffd34e', image: '/trilha-intermediario-bg.png' },
  { color: '#ff4654', image: '/trilha-avancado-bg.png' },
]

export default function DashboardPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [lessons, setLessons] = useState<TrackDetail['aulas']>([])

  useEffect(() => {
    fetch(`${API_URL}/trilhas`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Não foi possível carregar as trilhas.')))
      .then(setTracks)
      .catch(() => setTracks([]))
  }, [])

  const selectedTrack = tracks.find((track) => track.percentual > 0 && track.percentual < 100) ?? tracks[0]

  useEffect(() => {
    if (!selectedTrack) {
      setLessons([])
      return
    }

    fetch(`${API_URL}/trilhas/${selectedTrack.id}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Não foi possível carregar as aulas.')))
      .then((track: TrackDetail) => setLessons(track.aulas))
      .catch(() => setLessons([]))
  }, [selectedTrack])

  const currentLesson = lessons.find((lesson) => !lesson.concluida) ?? lessons.at(-1)
  const lessonHref = currentLesson ? `/aulas/${currentLesson.id}` : selectedTrack ? `/trilhas/${selectedTrack.id}` : '/trilhas'
  const trackHref = selectedTrack ? `/trilhas/${selectedTrack.id}` : '/trilhas'

  const data = useMemo(() => {
    const currentTrack = selectedTrack
    const completedLessons = tracks.reduce((total, track) => total + Math.round(track.totalAulas * track.percentual / 100), 0)
    const overallProgress = tracks.length ? Math.round(tracks.reduce((total, track) => total + track.percentual, 0) / tracks.length) : 0
    const themeIndex = currentTrack ? tracks.indexOf(currentTrack) % trackThemes.length : 0

    return {
      userName: 'Felipe',
      currentTrack: currentTrack?.titulo ?? 'Escolha uma trilha para começar',
      currentTrackImage: trackThemes[themeIndex].image,
      currentModule: currentLesson ? `Aula ${currentLesson.ordem}` : 'Aula 1',
      currentLessonDuration: '30 min',
      lastLesson: currentLesson?.titulo ?? 'Nenhuma aula disponível',
      currentProgress: currentTrack?.percentual ?? 0,
      startedTracks: tracks.filter((track) => track.percentual > 0).length,
      completedLessons,
      overallProgress,
      tracks: tracks.slice(0, 3).map((track, index) => ({
        name: track.nivel.charAt(0) + track.nivel.slice(1).toLowerCase(),
        progress: track.percentual,
        color: trackThemes[index % trackThemes.length].color,
        status: track.percentual ? `${track.percentual}% concluído` : 'Não iniciado',
      })),
    }
  }, [currentLesson, selectedTrack, tracks])

  const moduleCompleted = data.currentProgress === 100
  const moduleStatus = moduleCompleted ? 'Concluído' : data.currentProgress > 0 ? 'Em andamento' : 'Não iniciado'

  return (
    <main className="app-shell dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link href="/dashboard" className="dashboard-brand" aria-label="CyberEduca+ dashboard">
            <img src="/cybereduca-logo.png" alt="CyberEduca+" />
          </Link>
          <nav className="dashboard-nav" aria-label="Navegação da área do aluno">
            <Link className="is-active" href="/dashboard"><Home size={16} /> Início</Link>
            <Link href="/perfil"><UserRound size={16} /> Perfil</Link>
            <Link href={lessonHref}><BookOpen size={16} /> Minhas aulas</Link>
            <Link href="/em-breve"><MonitorPlay size={16} /> Simulações</Link>
            <Link href="/em-breve"><ClipboardCheck size={16} /> Avaliações</Link>
          </nav>
          <div className="dashboard-header-actions">
            <UserMenu />
          </div>
          <details className="dashboard-mobile-menu">
            <summary aria-label="Abrir navegação"><Menu size={24} /></summary>
            <nav>
              <Link href="/dashboard">Início</Link>
              <Link href={lessonHref}>Minhas aulas</Link><Link href="/em-breve">Simulações</Link>
              <Link href="/em-breve"><ClipboardCheck size={17} /> Avaliações</Link>
              <Link href="/perfil">Meu perfil</Link>
            </nav>
          </details>
        </div>
      </header>

      <div className="dashboard-wrap">
        <header className="dashboard-welcome">
          <h1>Olá, {data.userName}!</h1>
          <p>Continue desenvolvendo seus conhecimentos em cibersegurança.</p>
        </header>

        <section className="dashboard-main-grid" aria-label="Resumo da aprendizagem">
          <article className="continue-card">
            <div className="learning-card-top">
              <div className="learning-track-art">
                <img src={data.currentTrackImage} alt={`Capa da trilha ${data.currentTrack}`} />
              </div>
              <div className="learning-track-copy">
                <div className="learning-badges"><span>Em andamento</span><small><GraduationCap size={14} /> Básico</small></div>
                <h2>{data.currentTrack}</h2>
                <div className="learning-track-meta">
                  <span><BookOpen size={15} /> {data.currentModule}</span>
                  <span><Clock3 size={15} /> {data.currentLessonDuration}</span>
                </div>
              </div>
                <div className="learning-top-progress">
                  <div className="learning-progress-bar" aria-label={`${data.currentProgress}% concluído`}><span style={{ width: `${data.currentProgress}%` }} /></div>
                  <strong>{data.currentProgress}%</strong>
                </div>
            </div>

            <details className="learning-module">
              <summary className="learning-module-head"><strong>Conteúdos da trilha</strong><span className={`learning-module-status ${moduleCompleted ? 'is-completed' : ''}`}>{moduleCompleted ? <i className="module-complete-icon"><Check size={15} strokeWidth={3} /></i> : <Circle size={17} />} {moduleStatus}</span><ChevronDown className="learning-module-toggle" size={20} /></summary>
              <div className="learning-module-lesson">
                <span className={`lesson-status ${moduleCompleted ? 'is-completed' : ''}`}>{moduleCompleted ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}</span>
                <span className="lesson-type">{data.currentModule}</span>
                <strong>{data.lastLesson}</strong>
              </div>
            </details>

            <div className="learning-card-footer">
              <div className="continue-actions">
                <Link className="dashboard-button-secondary module-link" href={trackHref}>Ver módulo completo</Link>
                <Link className="dashboard-button-primary" href={lessonHref}>Continuar aprendendo</Link>
              </div>
            </div>
          </article>

          <aside className="summary-card">
            <div className="dashboard-card-heading compact">
              <div><h2>Seu progresso</h2></div>
            </div>
            <div className="summary-metrics">
              <div><span>Trilhas iniciadas</span><strong>{data.startedTracks}</strong></div>
              <div><span>Aulas concluídas</span><strong>{data.completedLessons}</strong></div>
            </div>
            <div className="overall-progress">
              <div className="dashboard-progress-label"><span>Progresso geral</span><strong>{data.overallProgress}%</strong></div>
              <div className="dashboard-progress-bar"><span style={{ width: `${data.overallProgress}%` }} /></div>
            </div>
            <div className="summary-track-progress">
              {data.tracks.map((track) => (
                <div key={track.name}>
                  <div><span>{track.name}</span><strong>{track.progress}%</strong></div>
                  <div className="dashboard-progress-bar"><span style={{ width: `${track.progress}%`, background: track.color }} /></div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="suas-trilhas" className="dashboard-tracks" aria-labelledby="dashboard-tracks-title">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">Sua jornada</span><h2 id="dashboard-tracks-title">Suas trilhas</h2></div>
            <Link href="/trilhas">Explorar todas <ArrowRight size={15} /></Link>
          </div>
          <div className="dashboard-track-grid">
            {data.tracks.map((track, index) => (
              <Link className="dashboard-track-card" href="/trilhas" key={track.name} style={{ '--level-color': track.color } as React.CSSProperties}>
                <div className="track-card-header"><span className="level-dot" /><span>Trilha {String(index + 1).padStart(2, '0')}</span><ChevronRight size={18} /></div>
                <h3>{track.name}</h3>
                <div className="dashboard-progress-label"><span>{track.status}</span><strong>{track.progress}%</strong></div>
                <div className="dashboard-progress-bar"><span style={{ width: `${track.progress}%` }} /></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
