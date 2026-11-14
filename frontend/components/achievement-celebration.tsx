'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { apiFetch, getCurrentUser } from '@/lib/api'
import { LEVEL_BADGES } from './level-achievements'
import './achievement-celebration.css'

type Earned = { nivel: string; conquistada: boolean; conquistadaEm: string | null }
export function AchievementCelebration() {
  const pathname = usePathname()
  const [queue, setQueue] = useState<Earned[]>([])
  const shown = useRef(new Set<string>())
  const dialog = useRef<HTMLDialogElement>(null)
  const active = queue[0]
  const badge = LEVEL_BADGES.find(item => item.level === active?.nivel)
  useEffect(() => {
    if (!/^\/(aulas|trilhas|perfil|dashboard)(\/|$)/.test(pathname)) { setQueue([]); return }
    let disposed = false
    let loading = false
    const load = async () => {
      if (loading) return
      loading = true
      try {
        const user = await getCurrentUser()
        const response = await apiFetch('/usuarios/me/conquistas', { cache: 'no-store' })
        if (!response.ok || disposed) return
        const items: Earned[] = await response.json()
        if (disposed) return
        const fresh = items.filter(item => {
          if (!item.conquistada || !item.conquistadaEm) return false
          const key = `cybereduca-achievement:${user.id}:${item.nivel}:${item.conquistadaEm}`
          if (shown.current.has(key)) return false
          try { if (localStorage.getItem(key)) return false } catch { /* Memória mantém o controle nesta sessão. */ }
          shown.current.add(key)
          try { localStorage.setItem(key, 'shown') } catch { /* Armazenamento indisponível não impede a conquista. */ }
          return true
        })
        if (fresh.length) setQueue(previous => [...previous, ...fresh])
      } catch { /* A conquista continua disponível no perfil se a consulta falhar. */ }
      finally { loading = false }
    }
    void load()
    window.addEventListener('learning-progress-updated', load)
    window.addEventListener('focus', load)
    return () => { disposed = true; window.removeEventListener('learning-progress-updated', load); window.removeEventListener('focus', load) }
  }, [pathname])
  useEffect(() => {
    if (active && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [active])
  if (!badge) return null
  const dismiss = () => { dialog.current?.close(); setQueue(previous => previous.slice(1)) }
  return createPortal(<dialog ref={dialog} className="achievement-celebration" aria-labelledby="achievement-celebration-title" onCancel={event => { event.preventDefault(); dismiss() }}>
    <div key={active.nivel} className="achievement-celebration-content" style={{ '--badge-color': badge.color } as React.CSSProperties}>
      <span className="achievement-celebration-kicker">Nova conquista desbloqueada</span>
      <img src={badge.src} alt={`Insígnia do nível ${badge.title}`} width={450} height={300} />
      <h2 id="achievement-celebration-title">Nível {badge.title} concluído!</h2>
      <p>Você concluiu todas as aulas deste nível. Sua insígnia já está nas conquistas do seu perfil.</p>
      <button type="button" onClick={dismiss} autoFocus>Continuar aprendendo</button>
    </div>
  </dialog>, document.body)
}
