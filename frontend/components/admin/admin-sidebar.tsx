'use client'

import { BookOpen, ClipboardCheck, FileCheck2, GraduationCap, LayoutDashboard, ShieldAlert, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/trilhas', label: 'Trilhas', icon: GraduationCap },
  { href: '/admin/aulas', label: 'Aulas', icon: BookOpen },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardCheck },
  { href: '/admin/provas', label: 'Provas', icon: FileCheck2 },
  { href: '/admin/simulacoes', label: 'Simulações', icon: ShieldAlert },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-b border-[#27364b] bg-[#0d1725] md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-64 md:border-r md:border-b-0">
      <div className="flex h-16 items-center gap-3 border-b border-[#27364b] px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-[#b2ff00]/10 text-sm font-bold text-[#b2ff00]">
          C+
        </span>
        <div>
          <p className="text-sm font-semibold text-white">CyberEduca+</p>
          <p className="text-xs text-slate-400">Painel administrativo</p>
        </div>
      </div>

      <nav aria-label="Navegação administrativa" className="grid grid-cols-2 gap-1 p-3 md:flex md:flex-col">
        {links.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))

          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                ativo
                  ? 'bg-[#b2ff00]/10 font-semibold text-[#b2ff00]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
