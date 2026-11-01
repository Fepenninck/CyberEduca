'use client'

import { GraduationCap, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormularioTrilha } from '@/components/admin/formulario-trilha'
import {
  criarTrilha,
  editarTrilha,
  listarTrilhas,
  type AdminTrilha,
  type TrilhaInput,
} from '@/lib/admin-api'

export default function AdminTrilhasPage() {
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [trilhaEditando, setTrilhaEditando] = useState<AdminTrilha | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    listarTrilhas()
      .then((dados) => {
        if (ativo) setTrilhas(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as trilhas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [atualizacao])

  function novaTrilha() {
    setTrilhaEditando(null)
    setMostrarFormulario(true)
  }

  async function salvarTrilha(dados: TrilhaInput) {
    if (trilhaEditando) {
      await editarTrilha(trilhaEditando.id, dados)
    } else {
      await criarTrilha(dados)
    }
    setMostrarFormulario(false)
    setTrilhaEditando(null)
    setAtualizacao((valor) => valor + 1)
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Conteúdo</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Trilhas</h2>
          <p className="mt-2 text-sm text-slate-400">Crie, organize e atualize as trilhas de aprendizagem.</p>
        </div>
        <button type="button" onClick={novaTrilha} className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
          <Plus aria-hidden="true" size={17} /> Nova Trilha
        </button>
      </div>

      {mostrarFormulario && (
        <div className="mb-7">
          <h3 className="mb-3 text-lg font-semibold text-white">{trilhaEditando ? 'Editar trilha' : 'Nova trilha'}</h3>
          <FormularioTrilha
            key={trilhaEditando?.id ?? 'nova-trilha'}
            initialValues={trilhaEditando ?? undefined}
            submitLabel={trilhaEditando ? 'Salvar alterações' : 'Criar trilha'}
            onSubmit={salvarTrilha}
            onCancel={() => {
              setMostrarFormulario(false)
              setTrilhaEditando(null)
            }}
          />
        </div>
      )}

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
        </div>
      ) : trilhas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trilhas.map((trilha) => (
            <article key={trilha.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 transition hover:border-[#52647e]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                    <GraduationCap aria-hidden="true" size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{trilha.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">{trilha.descricao}</p>
                  </div>
                </div>
                <button type="button" aria-label={`Editar ${trilha.titulo}`} onClick={() => { setTrilhaEditando(trilha); setMostrarFormulario(true) }} className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-[#b2ff00] hover:text-[#b2ff00]">
                  <Pencil aria-hidden="true" size={16} />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-slate-400">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">Ordem {trilha.ordem}</span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">{trilha.totalAulas} {trilha.totalAulas === 1 ? 'aula' : 'aulas'}</span>
                <span className={`rounded-full px-2.5 py-1 ${trilha.bloqueada ? 'bg-amber-300/10 text-amber-200' : 'bg-[#b2ff00]/10 text-[#d2ff7e]'}`}>
                  {trilha.bloqueada ? 'Bloqueada' : 'Disponível'}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-14 text-center">
          <GraduationCap className="mx-auto text-slate-500" size={30} />
          <p className="mt-3 font-medium text-white">Ainda não há trilhas cadastradas</p>
          <p className="mt-1 text-sm text-slate-400">Crie a primeira trilha para começar a organizar o conteúdo.</p>
        </div>
      )}
    </section>
  )
}
