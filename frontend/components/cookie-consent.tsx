'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { clearRememberedCelebrations, CONSENT_COOKIE, CONSENT_MAX_AGE, readCookiePreferences } from '@/lib/cookie-preferences'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [personalization, setPersonalization] = useState(false)
  const [error, setError] = useState('')
  const pathname = usePathname()
  const preferencesDialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = preferencesDialog.current
    if (customizing && dialog && !dialog.open) dialog.showModal()
    else if (!customizing && dialog?.open) dialog.close()
  }, [customizing, visible])

  useEffect(() => {
    const sync = () => {
      const preferences = readCookiePreferences(document.cookie)
      setVisible(!preferences)
      setPersonalization(preferences?.personalization ?? false)
      if (!preferences?.personalization) clearRememberedCelebrations()
    }
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [pathname])

  const saveChoice = (allowPersonalization: boolean) => {
    document.cookie = `${CONSENT_COOKIE}=${allowPersonalization ? 'v2-personalization' : 'v2-essential'}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    if (!allowPersonalization) clearRememberedCelebrations()
    setPersonalization(allowPersonalization)
    if (readCookiePreferences(document.cookie)?.personalization !== allowPersonalization) {
      setError('Seu navegador bloqueou o armazenamento da preferência. O aviso poderá aparecer novamente.')
      return
    }
    setError('')
    setCustomizing(false)
    setVisible(false)
  }

  if (!visible) return <button type="button" className="cookie-preferences-trigger" onClick={() => { setPersonalization(readCookiePreferences(document.cookie)?.personalization ?? false); setCustomizing(true); setVisible(true) }}>Preferências de cookies</button>

  return <><section className="cookie-consent" aria-label="Preferências de cookies">
    <div className="cookie-consent-copy">
      <div className="cookie-consent-title"><strong>Controle a sua privacidade</strong></div>
      <p>Usamos cookies necessários para manter sua sessão e lembrar sua escolha neste navegador.</p>
      <div className="cookie-consent-notice">Você pode permitir a personalização para lembrar as celebrações de conquistas já exibidas. Não usamos cookies de publicidade.</div>
      <div className="cookie-consent-links"><a href="/politicas#politica-de-privacidade">Política de Privacidade</a><span>•</span><a href="/politicas#termos-de-uso">Termos de uso</a></div>
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="cookie-consent-actions">
      <button type="button" className="cookie-customize" onClick={() => setCustomizing(true)}>Personalizar</button>
      <button type="button" className="cookie-reject" onClick={() => saveChoice(false)}>Rejeitar</button>
      <button type="button" className="cookie-accept" onClick={() => saveChoice(true)}>Aceitar</button>
    </div>
  </section>
  <dialog ref={preferencesDialog} className="cookie-preferences-dialog" aria-labelledby="cookie-preferences-heading" onCancel={() => setCustomizing(false)}>
    <h2 id="cookie-preferences-heading">Preferências de cookies</h2>
    <div className="cookie-preferences-options">
      <p><strong>Necessários — sempre ativos</strong>Mantêm o acesso seguro e guardam sua escolha por 180 dias.</p>
      <label><input type="checkbox" checked={personalization} onChange={event => setPersonalization(event.target.checked)} /><span><strong>Personalização</strong>Lembra neste navegador quais celebrações de conquistas você já viu. Seu progresso permanece salvo na conta mesmo ao rejeitar.</span></label>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="cookie-consent-actions">
      <button type="button" className="cookie-reject" onClick={() => setCustomizing(false)}>Voltar</button>
      <button type="button" className="cookie-accept" onClick={() => saveChoice(personalization)}>Salvar preferências</button>
    </div>
  </dialog></>
}
