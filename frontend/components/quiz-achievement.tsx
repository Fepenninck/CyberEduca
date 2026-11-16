'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import './simulation-achievement.css'

type Achievement = { totalQuizzes: number; quizzesConcluidos: number; conquistada: boolean; conquistadaEm: string | null }

export function QuizAchievement({ profile = false, earnedOnly = false }: { profile?: boolean; earnedOnly?: boolean }) {
  const [data, setData] = useState<Achievement | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let request = 0
    async function load() {
      const current = ++request
      try {
        const response = await apiFetch('/usuarios/me/conquistas/quizzes', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error()
        const result: Achievement = await response.json()
        if (!controller.signal.aborted && current === request) { setData(result); setError(false) }
      } catch { if (!controller.signal.aborted && current === request) setError(true) }
    }
    void load()
    window.addEventListener('focus', load)
    window.addEventListener('quiz-progress-updated', load)
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('quiz-progress-updated', load) }
  }, [retry])

  if (earnedOnly && (!data?.conquistada || error)) return null
  const earned = Boolean(data?.conquistada && !error)
  return <div className={`${profile ? 'achievement-item' : 'simulation-achievement'} quiz-achievement ${earned ? 'is-earned' : 'is-locked'}`} role={earned ? 'status' : undefined}>
    <img src="/images/insignias/quizzes.png" alt="Insígnia dourada de Quizzes" width={1254} height={1254} loading="lazy" />
    <div className="simulation-achievement-copy">
      {profile ? <h3>Quizzes</h3> : <h2>Você conquistou a insígnia de Quizzes!</h2>}
      <strong>{error ? 'Conquista indisponível' : !data ? 'Carregando...' : earned ? 'Conquistada' : 'Em progresso'}</strong>
      {error ? <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button> : data && <>
        <p>{data.quizzesConcluidos} de {data.totalQuizzes} quizzes concluídos</p>
        {!profile && <p>Você respondeu a todos os quizzes publicados. Sua insígnia já está disponível no perfil.</p>}
        {profile && !earned && <p>Responda a todas as perguntas de cada quiz publicado para conquistar esta insígnia.</p>}
        {data.conquistadaEm && <small>Conquistada em {new Date(data.conquistadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>}
      </>}
    </div>
  </div>
}
