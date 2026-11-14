'use client'

import { useId } from 'react'
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
    <svg aria-hidden="true" className="gooey-loader-canvas" viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ width: size, height: size, display: 'block', overflow: 'visible' }}>
      <defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation={size * .045} result="blur" /><feColorMatrix in="blur" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${goo} -${Math.round(goo * .39)}`} /></filter></defs>
    <g filter={`url(#${id})`} fill={color}>{Array.from({ length: count }, (_, index) => {
      const angle = Math.PI * 2 * index / count
      const positions = [0, 1, 2, 3, 4].map(step => {
        const distance = step % 2 ? orbit * .2 : orbit
        const rotation = angle + step * Math.PI / 2
        return { x: center + Math.cos(rotation) * distance, y: center + Math.sin(rotation) * distance }
      })
      const timing = { dur: `${duration}s`, repeatCount: 'indefinite', begin: `${-index * duration / (count * 2)}s`, calcMode: 'spline' as const, keyTimes: '0;.25;.5;.75;1', keySplines: '.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1' }
      return <circle key={index} cx={positions[0].x} cy={positions[0].y} r={radius}><animate attributeName="cx" values={positions.map(point => point.x.toFixed(2)).join(';')} {...timing} /><animate attributeName="cy" values={positions.map(point => point.y.toFixed(2)).join(';')} {...timing} /></circle>
    })}</g></svg><span className="sr-only">{label}</span>
  </span>
}
export default GooeyLoader
