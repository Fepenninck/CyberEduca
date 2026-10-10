'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function GoogleCallback() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return <main style={{ padding: '2rem', textAlign: 'center' }}>Entrando...</main>
}

export default function GoogleCallbackPage() {
  return <GoogleCallback />
}
