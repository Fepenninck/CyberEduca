'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
} from 'lucide-react'
import { apiFetch, getCurrentUser, TrackDetail, TrackSummary } from '@/lib/api'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { ProfilePicture } from '@/components/cyber-avatar'
import { useAchievements } from '@/components/level-achievements'
import { progressoDoNivel, progressoDoPercurso } from '@/lib/learning-progress'

const trackThemes = [
  { color: '#24b4ff', image: '/trilha-basico-bg.png', illustration: '/trilha-personagem-basico.png' },
  { color: '#ffd34e', image: '/trilha-intermediario-bg.png', illustration: '/trilha-personagem-intermediario.png' },
  { color: '#ff4654', image: '/trilha-avancado-bg.png', illustration: '/trilha-personagem-avancado.png' },
]

const levelThemes: Record<TrackSummary['nivel'], string> = { BASICO: '#24b4ff', INTERMEDIARIO: '#ffd34e', AVANCADO: '#ff4654' }

const levelLabels: Record<TrackSummary['nivel'], string> = { BASICO: 'Básico', INTERMEDIARIO: 'Intermediário', AVANCADO: 'Avançado' }


export default function DashboardPage() {
  const achievements = useAchievements()
  const router = useRouter()
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [lessons, setLessons] = useState<TrackDetail['aulas']>([])
  const [userName, setUserName] = useState('')
  const [picture, setPicture] = useState<{ foto?: string | null; avatar?: string | null }>({})

  useEffect(() => {
    getCurrentUser().then((user) => { setUserName(user.nome); setPicture({ foto: user.foto, avatar: user.avatar }) }).catch(() => router.replace('/login'))
    const loadTracks = () => apiFetch(`/trilhas`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Não foi possível carregar as trilhas.')))
      .then(setTracks)
      .catch(() => setTracks([]))
    void loadTracks()
    window.addEventListener('focus', loadTracks)
    window.addEventListener('learning-progress-updated', loadTracks)
    return () => { window.removeEventListener('focus', loadTracks); window.removeEventListener('learning-progress-updated', loadTracks) }
  }, [router])

  const availableTracks = tracks.filter(track => track.totalAulas > 0)
  const selectedTrack = availableTracks.find(track => !track.bloqueada && track.percentual > 0 && track.percentual < 100)
    ?? availableTracks.find(track => !track.bloqueada && track.percentual < 100)
    ?? availableTracks.filter(track => !track.bloqueada && track.percentual === 100).at(-1)
    ?? availableTracks.filter(track => !track.bloqueada).at(-1)
  const selectedTrackId = selectedTrack?.id

  useEffect(() => {
    if (!selectedTrackId) {
      setLessons([])
      return
    }

    const controller = new AbortController()
    setLessons([])
    apiFetch(`/trilhas/${selectedTrackId}`, { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Não foi possível carregar as aulas.')))
      .then((track: TrackDetail) => { if (!controller.signal.aborted) setLessons(track.aulas) })
      .catch(() => { if (!controller.signal.aborted) setLessons([]) })
    return () => controller.abort()
  }, [selectedTrackId])

  const currentLesson = lessons.find((lesson) => !lesson.concluida) ?? lessons.at(-1)
  const trackHref = selectedTrack ? `/aulas/modulo/${selectedTrack.id}` : '/aulas'
  const continueHref = selectedTrack && currentLesson
    ? `/aulas/modulo/${selectedTrack.id}/aula/${currentLesson.id}`
    : trackHref
  const data = useMemo(() => {
    const currentTrack = selectedTrack
    const completedLessons = tracks.reduce((total, track) => total + Math.round(track.totalAulas * track.percentual / 100), 0)
    const overallProgress = progressoDoPercurso(achievements.data)
    const themeIndex = currentTrack ? ['BASICO', 'INTERMEDIARIO', 'AVANCADO'].indexOf(currentTrack.nivel) : 0

    return {
      userName,
      currentTrack: currentTrack?.titulo ?? 'Escolha uma trilha para começar',
      currentLevel: currentTrack ? levelLabels[currentTrack.nivel] : 'Básico',
      currentTrackImage: trackThemes[themeIndex].image,
      currentTrackIllustration: trackThemes[themeIndex].illustration,
      currentColor: currentTrack ? levelThemes[currentTrack.nivel] : trackThemes[0].color,
      currentModule: currentLesson ? `Aula ${currentLesson.ordem}` : 'Sem aula disponível',
      currentLessonDuration: '',
      lastLesson: currentLesson?.titulo ?? 'Nenhuma aula disponível',
      currentProgress: currentTrack ? progressoDoNivel(achievements.data.find(item => item.nivel === currentTrack.nivel) ?? { totalAulas: 0, aulasConcluidas: 0, conquistada: false, desbloqueado: false }) : 0,
      startedTracks: tracks.filter((track) => track.percentual > 0).length,
      completedLessons,
      overallProgress,
      tracks: (['BASICO', 'INTERMEDIARIO', 'AVANCADO'] as const).map((nivel, index) => {
        const certification = achievements.data.find(item => item.nivel === nivel)
        const progress = certification ? progressoDoNivel(certification) : 0
        return {
          name: levelLabels[nivel],
          progress,
          color: trackThemes[index].color,
          status: !certification ? 'Carregando...' : !certification.desbloqueado ? 'Bloqueado pela prova anterior' : certification.conquistada ? 'Nível concluído' : certification.aulasConcluidas === certification.totalAulas ? 'Prova pendente' : 'Aulas em andamento',
        }
      }),
    }
  }, [currentLesson, selectedTrack, tracks, userName, achievements.data])

  const moduleCompleted = data.currentProgress === 100
  const moduleStatus = moduleCompleted ? 'Nível concluído' : selectedTrack?.percentual === 100 ? 'Prova pendente' : data.currentProgress > 0 ? 'Em andamento' : 'Não iniciado'

  return (
    <main className="app-shell dashboard-page student-home">
      <DashboardNavigation active="inicio" />

      <div className="dashboard-wrap">
        <header className="dashboard-welcome dashboard-welcome-avatar">
          <div className="dashboard-welcome-picture">
            <ProfilePicture foto={picture.foto} avatar={picture.avatar} iconSize={30} alt="" />
          </div>
          <div>
            <h1>{data.userName ? `Olá, ${data.userName.split(' ')[0]}!` : 'Olá!'}</h1>
            <p>Que bom ter você por aqui. Vamos ao próximo passo?</p>
          </div>
        </header>

        <div className="student-start-grid">
          <section className="dash-hero" style={{ '--hero-image': `url(${data.currentTrackImage})`, '--hero-color': data.currentColor } as CSSProperties} aria-labelledby="dash-hero-title">
            <div className="dash-hero-copy">
              <div className="dash-hero-tags">
                <span className={`dash-hero-status ${moduleCompleted ? 'is-completed' : data.currentProgress > 0 ? 'is-in-progress' : ''}`}>{moduleStatus}</span>
                <span className="dash-hero-level">Nível {data.currentLevel.toLowerCase()}</span>
              </div>
              <h2 id="dash-hero-title">{data.currentTrack}</h2>
              <p className="dash-hero-lesson">{data.currentModule}: {data.lastLesson}</p>
              <div className="dash-hero-actions">
                <Link className="dashboard-button-primary" href={continueHref}>Continuar</Link>
                <Link className="dash-hero-link" href="/aulas">Ver Trilhas</Link>
              </div>
            </div>
            <div className="student-hero-art">
              <img src={data.currentTrackIllustration} alt="" />
            </div>
            <div className="student-track-progress">
              <div><span>Progresso no nível · aulas e prova</span><strong>{data.currentProgress}%</strong></div>
              <div className="student-progress-bar" role="progressbar" aria-label="Progresso na trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.currentProgress}><span style={{ width: `${data.currentProgress}%` }} /></div>
            </div>
          </section>

          <article className="dash-panel dash-stats">
            <h2>Sua jornada até aqui</h2>
            <div className="dash-stat-row">
              <div><strong>{data.overallProgress}%</strong><span>Progresso geral</span></div>
              <div><strong>{data.completedLessons}</strong><span>Aulas concluídas</span></div>
              <div><strong>{data.startedTracks}</strong><span>Trilhas iniciadas</span></div>
            </div>
            <div className="dash-levels">
              {data.tracks.map((track) => (
                <div key={track.name} className="dash-level" style={{ '--level-color': track.color } as CSSProperties}>
                  <div><span>{track.name}</span><strong>{track.progress}%</strong></div>
                  <div className="dash-level-bar"><span style={{ width: `${track.progress}%` }} /></div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <section className="dash-grid" aria-label="Resumo da aprendizagem">
          <article className="dash-panel dash-lessons">
            <div className="dash-panel-head">
              <h2>Aulas da trilha</h2>
            </div>
            {selectedTrack && <p className="dash-lessons-subtitle">{selectedTrack.titulo}</p>}
            {lessons.length ? (
              <ol className="dash-lesson-list">
                {lessons.map((lesson) => {
                  const atual = lesson.id === currentLesson?.id && !lesson.concluida
                  return (
                    <li key={lesson.id} className={lesson.concluida ? 'is-done' : atual ? 'is-current' : undefined}>
                      <span className="dash-lesson-mark" aria-hidden="true">{lesson.concluida ? <Check size={14} strokeWidth={3} /> : lesson.ordem}</span>
                      <span className="dash-lesson-title">{lesson.titulo}</span>
                      <span className="dash-lesson-state">{lesson.concluida ? 'Concluída' : atual ? 'Próxima' : ''}</span>
                    </li>
                  )
                })}
              </ol>
            ) : <p className="dash-empty">As aulas aparecem aqui quando você escolher uma trilha.</p>}
          </article>
        </section>

      </div>
    </main>
  )
}
