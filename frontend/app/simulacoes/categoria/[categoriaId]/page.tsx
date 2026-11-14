'use client'

import { LoadingScreen } from '@/components/ui/loading-screen'
import { MonitorPlay } from 'lucide-react'
import Link from 'next/link'
import { SimulationBack } from '@/components/activities/simulation-back'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { buscarCategoriaSimulacao, type CategoriaSimulacaoDisponivel } from '@/lib/simulacoes-api'

export default function CategoriaSimulacaoPage() {
  const { categoriaId } = useParams<{ categoriaId: string }>()
  const [categoria, setCategoria] = useState<CategoriaSimulacaoDisponivel | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarCategoriaSimulacao(categoriaId)
      .then((dados) => { if (ativo) setCategoria(dados) })
      .catch((falha: unknown) => { if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar esta categoria.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [categoriaId])

  return (
    <main className="app-shell dashboard-page min-h-screen">
      <DashboardNavigation active="simulacoes" />
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <SimulationBack />
        {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
        {carregando ? <LoadingScreen /> : categoria && (
          <>
            <header className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Categoria de simulações</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{categoria.nome}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{categoria.descricao}</p>
            </header>
            {categoria.simulacoes.length ? <div className="grid gap-4 md:grid-cols-2">
              {categoria.simulacoes.map((simulacao) => (
                <article key={simulacao.id} className="flex flex-col rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 sm:p-6">
                  <div className="flex-1"><span className="inline-flex rounded-full bg-[#b2ff00]/10 px-3 py-1 text-xs font-medium text-[#d5ff86]">Treino sem nota</span><h2 className="mt-4 text-xl font-semibold text-white">{simulacao.titulo}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{simulacao.descricao}</p></div>
                  {simulacao.concluida && <p className="mt-4 text-sm text-[#b2ff00]">Treino concluído</p>}
                  <Link href={`/simulacoes/treino/${encodeURIComponent(simulacao.id)}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">{simulacao.concluida ? 'Ver resultado' : 'Iniciar treino'}</Link>
                </article>
              ))}
            </div> : <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-12 text-center"><MonitorPlay className="mx-auto text-slate-500" size={30} /><p className="mt-3 font-medium text-white">Ainda não há simulações nesta categoria</p><p className="mt-1 text-sm text-slate-400">Volte mais tarde para conferir novos treinos.</p></div>}
          </>
        )}
      </section>
    </main>
  )
}
