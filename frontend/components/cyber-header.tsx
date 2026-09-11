'use client'

import Link from 'next/link'
import { Menu, X, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'

export function CyberHeader() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" className="brand" aria-label="CyberEduca+ início"><img className="brand-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <Link href="/">Início</Link><Link href="/trilhas">Trilhas <ChevronDown size={14} /></Link><Link href="/progresso">Meu progresso</Link><Link href="#recursos">Recursos <ChevronDown size={14} /></Link><Link href="#sobre">Sobre</Link><Link href="#entrar">Entrar</Link>
        <Link href="/trilhas" className="header-cta">Começar agora</Link>
      </nav>
      <button className="mobile-menu-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="mobile-nav"><Link href="/trilhas" onClick={() => setOpen(false)}><Search size={16} /> Trilhas de aprendizagem</Link><Link href="/progresso" onClick={() => setOpen(false)}>Meu progresso</Link><Link href="#comunidade" onClick={() => setOpen(false)}>Comunidade</Link></nav>}
  </header>
}
