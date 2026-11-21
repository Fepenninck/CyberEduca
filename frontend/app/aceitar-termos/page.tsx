'use client'

import { TermsDocument, usePublishedPrivacy, type PublishedTermsData } from '@/components/published-terms'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import '../login/login.css'
import './consentimento.css'

export default function AceitarTermosPage() {
  const [termsVersion, setTermsVersion] = useState('')
  const [terms, setTerms] = useState<PublishedTermsData | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedDocument, setDocument] = useState<'terms' | 'privacy'>('terms')
  const { terms: privacy, error: privacyError, retry: retryPrivacy } = usePublishedPrivacy()
  const activeDocument = selectedDocument === 'terms' ? terms : privacy
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
  return <main className="login-page"><div className="login-shell"><section className="login-card">
      <h1>Antes de continuar</h1>
      <p>Leia os Termos de Uso para concluir seu acesso com Google.</p>
      <div className="consent-document-tabs" role="tablist" aria-label="Documentos para leitura">
        <button id="consent-terms-tab" type="button" role="tab" aria-selected={selectedDocument === 'terms'} aria-controls="consent-document" onClick={() => setDocument('terms')}>Termos de Uso</button>
        <button id="consent-privacy-tab" type="button" role="tab" aria-selected={selectedDocument === 'privacy'} aria-controls="consent-document" onClick={() => setDocument('privacy')}>Privacidade e LGPD</button>
      </div>
      <div id="consent-document" role="tabpanel" aria-labelledby={selectedDocument === 'terms' ? 'consent-terms-tab' : 'consent-privacy-tab'} className="consent-document">
        {activeDocument ? <div aria-label={selectedDocument === 'terms' ? 'Termos de Uso publicados' : 'Política de Privacidade publicada'} tabIndex={0}><TermsDocument terms={activeDocument} compact /></div> : selectedDocument === 'privacy' && privacyError ? <p role="alert">Não foi possível carregar a política. <button type="button" onClick={retryPrivacy}>Tentar novamente</button></p> : !error && <p role="status">Carregando o documento…</p>}
      </div>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <p><Link className="underline" href="/politicas#termos-de-uso" target="_blank" rel="noopener noreferrer">Ler Termos de Uso</Link> · <Link className="underline" href="/politicas#politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link></p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy || !terms} required /><span>Li e aceito os Termos de Uso.</span></label>
        {error && <p role="alert">{error}</p>}
        <button className="login-submit" aria-disabled={!accepted || !termsVersion || busy} type="submit" disabled={!accepted || !termsVersion || busy}>{busy ? 'Salvando…' : 'Aceitar e continuar'}</button>
      </form>
      <p className="mt-6"><Link className="underline" href="/login">Voltar ao login</Link></p>
  </section></div></main>
}
