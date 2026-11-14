'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { GooeyLoader } from './gooey-loader'
export function LoadingScreen({ label = 'Carregando…', fullscreen = false, delayMs = 200 }: { label?: string; fullscreen?: boolean; delayMs?: number }) {
  const [visible, setVisible] = useState(delayMs === 0)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])
  const [navbarBottom, setNavbarBottom] = useState(0)
  const [pageBackground, setPageBackground] = useState<string>()
  useLayoutEffect(() => {
    if (!fullscreen) return
    let header: Element | null = null
    const resize = new ResizeObserver(() => update())
    const update = () => {
      const next = document.querySelector('.dashboard-header')
      if (next !== header) { resize.disconnect(); header = next; if (header) resize.observe(header) }
      const bottom = header?.getBoundingClientRect().bottom ?? 0
      setNavbarBottom(Math.min(window.innerHeight, Math.max(0, bottom)))
      const pages = Array.from(document.querySelectorAll('main')).filter(element => !element.closest('.site-loading-screen'))
      let page: Element | null = header?.closest('.app-shell') ?? pages[pages.length - 1] ?? document.body
      let background: string | undefined
      while (page) {
        const color = window.getComputedStyle(page).backgroundColor
        if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') { background = color; break }
        page = page.parentElement
      }
      setPageBackground(background)
    }
    update()
    const mutations = new MutationObserver(update)
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    return () => { resize.disconnect(); mutations.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update) }
  }, [fullscreen])
  if (!visible) return null
  return <div className={`site-loading-screen${fullscreen ? ' is-fullscreen' : ''}`} style={fullscreen ? { top: navbarBottom, minHeight: `calc(100dvh - ${navbarBottom}px)`, backgroundColor: pageBackground } : undefined} aria-busy="true"><GooeyLoader label="Carregando" size={104} count={4} goo={18} /></div>
}
