'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PlatformMegaMenu } from '@/components/platform-mega-menu'
import { MobilePublicMenu } from '@/components/mobile-public-menu'

export function CyberHeader() {
  const [platformOpen, setPlatformOpen] = useState(false)
  return <header className="reference-header" onMouseLeave={() => setPlatformOpen(false)}><div className="reference-header-inner"><Link href="/" className="reference-brand" aria-label="CyberEduca+ início"><img className="reference-logo" src="/cybereduca-logo.png" alt="CyberEduca+" /></Link><nav className="reference-nav" aria-label="Navegação principal"><Link href="/" className="nav-item">Início</Link><button type="button" className={`nav-item platform-menu-toggle ${platformOpen ? 'active' : ''}`} onMouseEnter={() => setPlatformOpen(true)} onFocus={() => setPlatformOpen(true)} aria-expanded={platformOpen}>Plataforma</button><Link href="/sobre" className="nav-item">Sobre</Link></nav><div className="reference-actions"><Link href="/ajuda" className="nav-item">Ajuda</Link><Link href="/login" className="reference-cta">Acessar</Link></div><MobilePublicMenu /></div>{platformOpen && <PlatformMegaMenu />}</header>
}
