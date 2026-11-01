'use client'

import { BookOpen, GraduationCap, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buscarResumoDashboard, type ResumoDashboard } from '@/lib/admin-api'

const cards = [
  {
    key: 'totalUsuarios',
    label: 'Total de usuários',
    detail: 'Contas cadastradas na plataforma',
    icon: Users,
  },
  {
    key: 'totalTrilhas',
    label: 'Total de trilhas',
    detail: 'Trilhas de aprendizagem disponíveis',
    icon: GraduationCap,
  },
  {
    key: 'totalAulas',
    label: 'Total de aulas',
    detail: 'Aulas cadastradas nas trilhas',
    icon: BookOpen,
  },
] as const

export default function AdminDashboardPage() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true

    setCarregando(true)
    setErro(null)

    buscarResumoDashboard()
      .then((dados) => {
        if (ativo) setResumo(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) {
          setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar o dashboard.')
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [tentativa])

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">
          Visão geral
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Dashboard
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          Acompanhe os principais números da plataforma CyberEduca+.
        </p>
      </div>

      {erro && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => setTentativa((valor) => valor + 1)}
            className="rounded-lg border border-rose-200/30 px-3 py-1.5 font-medium transition hover:bg-rose-200/10"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, label, detail, icon: Icon }, index) => (
          <article
            key={key}
            className="relative overflow-hidden rounded-2xl border border-[#29394f] bg-gradient-to-br from-[#121e2e] to-[#0d1623] p-6 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.9)]"
          >
            <div className="absolute -right-8 -top-10 size-32 rounded-full bg-[#b2ff00]/[0.045] blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300">{label}</p>
                <p className="mt-5 text-4xl font-semibold tracking-tight text-white">
                  {carregando ? (
                    <span className="inline-block h-10 w-20 animate-pulse rounded-md bg-white/10" aria-label="Carregando" />
                  ) : erro ? (
                    '—'
                  ) : (
                    (resumo?.[key] ?? 0).toLocaleString('pt-BR')
                  )}
                </p>
              </div>
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${index === 0 ? 'bg-sky-400/10 text-sky-300' : index === 1 ? 'bg-violet-400/10 text-violet-300' : 'bg-[#b2ff00]/10 text-[#b2ff00]'}`}>
                <Icon aria-hidden="true" size={22} />
              </span>
            </div>
            <p className="relative mt-5 border-t border-white/[0.07] pt-4 text-xs text-slate-400">
              {detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
