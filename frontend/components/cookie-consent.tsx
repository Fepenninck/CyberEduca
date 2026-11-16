'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { clearRememberedCelebrations, CONSENT_COOKIE, CONSENT_MAX_AGE, readCookiePreferences } from '@/lib/cookie-preferences'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const pathname = usePathname()
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    if (isAdminRoute) return

    const sync = () => {
      const preferences = readCookiePreferences(document.cookie)
      setVisible(!preferences)
      if (!preferences?.personalization) clearRememberedCelebrations()
    }
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [pathname, isAdminRoute])

  const saveChoice = (allowPersonalization: boolean) => {
    document.cookie = `${CONSENT_COOKIE}=${allowPersonalization ? 'v2-personalization' : 'v2-essential'}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    if (!allowPersonalization) clearRememberedCelebrations()
    if (readCookiePreferences(document.cookie)?.personalization !== allowPersonalization) {
      setError('Seu navegador bloqueou o armazenamento da preferência. O aviso poderá aparecer novamente.')
      return
    }
    setError('')
    setVisible(false)
  }

  if (isAdminRoute) return null

  if (!visible) return <button type="button" className="cookie-preferences-trigger" onClick={() => setVisible(true)}>Preferências de cookies</button>

  return <section className="cookie-consent" aria-label="Preferências de cookies">
    <div className="cookie-consent-copy">
      <div className="cookie-consent-title"><strong>Controle a sua privacidade</strong></div>
      <p>Usamos cookies necessários para manter sua sessão e lembrar sua escolha neste navegador.</p>
      <div className="cookie-consent-notice">Você pode permitir a personalização para lembrar as celebrações de conquistas já exibidas. Não usamos cookies de publicidade.</div>
      <div className="cookie-consent-links"><a href="/politicas#politica-de-privacidade">Política de Privacidade</a><span>•</span><a href="/politicas#termos-de-uso">Termos de uso</a></div>
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="cookie-consent-actions">
      <button type="button" className="cookie-reject" onClick={() => saveChoice(false)}>Rejeitar</button>
      <button type="button" className="cookie-accept" onClick={() => saveChoice(true)}>Aceitar</button>
    </div>
  </section>
}
