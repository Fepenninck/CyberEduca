'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { label: 'Início', href: '/' },
  { label: 'Plataforma', href: '/em-breve' },
  { label: 'Trilhas', href: '/trilhas' },
  { label: 'Recursos', href: '/em-breve' },
  { label: 'Sobre', href: '/em-breve' },
]

export function CyberHeader() {
  const [open, setOpen] = useState(false)

  return <header className="reference-header">
    <div className="reference-header-inner">
      <Link href="/" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
      <nav className="reference-nav" aria-label="Navegação principal">{navigation.map((item) => <Link key={item.label} href={item.href} className="nav-item">{item.label}</Link>)}</nav>
      <div className="reference-actions"><Link href="/progresso" className="nav-item">Progresso</Link><Link href="/em-breve" className="nav-item">Entrar</Link><Link href="/trilhas" className="reference-cta">Começar</Link></div>
      <button className="reference-mobile-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
    {open && <nav className="reference-mobile-nav">{navigation.map((item) => <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="nav-item">{item.label}</Link>)}<Link href="/trilhas" className="reference-cta">Começar agora</Link></nav>}
  </header>
}
