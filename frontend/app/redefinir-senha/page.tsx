'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import '../login/login.css'
import { apiFetch } from '@/lib/api'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    setToken(new URLSearchParams(window.location.search).get('token'))
    window.history.replaceState(null, '', '/redefinir-senha')
    setReady(true)
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setError('As senhas não coincidem.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const resposta = await apiFetch('/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      const dados = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        setError(Array.isArray(dados.message) ? dados.message.join(' ') : dados.message || 'Não foi possível redefinir a senha.')
        return
      }

      router.replace('/login?senha=redefinida')
    } catch {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page recovery-page">
      <div className="login-shell recovery-shell">
        <Link href="/" className="login-brand" aria-label="Voltar para o início do CyberEduca+">
          <img src="/cybereduca-logo.png" alt="CyberEduca+" />
        </Link>

        <section className="login-card recovery-card" aria-labelledby="reset-title">
          {ready && !token ? (
            <div className="recovery-success" role="alert">
              <span className="recovery-icon"><AlertCircle aria-hidden="true" /></span>
              <h1 id="reset-title">Link inválido</h1>
              <p>Este link de recuperação não é válido. Peça um novo link para redefinir sua senha.</p>
              <button className="login-submit recovery-submit" type="button" onClick={() => router.replace('/esqueci-senha')}>Pedir novo link</button>
            </div>
          ) : (
            <>
              <h1 id="reset-title">Defina uma nova senha</h1>
              <p className="recovery-description">Use pelo menos 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.</p>
              <form onSubmit={submit} noValidate>
                <div className="login-field recovery-field">
                  <label htmlFor="nova-senha">Nova senha</label>
                  <div className={`login-input${error ? ' is-invalid' : ''}`}>
                    <input id="nova-senha" name="nova-senha" type="password" autoComplete="new-password" value={senha} onChange={(event) => { setSenha(event.target.value); setError('') }} aria-invalid={Boolean(error)} autoFocus />
                  </div>
                </div>
                <div className="login-field recovery-field">
                  <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                  <div className={`login-input${error ? ' is-invalid' : ''}`}>
                    <input id="confirmar-senha" name="confirmar-senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(event) => { setConfirmacao(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'reset-error' : undefined} />
                    {error && <AlertCircle aria-hidden="true" />}
                  </div>
                  {error && <p className="login-error" id="reset-error">{error}</p>}
                </div>
                <button className="login-submit recovery-submit" type="submit" disabled={loading || !ready}>{loading ? 'Salvando...' : 'Salvar nova senha'}</button>
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
