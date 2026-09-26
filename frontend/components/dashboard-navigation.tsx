'use client'

import Link from 'next/link'
import { BookOpen, ClipboardCheck, Cog, Home, Menu, MonitorPlay, UserRound } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

export function DashboardNavigation({ active }: { active?: 'aulas' | 'simulacoes' | 'avaliacoes' | 'perfil' | 'inicio' }) {
  const openSettings = () => window.dispatchEvent(new Event('open-account-settings'))

  return <header className="dashboard-header"><div className="dashboard-header-inner">
    <Link href="/dashboard" className="dashboard-brand" aria-label="CyberEduca+ dashboard"><img src="/cybereduca-logo.png" alt="CyberEduca+" /></Link>
    <nav className="dashboard-nav" aria-label="Navegação da área do aluno">
      <Link className={active === 'inicio' ? 'is-active' : undefined} href="/dashboard"><Home size={16} /> Início</Link>
      <Link className={active === 'perfil' ? 'is-active' : undefined} href="/perfil"><UserRound size={16} /> Perfil</Link>
      <Link className={active === 'aulas' ? 'is-active' : undefined} href="/aulas"><BookOpen size={16} /> Trilhas</Link>
      <Link className={active === 'simulacoes' ? 'is-active' : undefined} href="/simulacoes"><MonitorPlay size={16} /> Simulações</Link>
      <Link className={active === 'avaliacoes' ? 'is-active' : undefined} href="/avaliacoes"><ClipboardCheck size={16} /> Avaliações</Link>
      <Link className="dashboard-settings-link" href="#configuracoes" onClick={(event) => { event.preventDefault(); openSettings() }}><Cog size={16} /> Configurações</Link>
    </nav>
    <div className="dashboard-header-actions"><UserMenu /></div>
    <details className="dashboard-mobile-menu"><summary aria-label="Abrir navegação"><Menu size={24} /></summary><nav><Link href="/dashboard">Início</Link><Link href="/aulas">Trilhas</Link><Link href="/simulacoes">Simulações</Link><Link href="/avaliacoes"><ClipboardCheck size={17} /> Avaliações</Link><Link className="dashboard-settings-link" href="#configuracoes" onClick={(event) => { event.preventDefault(); openSettings() }}><Cog size={17} /> Configurações</Link><Link href="/perfil">Meu perfil</Link></nav></details>
  </div></header>
}
