'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setVisible(!document.cookie.split('; ').some((cookie) => cookie.startsWith('cybereduca_cookie_consent='))) }, [])

  const acknowledge = () => {
    document.cookie = `cybereduca_cookie_consent=essential; Max-Age=31536000; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    setVisible(false)
  }

  if (!visible || pathname === '/login') return null

  return <section className="cookie-consent" aria-label="Preferências de cookies">
    <div className="cookie-consent-copy">
      <div className="cookie-consent-title"><strong>Cookies necessários</strong></div>
      <p>Usamos cookies para manter sua sessão e lembrar a exibição deste aviso. Não utilizamos rastreamento opcional de publicidade ou análise de navegação.</p>
      <div className="cookie-consent-links"><a href="/politicas#politica-de-privacidade">Política de Privacidade</a><span>•</span><a href="/politicas#termos-de-uso">Termos de uso</a></div>
    </div>
    <div className="cookie-consent-actions"><button type="button" className="cookie-accept" onClick={acknowledge}>Entendi</button></div>
  </section>
}
