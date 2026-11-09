'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { API_URL } from '@/lib/api'

export default function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    fetch(`${API_URL}/aulas/${slug}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar a aula.')
        const lesson: { id: string; trilha: { id: string } } = await response.json()
        if (!controller.signal.aborted) {
          router.replace(`/aulas/modulo/${lesson.trilha.id}/aula/${lesson.id}`)
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Erro inesperado.')
      })
    return () => controller.abort()
  }, [slug, router])

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <p className="content-wrap">{error || 'Carregando aula...'}</p>
    </main>
  )
}
