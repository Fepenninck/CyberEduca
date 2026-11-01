'use client'

import { ArrowUpRight, FileCheck2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { alterarStatusProva, listarProvasAdmin, type ProvaAdmin, type StatusPublicacao } from '@/lib/admin-api'

const statusOptions: StatusPublicacao[] = ['RASCUNHO', 'PUBLICADO', 'ARQUIVADO']

const statusClass: Record<StatusPublicacao, string> = {
  RASCUNHO: 'bg-slate-700/60 text-slate-300',
  PUBLICADO: 'bg-[#b2ff00]/10 text-[#d5ff86]',
  ARQUIVADO: 'bg-amber-300/10 text-amber-200',
}

export default function AdminProvasPage() {
  const [provas, setProvas] = useState<ProvaAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [provaAtualizando, setProvaAtualizando] = useState<string | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    listarProvasAdmin()
      .then((dados) => {
        if (ativo) setProvas(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as provas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [atualizacao])

  async function mudarStatus(prova: ProvaAdmin, status: StatusPublicacao) {
    if (status === prova.status) return
    setProvaAtualizando(prova.id)
    setErro(null)

    try {
      await alterarStatusProva(prova.id, status)
      setProvas((lista) => lista.map((item) => item.id === prova.id ? { ...item, status } : item))
    } catch (erroStatus) {
      setErro(erroStatus instanceof Error ? erroStatus.message : 'Não foi possível alterar o status da prova.')
    } finally {
      setProvaAtualizando(null)
    }
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Avaliações</p>
          <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
            <FileCheck2 aria-hidden="true" className="text-[#b2ff00]" size={28} /> Provas
          </h2>
          <p className="mt-2 text-sm text-slate-400">Crie avaliações por trilha e organize questões e alternativas.</p>
        </div>
        <Link href="/admin/provas/nova" className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
          <Plus aria-hidden="true" size={17} /> Nova Prova
        </Link>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
        </div>
      ) : provas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {provas.map((prova) => (
            <article key={prova.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
                  <FileCheck2 aria-hidden="true" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{prova.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">{prova.descricao}</p>
                </div>
                <Link href={`/admin/provas/${encodeURIComponent(prova.id)}/editar`} aria-label={`Editar prova ${prova.titulo}`} className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-[#b2ff00] hover:text-[#b2ff00]">
                  <ArrowUpRight aria-hidden="true" size={17} />
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[prova.status]}`}>
                    {prova.status}
                  </span>
                  <span className="text-xs text-slate-500">{prova.questoes?.length ?? 0} questões</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Status
                  <select
                    aria-label={`Status da prova ${prova.titulo}`}
                    value={prova.status}
                    disabled={provaAtualizando === prova.id}
                    onChange={(event) => void mudarStatus(prova, event.target.value as StatusPublicacao)}
                    className="rounded-md border border-[#35465c] bg-[#091321] px-2 py-1.5 text-xs text-white outline-none focus:border-[#b2ff00] disabled:opacity-50"
                  >
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-14 text-center">
          <FileCheck2 className="mx-auto text-slate-500" size={30} />
          <p className="mt-3 font-medium text-white">Nenhuma prova cadastrada</p>
          <p className="mt-1 text-sm text-slate-400">Crie uma prova para começar a estruturar a avaliação.</p>
        </div>
      )}
    </section>
  )
}
