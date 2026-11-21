'use client'

import { FileText, History, ListChecks, ChevronRight, BookOpen, ClipboardList, FileCheck2, GraduationCap, LayoutDashboard, LogOut, ShieldAlert, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/trilhas', label: 'Trilhas', icon: GraduationCap },
  { href: '/admin/aulas', label: 'Aulas', icon: BookOpen },
  { href: '/admin/simulacoes', label: 'Simulações', icon: ShieldAlert },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/admin/provas', label: 'Provas', icon: FileCheck2 },
  { href: '/admin/resultados', label: 'Resultados', icon: ClipboardList },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/termos', label: 'Termos de Uso', icon: FileText },
  { href: '/admin/historico', label: 'Histórico', icon: History },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Ainda encaminha para o login se a API de logout estiver indisponível.
    } finally {
      setSaindo(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img className="admin-brand-logo" src="/cybereduca-logo.png" alt="CyberEduca+" />
        <p className="admin-brand-caption">Painel administrativo</p>
      </div>

      <nav aria-label="Navegação administrativa" className="admin-navigation">
        <p className="admin-nav-label">GERENCIAR PLATAFORMA</p>
        {links.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))

          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? 'page' : undefined}
              className="admin-nav-link"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
              {ativo && <ChevronRight aria-hidden="true" size={14} />}
            </Link>
          )
        })}
      </nav>
      <div className="admin-sidebar-exit">
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-60"
        >
          <LogOut aria-hidden="true" size={18} />
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </aside>
  )
}
