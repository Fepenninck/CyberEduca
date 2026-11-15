'use client'

import { useId, type CSSProperties } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import './gooey-loader.css'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export interface GooeyLoaderProps { label: string; size?: number; count?: number; color?: string; duration?: number; goo?: number; className?: string }
export function GooeyLoader({ label, size = 96, count = 4, color = 'var(--color-accent-strong, #b2f511)', duration = 2.6, goo = 18, className }: GooeyLoaderProps) {
  const id = `goo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const center = size / 2
  const radius = size * .145
  const orbit = size * .27
  return <span role="status" aria-live="polite" className={cn('gooey-loader relative grid place-items-center', className)} style={{ width: size, height: size }}>
    <svg aria-hidden="true" className="gooey-loader-filter" width="0" height="0" focusable="false">
      <defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation={size * .045} result="blur" /><feColorMatrix in="blur" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${goo} -${Math.round(goo * .39)}`} /></filter></defs>
    </svg>
    <span aria-hidden="true" className="gooey-loader-canvas" style={{ filter: `url(#${id})`, width: size, height: size }}>{Array.from({ length: count }, (_, index) => {
      const angle = Math.PI * 2 * index / count
      const positions = [0, 1, 2, 3, 4].map(step => {
        const distance = step % 2 ? orbit * .2 : orbit
        const rotation = angle + step * Math.PI / 2
        return { x: Math.cos(rotation) * distance, y: Math.sin(rotation) * distance }
      })
      const style = {
        width: radius * 2, height: radius * 2, left: center - radius, top: center - radius,
        backgroundColor: color,
        '--gooey-duration': `${duration}s`, '--gooey-delay': `${-index * duration / (count * 2)}s`,
        ...Object.fromEntries(positions.flatMap((point, step) => [[`--gooey-x${step}`, `${point.x.toFixed(2)}px`], [`--gooey-y${step}`, `${point.y.toFixed(2)}px`]])),
      } as CSSProperties
      return <span key={index} className="gooey-loader-dot" style={style} />
    })}</span><span className="sr-only">{label}</span>
  </span>
}
export default GooeyLoader
