'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import './simulation-achievement.css'

type Achievement = { totalSimulacoes: number; simulacoesConcluidas: number; conquistada: boolean; conquistadaEm: string | null }

export function SimulationAchievement({ profile = false, earnedOnly = false }: { profile?: boolean; earnedOnly?: boolean }) {
  const [data, setData] = useState<Achievement | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let request = 0
    async function load() {
      const current = ++request
      try {
        const response = await apiFetch('/usuarios/me/conquistas/simulacoes', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error()
        const result: Achievement = await response.json()
        if (!controller.signal.aborted && current === request) { setData(result); setError(false) }
      } catch { if (!controller.signal.aborted && current === request) setError(true) }
    }
    void load()
    window.addEventListener('focus', load)
    window.addEventListener('simulation-progress-updated', load)
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('simulation-progress-updated', load) }
  }, [retry])

  if (earnedOnly && (!data?.conquistada || error)) return null
  const earned = data?.conquistada && !error
  return <div className={`${profile ? 'achievement-item' : 'simulation-achievement'} ${earned ? 'is-earned' : 'is-locked'}`} role={earned ? 'status' : undefined}>
    <img src="/images/insignias/simulacoes.webp" alt="Insígnia Simulações - Lab Prático" width={900} height={600} loading="lazy" />
    <div className="simulation-achievement-copy">
      {profile ? <h3>Simulações</h3> : <h2>{earned ? 'Você conquistou a insígnia de Simulações!' : 'Sua próxima conquista: Simulações'}</h2>}
      <strong>{error ? 'Conquista indisponível' : !data ? 'Carregando...' : earned ? 'Conquistada' : 'Em progresso'}</strong>
      {error ? <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button> : data && <>
        <p>{data.simulacoesConcluidas} de {data.totalSimulacoes} simulações concluídas</p>
        {!profile && <p>{earned ? 'Você concluiu todos os cenários e treinos práticos. A insígnia já aparece no seu perfil.' : 'Conclua todos os cenários de phishing e treinos práticos para ganhar esta insígnia.'}</p>}
        {data.conquistadaEm && <small>Conquistada em {new Date(data.conquistadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>}
      </>}
    </div>
  </div>
}
