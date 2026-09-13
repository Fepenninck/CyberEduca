'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'

const navigation = [
  { label: 'Início', href: '/' },
  { label: 'Plataforma', href: '/em-breve' },
  { label: 'Trilhas', href: '/trilhas' },
  { label: 'Recursos', href: '/em-breve' },
  { label: 'Sobre', href: '/em-breve' },
]

export function NewsHeader() {
  return <header className="reference-header">
    <div className="reference-header-inner">
      <Link href="/" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
      <nav className="reference-nav" aria-label="Navegação principal">{navigation.map((item) => <Link key={item.label} href={item.href} className="nav-item">{item.label}</Link>)}</nav>
      <div className="reference-actions"><Link href="/progresso" className="nav-item">Progresso</Link><Link href="/em-breve" className="nav-item">Entrar</Link><Link href="/trilhas" className="reference-cta">Começar</Link></div>
      <details className="reference-mobile-menu"><summary className="reference-mobile-button" aria-label="Abrir menu"><Menu className="mobile-menu-icon" preserveAspectRatio="none" /></summary><nav className="reference-mobile-nav">{navigation.map((item) => <Link key={item.label} href={item.href} className="nav-item">{item.label}</Link>)}<Link href="/trilhas" className="reference-cta">Começar agora</Link></nav></details>
    </div>
  </header>
}
