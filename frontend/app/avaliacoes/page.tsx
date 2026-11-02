'use client'

import { ArrowRight, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { listarProvasDisponiveis, type ProvaDisponivel } from '@/lib/provas-api'

export default function AvaliacoesPage() {
  const [provas, setProvas] = useState<ProvaDisponivel[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    listarProvasDisponiveis()
      .then((dados) => {
        if (ativo) setProvas(dados)
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as avaliações.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <main className="app-shell dashboard-page min-h-screen">
      <DashboardNavigation active="avaliacoes" />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Valide o que aprendeu</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Avaliações</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Escolha uma prova publicada e responda às questões no seu ritmo.</p>
        </div>

        {erro && <p role="alert" className="mb-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

        {carregando ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
          </div>
        ) : provas.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {provas.map((prova) => (
              <article key={prova.id} className="flex flex-col rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 transition hover:border-[#586b83]">
                <span className="grid size-11 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                  <ClipboardCheck aria-hidden="true" size={21} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-white">{prova.titulo}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{prova.descricao}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1">{prova.trilha.titulo}</span>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1">
                    {prova._count.questoes} {prova._count.questoes === 1 ? 'questão' : 'questões'}
                  </span>
                </div>
                <Link href={`/avaliacoes/${encodeURIComponent(prova.id)}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
                  Iniciar avaliação <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-14 text-center">
            <ClipboardCheck aria-hidden="true" className="mx-auto text-slate-500" size={30} />
            <h2 className="mt-3 font-medium text-white">Não há avaliações publicadas</h2>
            <p className="mt-1 text-sm text-slate-400">Novas provas aparecerão aqui quando forem disponibilizadas.</p>
          </div>
        )}
      </section>
    </main>
  )
}
