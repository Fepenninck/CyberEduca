'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import '../login.css'
import { apiFetch } from '@/lib/api'

export default function ConfirmarLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const token = new URLSearchParams(window.location.search).get('token')
    window.history.replaceState(null, '', '/login/confirmar')

    if (!token) {
      setError('Link de acesso inválido. Entre novamente para receber outro.')
      return
    }

    apiFetch('/auth/login/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (resposta) => {
        const dados = await resposta.json().catch(() => ({}))
        if (!resposta.ok) {
          setError(dados.message || 'Não foi possível confirmar o acesso.')
          return
        }
        router.replace(dados.papel === 'ADMIN' ? '/admin' : '/dashboard')
      })
      .catch(() => setError('Erro de conexão com o servidor.'))
  }, [router])

  return (
    <main className="login-page recovery-page">
      <div className="login-shell recovery-shell">
        <Link href="/" className="login-brand" aria-label="Voltar para o início do CyberEduca+">
          <img src="/cybereduca-logo.png" alt="CyberEduca+" />
        </Link>

        <section className="login-card recovery-card" aria-labelledby="confirm-title">
          {error ? (
            <div className="recovery-success" role="alert">
              <span className="recovery-icon"><AlertCircle aria-hidden="true" /></span>
              <h1 id="confirm-title">Não foi possível entrar</h1>
              <p>{error}</p>
              <button className="login-submit recovery-submit" type="button" onClick={() => router.replace('/login')}>Voltar para o login</button>
            </div>
          ) : (
            <div className="recovery-success" role="status">
              <span className="recovery-icon recovery-icon-success"><ShieldCheck aria-hidden="true" /></span>
              <h1 id="confirm-title">Confirmando seu acesso...</h1>
              <p>Aguarde um instante. Você será levado ao CyberEduca+ automaticamente.</p>
            </div>
          )}
        </section>
      </div>

    <footer className="login-footer">
      <span>Copyright © 2026 <Link href="/">CyberEduca+</Link>.</span>
      <span>Todos os direitos reservados. <Link href="/politicas#termos-de-uso">Termos de Uso</Link>, <Link href="/politicas#politica-de-privacidade">Política de Privacidade e LGPD</Link></span>
    </footer>
    </main>
  )
}
