'use client'
import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { finishRouteLoading, getLoadingSnapshot, getServerLoadingSnapshot, subscribeLoading } from '@/lib/loading-state'
import { LoadingScreen } from './ui/loading-screen'

export function LoadingProvider() {
  const pathname = usePathname()
  const loading = useSyncExternalStore(subscribeLoading, getLoadingSnapshot, getServerLoadingSnapshot)
  useEffect(() => { finishRouteLoading() }, [pathname])
  useEffect(() => {
    const clear = () => finishRouteLoading()
    window.addEventListener('pageshow', clear)
    return () => { window.removeEventListener('pageshow', clear); finishRouteLoading() }
  }, [])
  return !/^\/admin(\/|$)/.test(pathname) && loading.visible ? <LoadingScreen fullscreen delayMs={0} /> : null
}
