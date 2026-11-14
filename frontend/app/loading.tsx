'use client'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { usePathname } from 'next/navigation'
import { isStudentPath } from '@/lib/student-routes'
import { useEffect } from 'react'
import { beginLoading } from '@/lib/loading-state'
export default function Loading() {
  const pathname = usePathname()
  useEffect(() => {
    if (!/^\/admin(\/|$)/.test(pathname)) return beginLoading()
  }, [pathname])
  if (/^\/admin(\/|$)/.test(pathname)) return <p role="status" className="p-6 text-sm text-slate-400">Carregando…</p>
  return isStudentPath(pathname) ? <main className="app-shell dashboard-page"><DashboardNavigation /><LoadingScreen fullscreen /></main> : <LoadingScreen fullscreen />
}
