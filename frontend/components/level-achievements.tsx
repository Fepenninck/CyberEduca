'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import './level-achievements.css'

type Achievement = { nivel: string; totalAulas: number; aulasConcluidas: number; conquistada: boolean; conquistadaEm: string | null }
export const LEVEL_BADGES = [
  { level: 'BASICO', title: 'Básico', src: '/images/insignias/basico.png', color: '#24b4ff' },
  { level: 'INTERMEDIARIO', title: 'Intermediário', src: '/images/insignias/intermediario.png', color: '#ffd34e' },
  { level: 'AVANCADO', title: 'Avançado', src: '/images/insignias/avancado.png', color: '#ff4654' },
] as const

export function useAchievements() {
  const [data, setData] = useState<Achievement[]>([])
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await apiFetch('/usuarios/me/conquistas', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error()
        const result = await response.json()
        if (!controller.signal.aborted) { setData(result); setError(false) }
      } catch { if (!controller.signal.aborted) setError(true) }
    }
    void load()
    window.addEventListener('focus', load)
    window.addEventListener('learning-progress-updated', load)
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('learning-progress-updated', load) }
  }, [])
  return { data, error }
}

export function LevelAchievements() {
  const { data, error } = useAchievements()
  return <article className="profile-card level-achievements">
    <h2>Conquistas</h2>
    <p className="achievement-intro">Conclua todas as aulas de um nível para ganhar sua insígnia.</p>
    {error ? <p role="status">Não foi possível carregar suas conquistas. Volte a esta janela para tentar novamente.</p> : !data.length ? <p role="status">Carregando conquistas...</p> : <div className="achievement-grid">
      {LEVEL_BADGES.map(badge => {
        const progress = data.find(item => item.nivel === badge.level)
        return <div className={`achievement-item ${progress?.conquistada ? 'is-earned' : 'is-locked'}`} key={badge.level}>
          <img src={badge.src} alt={`Insígnia de cibersegurança — nível ${badge.title}`} width={240} height={160} />
          <h3>{badge.title}</h3>
          <strong>{progress?.conquistada ? 'Conquistada' : 'Em progresso'}</strong>
          <p>{progress?.aulasConcluidas ?? 0} de {progress?.totalAulas ?? 0} aulas concluídas</p>
          {progress?.conquistadaEm && <small>Conquistada em {new Date(progress.conquistadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>}
        </div>
      })}
    </div>}
  </article>
}

export function TrailAchievement({ level, progress, unavailable }: { level: string; progress?: Achievement; unavailable: boolean }) {
  const badge = LEVEL_BADGES.find(item => item.level === level)!
  return <article className={`trail-achievement ${progress?.conquistada ? 'is-earned' : 'is-locked'}`} data-level={level}>
    <span className="trail-achievement-label">Conquista do nível</span>
    <img src={badge.src} alt={`Insígnia de cibersegurança — ${badge.title}`} width={300} height={200} />
    <h2>Insígnia {badge.title}</h2>
    <strong>{unavailable ? 'Conquistas indisponíveis' : !progress ? 'Carregando...' : progress.conquistada ? 'Você conquistou esta insígnia!' : `${progress.aulasConcluidas} de ${progress.totalAulas} aulas concluídas`}</strong>
    <p>{progress?.conquistada ? 'Sua conquista já aparece no perfil.' : 'Conclua todas as aulas deste nível para ganhar.'}</p>
  </article>
}
