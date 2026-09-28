'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function GoogleCallbackPage() {
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