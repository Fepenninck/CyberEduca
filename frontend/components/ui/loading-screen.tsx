'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isStudentPath } from '@/lib/student-routes'
import { GooeyLoader } from './gooey-loader'

export function LoadingScreen({ label = 'Carregando…', fullscreen = false, delayMs = 200 }: { label?: string; fullscreen?: boolean; delayMs?: number }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(delayMs === 0)
  const student = isStudentPath(pathname)
  const [navbarBottom, setNavbarBottom] = useState<number | null>(null)
  useEffect(() => {
    if (delayMs === 0) { setVisible(true); return }
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  useLayoutEffect(() => {
    if (!fullscreen) return
    let frame: number | null = null
    let header: Element | null = null
    const resize = new ResizeObserver(() => schedule())
    const update = () => {
      frame = null
      const nextHeader = document.querySelector('.dashboard-header')
      if (nextHeader !== header) {
        resize.disconnect(); header = nextHeader
        if (header) resize.observe(header)
      }
      // O overlay ja existe no HTML inicial; a medicao apenas refina a posicao.
      if (isStudentPath(pathname) && !header) return
      const bottom = Math.min(window.innerHeight, Math.max(0, header?.getBoundingClientRect().bottom ?? 0))
      setNavbarBottom(previous => previous === bottom ? previous : bottom)
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(update) }
    update()
    // Apenas mudancas de estrutura: sem observar classes nem recalcular cores.
    const mutations = new MutationObserver(schedule)
    mutations.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      resize.disconnect(); mutations.disconnect()
      window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule)
    }
  }, [fullscreen, pathname])

  if (!visible) return null
  return <div className={`site-loading-screen${fullscreen ? ' is-fullscreen' : ''}${fullscreen && student ? ' is-student' : ''}${fullscreen && pathname === '/' ? ' is-home' : ''}`} style={fullscreen ? { top: navbarBottom ?? undefined, minHeight: navbarBottom === null ? undefined : `calc(100dvh - ${navbarBottom}px)` } : undefined} aria-busy="true"><GooeyLoader label={label} size={104} count={4} goo={18} /></div>
}
