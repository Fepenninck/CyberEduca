'use client'

import { useEffect, useRef, useState } from 'react'
import './welcome-banner.css'

const WELCOME_COOKIE = 'cybereduca_welcome_seen'
let dismissed = false

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const previousOverflow = useRef<string | null>(null)

  useEffect(() => {
    setVisible(!dismissed && !document.cookie.split(';').some(cookie => cookie.trim() === `${WELCOME_COOKIE}=1`))
    return () => {
      if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current
    }
  }, [])

  const open = () => {
    if (!dialog.current || dialog.current.open) return
    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current.showModal()
  }

  const close = () => {
    dismissed = true
    try {
      document.cookie = `${WELCOME_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    } catch {}
    dialog.current?.close()
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current
    previousOverflow.current = null
    setVisible(false)
  }

  if (!visible) return null

  return <dialog ref={dialog} className="welcome-banner" aria-label="Boas-vindas ao CyberEduca+" onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="welcome-banner-content">
      <img src="/banner-boas-vindas.jpg" width={2546} height={1959} alt="CyberEduca+. Seja bem-vindo! Aprenda, pratique e evolua em Segurança da Informação com aulas e conteúdos interativos." onLoad={open} onError={() => setVisible(false)} />
      <button type="button" className="welcome-banner-close" aria-label="Fechar boas-vindas" onClick={close} autoFocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
    </div>
  </dialog>
}
