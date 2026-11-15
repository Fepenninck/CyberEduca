'use client'

import { LoadingScreen } from '@/components/ui/loading-screen'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import './level-achievements.css'
import { SimulationAchievement } from './simulation-achievement'
import { QuizAchievement } from './quiz-achievement'
import { LaboratoryAchievement } from './laboratory-achievement'

export type Achievement = { nivel: string; totalAulas: number; aulasConcluidas: number; conquistada: boolean; conquistadaEm: string | null; desbloqueado: boolean }
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

export function LevelAchievements({ data, error }: { data: Achievement[]; error: boolean }) {
  return <article className="profile-card level-achievements">
    <h2>Conquistas</h2>
    <p className="achievement-intro">Conclua as aulas e passe na prova de cada nível para ganhar sua insígnia. Complete os quizzes e as simulações e faça seu primeiro teste no laboratório para conquistar as insígnias dessas atividades.</p>
    {error ? <p role="status">Não foi possível carregar suas conquistas. Volte a esta janela para tentar novamente.</p> : !data.length ? <LoadingScreen label={"Carregando conquistas..."} /> : <div className="achievement-grid">
      {LEVEL_BADGES.map(badge => {
        const progress = data.find(item => item.nivel === badge.level)
        return <div className={`achievement-item achievement-level-${badge.level.toLowerCase()} ${progress?.conquistada ? 'is-earned' : 'is-locked'}`} key={badge.level}>
          <img src={badge.src} alt={`Insígnia de cibersegurança - nível ${badge.title}`} width={240} height={160} />
          <h3>{badge.title}</h3>
          <strong>{progress?.conquistada ? 'Conquistada' : 'Em progresso'}</strong>
          <p>{progress?.aulasConcluidas ?? 0} de {progress?.totalAulas ?? 0} aulas concluídas{progress && !progress.conquistada && progress.aulasConcluidas === progress.totalAulas ? ' · Prova final pendente' : ''}</p>
          {progress?.conquistadaEm && <small>Conquistada em {new Date(progress.conquistadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>}
        </div>
      })}
      <SimulationAchievement profile />
      <QuizAchievement profile />
      <LaboratoryAchievement profile />
    </div>}
  </article>
}

