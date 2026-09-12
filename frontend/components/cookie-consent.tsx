'use client'

import { useEffect, useState } from 'react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => { setVisible(!window.localStorage.getItem('cybereduca-cookie-consent')) }, [])

  const saveChoice = (choice: 'accepted' | 'rejected') => {
    window.localStorage.setItem('cybereduca-cookie-consent', choice)
    setVisible(false)
  }

  if (!visible) return null

  return <section className="cookie-consent" aria-label="Preferências de cookies">
    <div className="cookie-consent-copy">
      <div className="cookie-consent-title"><strong>Controle a sua privacidade</strong><span>AdOpt</span></div>
      <p>Usamos cookies para melhorar sua navegação e entender como a plataforma é utilizada.</p>
      <div className="cookie-consent-notice">Usamos cookies para compartilhar dados de análise, publicidade, dados de usuários e personalização de anúncios com parceiros.</div>
      <div className="cookie-consent-links"><a href="/em-breve">Política de Privacidade</a><span>•</span><a href="/em-breve">Termos de uso</a></div>
    </div>
    <div className="cookie-consent-actions"><button type="button" className="cookie-customize">Personalizar</button><button type="button" className="cookie-reject" onClick={() => saveChoice('rejected')}>Rejeitar</button><button type="button" className="cookie-accept" onClick={() => saveChoice('accepted')}>Aceitar</button></div>
  </section>
}
