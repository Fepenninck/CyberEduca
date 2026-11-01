'use client'

import { BookOpen, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormularioAula } from '@/components/admin/formulario-aula'
import {
  criarAula,
  editarAula,
  listarAulas,
  listarTrilhas,
  type AdminAula,
  type AdminTrilha,
  type AulaInput,
} from '@/lib/admin-api'

export default function AdminAulasPage() {
  const [aulas, setAulas] = useState<AdminAula[]>([])
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [aulaEditando, setAulaEditando] = useState<AdminAula | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    Promise.all([listarAulas(), listarTrilhas()])
      .then(([listaAulas, listaTrilhas]) => {
        if (ativo) {
          setAulas(listaAulas)
          setTrilhas(listaTrilhas)
        }
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as aulas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [atualizacao])

  function novaAula() {
    setAulaEditando(null)
    setMostrarFormulario(true)
  }

  async function salvarAula(dados: AulaInput) {
    if (aulaEditando) {
      await editarAula(aulaEditando.id, dados)
    } else {
      await criarAula(dados)
    }
    setMostrarFormulario(false)
    setAulaEditando(null)
    setAtualizacao((valor) => valor + 1)
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Conteúdo</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Aulas</h2>
          <p className="mt-2 text-sm text-slate-400">Gerencie as aulas e associe cada conteúdo a uma trilha.</p>
        </div>
        <button type="button" onClick={novaAula} className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
          <Plus aria-hidden="true" size={17} /> Nova Aula
        </button>
      </div>

      {mostrarFormulario && (
        <div className="mb-7">
          <h3 className="mb-3 text-lg font-semibold text-white">{aulaEditando ? 'Editar aula' : 'Nova aula'}</h3>
          <FormularioAula
            key={aulaEditando?.id ?? 'nova-aula'}
            trilhas={trilhas}
            initialValues={aulaEditando ?? undefined}
            submitLabel={aulaEditando ? 'Salvar alterações' : 'Criar aula'}
            onSubmit={salvarAula}
            onCancel={() => {
              setMostrarFormulario(false)
              setAulaEditando(null)
            }}
          />
        </div>
      )}

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      {carregando ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
        </div>
      ) : aulas.length ? (
        <div className="space-y-3">
          {aulas.map((aula) => (
            <article key={aula.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 transition hover:border-[#52647e]">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
                  <BookOpen aria-hidden="true" size={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">{aula.titulo}</h3>
                  <p className="mt-1 text-xs font-medium text-[#b2ff00]">{aula.trilha.titulo}</p>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-5 text-slate-400">{aula.conteudo}</p>
                  <p className="mt-3 text-xs text-slate-500">Ordem {aula.ordem}</p>
                </div>
              </div>
              <button type="button" aria-label={`Editar ${aula.titulo}`} onClick={() => { setAulaEditando(aula); setMostrarFormulario(true) }} className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-[#b2ff00] hover:text-[#b2ff00]">
                <Pencil aria-hidden="true" size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-14 text-center">
          <BookOpen className="mx-auto text-slate-500" size={30} />
          <p className="mt-3 font-medium text-white">Ainda não há aulas cadastradas</p>
          <p className="mt-1 text-sm text-slate-400">Crie uma aula e associe-a a uma trilha existente.</p>
        </div>
      )}
    </section>
  )
}
