'use client'

import { TermsDocument, type PublishedTermsData } from '@/components/published-terms'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { StudentDashboardBackdrop } from '@/components/student-dashboard-backdrop'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import './aceitar-termos.css'

export default function AceitarTermosPage() {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const modal = dialog.current
    if (modal && !modal.open) modal.showModal()
    modal?.querySelector('h1')?.focus({ preventScroll: true })
    return () => modal?.close()
  }, [])
  const [termsVersion, setTermsVersion] = useState('')
  const [terms, setTerms] = useState<PublishedTermsData | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    apiFetch('/auth/termos', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setTerms(data); setTermsVersion(data.termsVersion) })
      .catch(() => setError('Não foi possível carregar os termos. Atualize a página.'))
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!accepted || !termsVersion || busy) return
    setBusy(true); setError('')
    try {
      const response = await apiFetch('/auth/termos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedTerms: accepted, termsVersion }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Não foi possível salvar o aceite.')
      }
      window.location.replace('/dashboard')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tente novamente.'); setBusy(false) }
  }
  return <main className="terms-welcome-page">
    <StudentDashboardBackdrop />
    <dialog ref={dialog} className="terms-welcome-card" aria-labelledby="terms-welcome-title" aria-describedby="terms-welcome-description" onCancel={event => event.preventDefault()}>
      <header className="terms-welcome-heading">
        <div className="terms-welcome-symbol"><ShieldCheck size={26} aria-hidden="true" /></div>
        <h1 id="terms-welcome-title" tabIndex={-1}>Antes de começar</h1>
        <p id="terms-welcome-description">Leia e aceite os Termos de Uso para começar sua jornada no CyberEduca+.</p>
      </header>
      {terms ? <div aria-label="Termos de Uso publicados" className="terms-welcome-document" tabIndex={0}><TermsDocument terms={terms} compact /></div> : !error && <p role="status" className="terms-welcome-loading">Carregando os termos…</p>}
      <form className="terms-welcome-form" onSubmit={submit}>
        <p className="terms-welcome-links"><Link href="/politicas#termos-de-uso" target="_blank" rel="noopener noreferrer">Ler Termos de Uso</Link><span>·</span><Link href="/politicas#politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link></p>
        <label className="terms-welcome-choice"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy || !terms} required /><span>Li e aceito os Termos de Uso.</span></label>
        {error && <p role="alert" className="terms-welcome-error">{error}</p>}
        <button className="terms-welcome-submit" type="submit" disabled={!accepted || !termsVersion || busy}>{busy ? 'Salvando…' : 'Aceitar e continuar'}</button>
      </form>
      <p className="terms-welcome-back-wrap"><Link className="terms-welcome-back" href="/login">Voltar ao login</Link></p>
    </dialog>
  </main>
}
