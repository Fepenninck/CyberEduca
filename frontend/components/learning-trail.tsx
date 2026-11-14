'use client'

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function LearningTrail({ children, label }: { children: ReactNode; label: string }) {
  let cardNumber = 0
  const stops = Children.toArray(children).map(child => ({
    child,
    number: isValidElement<{ className?: string }>(child) && child.props.className?.split(' ').includes('learning-path-card') ? ++cardNumber : null,
  }))
  const viewport = useRef<HTMLDivElement>(null)
  const animation = useRef<number | null>(null)
  const target = useRef<number | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const held = useRef(false)
  const inset = useRef(0)
  const routeScale = useRef(1)
  const anchors = () => {
    const element = viewport.current
    if (!element) return [0]
    const max = Math.max(0, element.scrollWidth - element.clientWidth)
    return [0, ...Array.from(element.querySelectorAll<HTMLElement>('.learning-trail-stop'), stop => Math.max(0, Math.min(max, stop.offsetLeft * routeScale.current - inset.current))), max]
  }
  const [activeLevel, setActiveLevel] = useState('BASICO')
  const stopAnimation = () => {
    if (animation.current !== null) cancelAnimationFrame(animation.current)
    animation.current = null
    target.current = null
  }
  const stopHold = () => {
    if (holdTimer.current !== null) clearTimeout(holdTimer.current)
    holdTimer.current = null
    if (held.current) stopAnimation()
  }
  const startHold = (direction: number) => {
    stopHold()
    held.current = false
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null
      stopAnimation()
      held.current = true
      let previous = performance.now()
      const tick = (now: number) => {
        const element = viewport.current
        if (!element) return
        const delta = Math.min(now - previous, 40)
        previous = now
        element.scrollLeft += direction * delta * 0.42
        animation.current = requestAnimationFrame(tick)
      }
      animation.current = requestAnimationFrame(tick)
    }, 220)
  }
  useEffect(() => {
    const stop = () => stopHold()
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
    return () => {
      stopHold()
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
    }
  }, [])
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const resize = () => {
      const left = element.parentElement?.getBoundingClientRect().left ?? 0
      inset.current = Math.max(0, left)
      element.style.marginLeft = `${-inset.current}px`
      element.style.width = `${document.documentElement.clientWidth}px`
      const route = element.querySelector<HTMLElement>('.learning-trail-route')
      if (route) {
        const scale = Math.min(1, Math.max(0.1, (element.clientHeight - 12) / Math.max(1, route.offsetHeight)))
        routeScale.current = scale
        route.style.setProperty('zoom', String(scale))
        route.style.paddingLeft = `${inset.current / scale}px`
        route.style.paddingRight = `${inset.current / scale}px`
        const roadY = route.getBoundingClientRect().bottom - 51 * scale
        route.querySelectorAll<HTMLElement>('.learning-trail-stop').forEach(stop => {
          const stem = stop.querySelector<HTMLElement>('.learning-trail-stem')
          if (stem) stem.style.height = `${Math.max(0, (roadY - stop.getBoundingClientRect().bottom) / scale)}px`
        })
      }
    }
    resize()
    const page = element.closest<HTMLElement>('.learning-paths-page')
    const updateLevel = () => {
      const focus = element.getBoundingClientRect().left + element.clientWidth / 2
      const cards = Array.from(element.querySelectorAll<HTMLElement>('[data-level]'))
      // Mistura os halos pela posição dos cards, sem trocar uma cor por vez.
      const levels = ['BASICO', 'INTERMEDIARIO', 'AVANCADO']
      const weights = levels.map(level => cards.reduce((total, card) => {
        if (card.dataset.level !== level) return total
        const distance = card.getBoundingClientRect().left + card.clientWidth / 2 - focus
        return total + Math.exp(-0.5 * (distance / 320) ** 2)
      }, 0))
      const totalWeight = weights.reduce((total, weight) => total + weight, 0)
      page?.querySelectorAll<HTMLElement>('.trail-ambient > span').forEach((halo, index) => {
        halo.style.opacity = String(totalWeight > 0 ? weights[index] / totalWeight : index === 0 ? 1 : 0)
      })
      const nearest = cards.reduce<HTMLElement | null>((best, card) => {
        const distance = (item: HTMLElement) => Math.abs(item.getBoundingClientRect().left + item.clientWidth / 2 - focus)
        return !best || distance(card) < distance(best) ? card : best
      }, null)
      const level = nearest?.dataset.level ?? 'BASICO'
      if (page) page.dataset.activeLevel = level
      setActiveLevel(previous => previous === level ? previous : level)
    }
    updateLevel()
    element.addEventListener('scroll', updateLevel, { passive: true })
    const observer = new ResizeObserver(() => { resize(); updateLevel() })
    if (element.parentElement) observer.observe(element.parentElement)
    observer.observe(element)
    const route = element.querySelector('.learning-trail-route')
    if (route) observer.observe(route)
    window.addEventListener('resize', resize)
    return () => { observer.disconnect(); element.removeEventListener('scroll', updateLevel); window.removeEventListener('resize', resize); stopAnimation() }
  }, [])
  const gesture = useRef({ x: 0, scroll: 0, active: false, dragged: false })
  useEffect(() => {
    const finish = () => {
      const shouldAlign = gesture.current.active && gesture.current.dragged
      gesture.current.active = false
      viewport.current?.classList.remove('is-dragging')
      const element = viewport.current
      if (shouldAlign && element) {
        const nearest = anchors().reduce((best, value) => Math.abs(value - element.scrollLeft) < Math.abs(best - element.scrollLeft) ? value : best, 0)
        animateTo(nearest)
      }
    }
    const drag = (event: PointerEvent) => {
      const state = gesture.current
      const element = viewport.current
      if (!state.active || !element) return
      if (event.buttons === 0) { finish(); return }
      const distance = event.clientX - state.x
      if (Math.abs(distance) > 3 || state.dragged) {
        state.dragged = true
        element.classList.add('is-dragging')
        element.scrollLeft = state.scroll - distance
        event.preventDefault()
      }
    }
    window.addEventListener('pointermove', drag, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('blur', finish)
    return () => {
      window.removeEventListener('pointermove', drag)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('blur', finish)
    }
  }, [])
  const move = (direction: number) => {
    const element = viewport.current
    if (!element) return
    const current = target.current ?? element.scrollLeft
    const positions = anchors().sort((a, b) => a - b)
    const destination = direction > 0 ? positions.find(value => value > current + 4) ?? positions[positions.length - 1] : positions.slice().reverse().find(value => value < current - 4) ?? 0
    animateTo(destination)
  }
  const animateTo = (destination: number) => {
    const element = viewport.current
    if (!element) return
    if (animation.current !== null) cancelAnimationFrame(animation.current)
    const start = element.scrollLeft
    const started = performance.now()
    target.current = destination
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 320)
      const eased = 1 - (1 - progress) ** 3
      element.scrollLeft = start + (destination - start) * eased
      if (progress < 1) animation.current = requestAnimationFrame(tick)
      else { animation.current = null; target.current = null }
    }
    animation.current = requestAnimationFrame(tick)
  }
  return <div className="learning-trail">
    <div className="learning-trail-controls">
      <span className="trail-active-level" data-level={activeLevel}>{activeLevel === 'BASICO' ? 'Básico' : activeLevel === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}<small>Arraste para explorar o percurso</small></span>
      <div>{[-1, 1].map(direction => <button key={direction} type="button"
        onPointerDown={event => {
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          startHold(direction)
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0 || !held.current) move(direction) }}
        aria-label={`${direction === -1 ? 'Voltar' : 'Avançar'} no percurso ${label}. Segure para deslizar continuamente.`}>
        {direction === -1 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>)}</div>
    </div>
    <div className="learning-trail-viewport" ref={viewport} role="region" aria-label={`Percurso de ${label}`} tabIndex={0}
      onDragStart={event => event.preventDefault()}
      onWheel={stopAnimation}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
      }}
      onPointerDown={event => {
        stopAnimation()
        if (event.pointerType === 'touch' || event.button !== 0) return
        if (!(event.target as HTMLElement).closest('a, button')) event.preventDefault()
        gesture.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, active: true, dragged: false }
      }}
      onClickCapture={event => { if (gesture.current.dragged) { event.preventDefault(); event.stopPropagation(); gesture.current.dragged = false } }}
    >
      <ol className="learning-trail-route">
        <li className="learning-trail-sign" aria-hidden="true"><img src="/images/percurso/placa.png" alt="" width={1024} height={1536} draggable={false} /><span>Seu percurso</span></li>
        {stops.map(({ child, number }, index) => <li className="learning-trail-stop" key={index}>{number !== null && <span className="learning-trail-marker" aria-hidden="true">{String(number).padStart(2, '0')}</span>}{child}<span className="learning-trail-stem" aria-hidden="true" /></li>)}
        <li className="learning-trail-sign" aria-hidden="true"><img src="/images/percurso/placa.png" alt="" width={1024} height={1536} draggable={false} /><span>Fim do percurso</span></li>
      </ol>
    </div>
  </div>
}
