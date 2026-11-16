'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { apiFetch, getCachedCurrentUser, getCurrentUser } from '@/lib/api'
import { LEVEL_BADGES } from './level-achievements'
import './achievement-celebration.css'

const BADGES = [
  ...LEVEL_BADGES.map(badge => ({ ...badge, heading: `Nível ${badge.title} concluído!`, description: 'Você concluiu as aulas e foi aprovado na prova deste nível.' })),
  { level: 'LABORATORIO', title: 'Laboratório', src: '/images/insignias/laboratorio.png', color: '#00cfff', heading: 'Você conquistou a insígnia do Laboratório!', description: 'Primeiro teste no laboratório concluído.' },
  { level: 'QUIZZES', title: 'Quizzes', src: '/images/insignias/quizzes.png', color: '#ffd34e', heading: 'Você conquistou a insígnia de Quizzes!', description: 'Você concluiu todos os quizzes.' },
  { level: 'SIMULACOES', title: 'Simulações', src: '/images/insignias/simulacoes.webp', color: '#00cfff', heading: 'Você conquistou a insígnia de Simulações!', description: 'Você concluiu todas as simulações.' },
]
const SOURCES = [
  { suffix: '', event: 'learning-progress-updated', route: /\/(aulas|trilhas)(\/|$)/, level: '' },
  { suffix: '/laboratorio', event: 'laboratory-progress-updated', route: /\/verificador(\/|$)/, level: 'LABORATORIO' },
  { suffix: '/quizzes', event: 'quiz-progress-updated', route: /\/quizzes(\/|$)/, level: 'QUIZZES' },
  { suffix: '/simulacoes', event: 'simulation-progress-updated', route: /\/simulacoes(\/|$)/, level: 'SIMULACOES' },
]
type Earned = { nivel: string; conquistada: boolean; conquistadaEm: string | null; key: string }
export function AchievementCelebration() {
  const pathname = usePathname()
  const [queue, setQueue] = useState<Earned[]>([])
  const shown = useRef(new Set<string>())
  const dialog = useRef<HTMLDialogElement>(null)
  const active = queue[0]
  const badge = BADGES.find(item => item.level === active?.nivel)
  useEffect(() => {
    if (!/^\/(aulas|trilhas|perfil|dashboard|quizzes|simulacoes|verificador)(\/|$)/.test(pathname)) { setQueue([]); return }
    let disposed = false
    const load = async (source: typeof SOURCES[number]) => {
      try {
        const user = getCachedCurrentUser() ?? await getCurrentUser()
        const response = await apiFetch(`/usuarios/me/conquistas${source.suffix}`, { cache: 'no-store' })
        if (!response.ok || disposed) return
        const data = await response.json()
        const items: Earned[] = source.level ? [{ ...data, nivel: source.level }] : data
        if (disposed) return
        const fresh = items.flatMap(item => {
          if (!item.conquistada || !item.conquistadaEm || !BADGES.some(badge => badge.level === item.nivel)) return []
          const key = `cybereduca-achievement:${user.id}:${item.nivel}:${item.conquistadaEm}`
          if (shown.current.has(key)) return []
          try { if (localStorage.getItem(key)) return [] } catch { /* Memória mantém o controle nesta sessão. */ }
          shown.current.add(key)
          return [{ ...item, key }]
        })
        if (fresh.length) setQueue(previous => [...previous, ...fresh])
      } catch { /* A conquista continua disponível no perfil se a consulta falhar. */ }
    }
    const currentSources = SOURCES.filter(source => source.route.test(pathname) || /^\/(perfil|dashboard)(\/|$)/.test(pathname))
    const refresh = () => { currentSources.forEach(source => { void load(source) }) }
    const listeners = SOURCES.map(source => ({ event: source.event, listener: () => { void load(source) } }))
    refresh()
    listeners.forEach(({ event, listener }) => window.addEventListener(event, listener))
    window.addEventListener('focus', refresh)
    return () => { disposed = true; listeners.forEach(({ event, listener }) => window.removeEventListener(event, listener)); window.removeEventListener('focus', refresh) }
  }, [pathname])
  useEffect(() => {
    if (active && dialog.current) {
      if (!dialog.current.open) dialog.current.showModal()
      try { localStorage.setItem(active.key, 'shown') } catch { /* Memória mantém o controle nesta sessão. */ }
    }
  }, [active])
  if (!badge) return null
  const dismiss = () => { dialog.current?.close(); setQueue(previous => previous.slice(1)) }
  return createPortal(<dialog ref={dialog} className="achievement-celebration" aria-labelledby="achievement-celebration-title" onCancel={event => { event.preventDefault(); dismiss() }}>
    <div key={active.nivel} className="achievement-celebration-content" style={{ '--badge-color': badge.color } as React.CSSProperties}>
      <span className="achievement-celebration-kicker">Nova conquista desbloqueada</span>
      <img src={badge.src} alt={`Insígnia: ${badge.title}`} width={450} height={300} />
      <h2 id="achievement-celebration-title">{badge.heading}</h2>
      <p>{badge.description} Sua insígnia já está nas conquistas do perfil.</p>
      <button type="button" onClick={dismiss} autoFocus>Continuar aprendendo</button>
    </div>
  </dialog>, document.body)
}
