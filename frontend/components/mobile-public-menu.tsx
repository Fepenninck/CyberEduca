'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'

export function MobilePublicMenu({ home = false }: { home?: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  return <details ref={menu} className="reference-mobile-menu" onToggle={event => {
    if (event.target !== event.currentTarget) return
    setOpen(event.currentTarget.open)
  }} onKeyDown={event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    const active = menu.current
    if (active) { active.open = false; active.querySelector('summary')?.focus() }
  }}>
    <summary className="reference-mobile-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <X className="mobile-close-icon" /> : <Menu className="mobile-menu-icon" />}</summary>
    <nav className="reference-mobile-nav" aria-label="Navegação mobile" onClick={event => {
      if ((event.target as HTMLElement).closest('a') && menu.current) menu.current.open = false
    }}>
      <Link href="/" className="nav-item">Início</Link>
      <Link href="/sobre" className="nav-item">Sobre</Link>
      <Link href="/ajuda" className="nav-item">Ajuda</Link>
      <Link href="/login" className="reference-cta">{home ? 'Começar agora' : 'Acessar'}</Link>
    </nav>
  </details>
}
