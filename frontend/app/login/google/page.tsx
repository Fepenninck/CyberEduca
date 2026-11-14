'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { beginRouteLoading } from '@/lib/loading-state'

function GoogleCallback() {
  const router = useRouter()

  useEffect(() => {
    beginRouteLoading()
    router.replace('/dashboard')
  }, [router])

  return <main className="login-page"><LoadingScreen fullscreen /></main>
}

export default function GoogleCallbackPage() {
  return <GoogleCallback />
}
