'use client'

import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { platformGroups } from './platform-mega-menu'
import './mobile-public-menu.css'

export function MobilePublicMenu({ home = false }: { home?: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const platform = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  return <details ref={menu} className="reference-mobile-menu" onToggle={event => {
    if (event.target !== event.currentTarget) return
    setOpen(event.currentTarget.open)
    if (!event.currentTarget.open && platform.current) platform.current.open = false
  }} onKeyDown={event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    const active = platform.current?.open ? platform.current : menu.current
    if (active) { active.open = false; active.querySelector('summary')?.focus() }
  }}>
    <summary className="reference-mobile-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <X className="mobile-close-icon" /> : <Menu className="mobile-menu-icon" />}</summary>
    <nav className="reference-mobile-nav" aria-label="Navegação mobile" onClick={event => {
      if ((event.target as HTMLElement).closest('a') && menu.current) menu.current.open = false
    }}>
      <Link href="/" className="nav-item">Início</Link>
      <details ref={platform} className="mobile-platform-menu">
        <summary className="nav-item mobile-platform-toggle">Plataforma<ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="mobile-platform-links">
          {platformGroups.map(group => <section key={group.label}>
            <p>{group.label}</p>
            {group.items.map(item => <Link key={item.title} href={item.href}>{item.title}</Link>)}
          </section>)}
          <section><p>Sua conta</p><Link href="/login">Entrar</Link><Link href="/cadastro">Criar conta</Link></section>
          <section><p>Privacidade e suporte</p><Link href="/politicas#politica-de-privacidade">Política de privacidade</Link><Link href="/politicas#cookies">Política de cookies</Link><Link href="/politicas#termos-de-uso">Termos de uso</Link><Link href="/politicas#direitos">LGPD e seus direitos</Link></section>
        </div>
      </details>
      <Link href="/sobre" className="nav-item">Sobre</Link>
      <Link href="/ajuda" className="nav-item">Ajuda</Link>
      <Link href="/login" className="reference-cta">{home ? 'Começar agora' : 'Acessar'}</Link>
    </nav>
  </details>
}
