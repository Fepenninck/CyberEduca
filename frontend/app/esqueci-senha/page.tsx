'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import '../login/login.css'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }

    if (!emailIsValid) {
      setError('Digite um e-mail válido.')
      return
    }

    setError('')
    setSent(true)
  }

  return (
    <main className="login-page recovery-page">
      <div className="login-shell recovery-shell">
        <Link href="/" className="login-brand" aria-label="Voltar para o início do CyberEduca+">
          <img src="/cybereduca-logo.png" alt="CyberEduca+" />
        </Link>

        <section className="login-card recovery-card" aria-labelledby="recovery-title">
          {sent ? (
            <div className="recovery-success" role="status">
              <span className="recovery-icon recovery-icon-success"><CheckCircle2 aria-hidden="true" /></span>
              <h1 id="recovery-title">Confira seu e-mail</h1>
              <p>Se houver uma conta associada a <strong>{email}</strong>, você receberá as instruções para redefinir sua senha.</p>
              <button type="button" className="recovery-secondary" onClick={() => setSent(false)}>Usar outro e-mail</button>
            </div>
          ) : (
            <>
              <h1 id="recovery-title">Esqueceu sua senha?</h1>
              <p className="recovery-description">Informe o e-mail usado no cadastro e enviaremos as instruções para você criar uma nova senha.</p>
              <form onSubmit={submit} noValidate>
                <div className="login-field recovery-field">
                  <label htmlFor="recovery-email">E-mail</label>
                  <div className={`login-input${error ? ' is-invalid' : ''}`}>
                    <input
                      id="recovery-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setError('') }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'recovery-email-error' : undefined}
                      autoFocus
                    />
                    {error && <AlertCircle aria-hidden="true" />}
                  </div>
                  {error && <p className="login-error" id="recovery-email-error">{error}</p>}
                </div>
                <button className="login-submit recovery-submit" type="submit" aria-disabled={!emailIsValid}>Enviar instruções</button>
              </form>
            </>
          )}

          <Link className="recovery-back" href="/login">Voltar para login</Link>
        </section>
      </div>

      <footer className="login-footer">
        <span>Copyright © 2026 <Link href="/">CyberEduca+</Link>.</span>
        <span>Todos os direitos reservados. <Link href="/politicas#termos-de-uso">Termos de Uso</Link>, <Link href="/politicas#politica-de-privacidade">Política de Privacidade e LGPD</Link></span>
      </footer>
    </main>
  )
}
