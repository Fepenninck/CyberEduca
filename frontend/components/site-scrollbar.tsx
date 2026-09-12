'use client'

import { useEffect, useRef, useState } from 'react'

const MIN_THUMB_HEIGHT = 32

export function SiteScrollbar() {
  const [metrics, setMetrics] = useState({ top: 0, height: MIN_THUMB_HEIGHT })
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const scrollToPointer = (clientY: number) => {
    const track = trackRef.current
    if (!track) return
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const maxTop = track.clientHeight - metrics.height
    const position = Math.max(0, Math.min(maxTop, clientY - track.getBoundingClientRect().top - metrics.height / 2))
    window.scrollTo({ top: maxTop > 0 ? (position / maxTop) * maxScroll : 0 })
  }

  useEffect(() => {
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const height = Math.max(MIN_THUMB_HEIGHT, Math.min(window.innerHeight, (window.innerHeight * window.innerHeight) / document.documentElement.scrollHeight))
      const maxTop = window.innerHeight - height
      setMetrics({ top: maxScroll > 0 ? (window.scrollY / maxScroll) * maxTop : 0, height })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); observer.disconnect() }
  }, [])

  return <div ref={trackRef} className="site-scrollbar" aria-hidden="true" onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); scrollToPointer(event.clientY) }} onPointerMove={(event) => { if (dragging.current) scrollToPointer(event.clientY) }} onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }}><i style={{ height: `${metrics.height}px`, transform: `translateY(${metrics.top}px)` }} /></div>
}
