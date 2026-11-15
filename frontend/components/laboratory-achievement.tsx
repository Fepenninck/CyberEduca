'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import './simulation-achievement.css'

type Achievement = { conquistada: boolean; conquistadaEm: string | null }

export function LaboratoryAchievement({ profile = false, earnedOnly = false }: { profile?: boolean; earnedOnly?: boolean }) {
  const [data, setData] = useState<Achievement | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let request = 0
    async function load() {
      const current = ++request
      try {
        const response = await apiFetch('/usuarios/me/conquistas/laboratorio', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error()
        const result: Achievement = await response.json()
        if (!controller.signal.aborted && current === request) { setData(result); setError(false) }
      } catch { if (!controller.signal.aborted && current === request) setError(true) }
    }
    void load()
    window.addEventListener('focus', load)
    window.addEventListener('laboratory-progress-updated', load)
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('laboratory-progress-updated', load) }
  }, [retry])

  if (earnedOnly && (!data?.conquistada || error)) return null
  const earned = Boolean(data?.conquistada && !error)
  return <div className={`${profile ? 'achievement-item' : 'simulation-achievement'} laboratory-achievement ${earned ? 'is-earned' : 'is-locked'}`} role={earned ? 'status' : undefined}>
    <img src="/images/insignias/laboratorio.png" alt="Insígnia do Laboratório de Cibersegurança" width={1263} height={1246} loading="lazy" />
    <div className="simulation-achievement-copy">
      {profile ? <h3>Laboratório</h3> : <h2>Você conquistou a insígnia do Laboratório!</h2>}
      <strong>{error ? 'Conquista indisponível' : !data ? 'Carregando...' : earned ? 'Conquistada' : 'Em progresso'}</strong>
      {error ? <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button> : data && <>
        <p>{earned ? 'Primeiro teste no laboratório concluído.' : 'Consulte um domínio no laboratório para ganhar esta insígnia.'}</p>
        {!profile && <p>Sua insígnia já está disponível nas conquistas do perfil.</p>}
        {data.conquistadaEm && <small>Conquistada em {new Date(data.conquistadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>}
      </>}
    </div>
  </div>
}
