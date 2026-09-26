'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { PlatformMegaMenu } from '@/components/platform-mega-menu'

const navigation = [{ label: 'Início', href: '/' }, { label: 'Trilhas', href: '/trilhas' }]

export function CyberHeader() {
  const [platformOpen, setPlatformOpen] = useState(false)
  return <header className="reference-header" onMouseLeave={() => setPlatformOpen(false)}><div className="reference-header-inner"><Link href="/" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><nav className="reference-nav" aria-label="Navegação principal"><Link href="/" className="nav-item">Início</Link><button type="button" className={`nav-item platform-menu-toggle ${platformOpen ? 'active' : ''}`} onMouseEnter={() => setPlatformOpen(true)} onFocus={() => setPlatformOpen(true)} aria-expanded={platformOpen}>Plataforma</button><Link href="/trilhas" className="nav-item">Trilhas</Link><Link href="/ajuda" className="nav-item">Ajuda</Link></nav><div className="reference-actions"><Link href="/em-breve" className="nav-item">Sobre</Link><Link href="/login" className="reference-cta">Acessar</Link></div><details className="reference-mobile-menu"><summary className="reference-mobile-button" aria-label="Abrir menu"><Menu className="mobile-menu-icon" /></summary><nav className="reference-mobile-nav"><Link href="/" className="nav-item">Início</Link><Link href="/trilhas" className="nav-item">Plataforma</Link><Link href="/trilhas" className="nav-item">Trilhas</Link><Link href="/ajuda" className="nav-item">Ajuda</Link><Link href="/login" className="reference-cta">Acessar</Link></nav></details></div>{platformOpen && <PlatformMegaMenu />}</header>
}
