'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { finishRouteLoading, getLoadingSnapshot, getServerLoadingSnapshot, subscribeLoading } from '@/lib/loading-state'
import { LoadingScreen } from './ui/loading-screen'

export function LoadingProvider() {
  const pathname = usePathname()
  const [initialLoading, setInitialLoading] = useState(true)
  const loading = useSyncExternalStore(subscribeLoading, getLoadingSnapshot, getServerLoadingSnapshot)
  useEffect(() => {
    // Libera após a hidratação, sem esperar imagens, vídeos ou serviços externos.
    const frame = requestAnimationFrame(() => setInitialLoading(false))
    return () => cancelAnimationFrame(frame)
  }, [])
  useEffect(() => { finishRouteLoading() }, [pathname])
  useEffect(() => {
    const clear = () => finishRouteLoading()
    window.addEventListener('pageshow', clear)
    return () => { window.removeEventListener('pageshow', clear); finishRouteLoading() }
  }, [])
  return initialLoading || (!/^\/admin(\/|$)/.test(pathname) && loading.visible) ? <LoadingScreen fullscreen delayMs={0} /> : null
}
