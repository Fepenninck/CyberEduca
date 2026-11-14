'use client'
import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function CourseCarousel({ children, label, desktopVisible = 4 }: { children: ReactNode; label: string; desktopVisible?: number }) {
  const viewport = useRef<HTMLDivElement>(null)
  const cards = Children.toArray(children)
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState({ width: 0, visible: desktopVisible })
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const measure = () => setSize({ width: element.clientWidth, visible: window.innerWidth <= 700 ? 1 : window.innerWidth <= 1100 ? 2 : desktopVisible })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [desktopVisible])
  const max = Math.max(0, cards.length - size.visible)
  const current = Math.min(index, max)
  const step = (size.width + 16) / size.visible
  return <div className="course-carousel" data-course-count={cards.length} role="region" aria-label={`Trilhas de ${label}`}><button type="button" className="course-carousel-arrow previous" disabled={current === 0} onClick={() => setIndex(Math.max(0, current - 1))} aria-label={`Ver trilhas anteriores de ${label}`}><ChevronLeft size={24} /></button><div className="course-carousel-window" ref={viewport} tabIndex={0} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); setIndex(Math.min(max, current + 1)) } if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(Math.max(0, current - 1)) } }}><div className="learning-level-cards course-carousel-track" style={{ transform: `translate3d(${-current * step}px,0,0)` }}>{cards}</div></div><button type="button" className="course-carousel-arrow next" disabled={current === max} onClick={() => setIndex(Math.min(max, current + 1))} aria-label={`Ver próximas trilhas de ${label}`}><ChevronRight size={24} /></button><span className="sr-only" aria-live="polite">{cards.length ? `Trilhas ${current + 1} a ${Math.min(cards.length,current + size.visible)} de ${cards.length}` : 'Nenhuma trilha'}</span></div>
}
