'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GoogleCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')

    if (token) {
      localStorage.setItem('token', token)
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [searchParams, router])

  return <main style={{ padding: '2rem', textAlign: 'center' }}>Entrando...</main>
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: '2rem', textAlign: 'center' }}>Entrando...</main>}>
      <GoogleCallback />
    </Suspense>
  )
}