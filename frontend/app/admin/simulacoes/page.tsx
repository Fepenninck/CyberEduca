'use client'

import { Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FormularioSimulacao } from '@/components/admin/formulario-simulacao'
import {
  criarSimulacao,
  criarCategoriaSimulacao,
  editarSimulacao,
  excluirSimulacao,
  listarSimulacoes,
  listarCategoriasSimulacao,
  type CategoriaSimulacaoAdmin,
  type SimulacaoAdmin,
  type SimulacaoInput,
} from '@/lib/admin-api'

export default function AdminSimulacoesPage() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoAdmin[]>([])
  const [categorias, setCategorias] = useState<CategoriaSimulacaoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<SimulacaoAdmin | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [descricaoCategoria, setDescricaoCategoria] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [listaSimulacoes, listaCategorias] = await Promise.all([
        listarSimulacoes(),
        listarCategoriasSimulacao(),
      ])
      setSimulacoes(listaSimulacoes)
      setCategorias(listaCategorias)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as simulações.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar, atualizacao])

  async function salvar(dados: SimulacaoInput) {
    if (editando) await editarSimulacao(editando.id, dados)
    else await criarSimulacao(dados)

    setSucesso(editando ? 'Simulação atualizada.' : 'Simulação criada.')
    setErro(null)
    setEditando(null)
    setFormAberto(false)
    setAtualizacao((valor) => valor + 1)
  }

  async function salvarCategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    try {
      await criarCategoriaSimulacao({ nome: nomeCategoria.trim(), descricao: descricaoCategoria.trim() })
      setNomeCategoria('')
      setDescricaoCategoria('')
      setSucesso('Categoria criada.')
      setAtualizacao((valor) => valor + 1)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível criar a categoria.')
    }
  }

  async function excluir(simulacao: SimulacaoAdmin) {
    if (!window.confirm(`Tem certeza que deseja excluir a simulação "${simulacao.titulo}"?`)) return
    setErro(null)
    setSucesso(null)
    try {
      await excluirSimulacao(simulacao.id)
      setSucesso('Simulação excluída.')
      setAtualizacao((valor) => valor + 1)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível excluir a simulação.')
    }
  }

  function iniciarNova() {
    setEditando(null)
    setFormAberto(true)
    setErro(null)
    setSucesso(null)
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Treinamento sem nota</p>
          <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
            <ShieldAlert aria-hidden="true" className="text-[#b2ff00]" size={28} /> Simulações
          </h2>
          <p className="mt-2 text-sm text-slate-400">Crie cenários práticos com alternativas para treino e feedback imediato.</p>
        </div>
        <button type="button" onClick={iniciarNova} className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
          <Plus size={17} /> Nova simulação
        </button>
      </div>

      {sucesso && <p role="status" className="mb-5 rounded-xl border border-[#b2ff00]/25 bg-[#b2ff00]/[0.07] px-4 py-3 text-sm text-[#d8ff8a]">{sucesso}</p>}
      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      <form onSubmit={salvarCategoria} className="mb-7 grid gap-3 rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 sm:grid-cols-[1fr_2fr_auto]">
        <input aria-label="Nome da categoria" value={nomeCategoria} onChange={(event) => setNomeCategoria(event.target.value)} placeholder="Nova categoria" required maxLength={120} className="rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none focus:border-[#b2ff00]" />
        <input aria-label="Descrição da categoria" value={descricaoCategoria} onChange={(event) => setDescricaoCategoria(event.target.value)} placeholder="Descrição" required maxLength={1000} className="rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none focus:border-[#b2ff00]" />
        <button type="submit" className="rounded-lg border border-[#50627b] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#b2ff00]">Criar categoria</button>
        <p className="text-xs text-slate-400 sm:col-span-3">Categorias: {categorias.map((categoria) => categoria.nome).join(', ') || 'nenhuma cadastrada'}</p>
      </form>

      {formAberto && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{editando ? 'Editar simulação' : 'Nova simulação'}</h3>
            <button type="button" onClick={() => { setFormAberto(false); setEditando(null) }} className="text-sm text-slate-400 transition hover:text-white">Cancelar</button>
          </div>
          <FormularioSimulacao
            categorias={categorias}
            key={editando?.id ?? 'nova-simulacao'}
            initialValues={editando ?? undefined}
            onSubmit={salvar}
            submitLabel={editando ? 'Salvar alterações' : 'Criar simulação'}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#29394f] bg-[#101b2a]">
        <div className="border-b border-[#29394f] px-5 py-4">
          <h3 className="font-semibold text-white">Simulações cadastradas</h3>
        </div>
        {carregando ? (
          <div className="space-y-3 p-5" aria-label="Carregando simulações">
            {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-[#0b1522]" />)}
          </div>
        ) : simulacoes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#0b1522] text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3">Título</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Questões</th><th className="px-5 py-3">Criada em</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-[#29394f]">
                {simulacoes.map((simulacao) => (
                  <tr key={simulacao.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{simulacao.titulo}</p>
                      <p className="mt-1 max-w-lg truncate text-xs text-slate-400">{simulacao.descricao}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{simulacao.categoria?.nome ?? categorias.find((categoria) => categoria.id === simulacao.categoriaId)?.nome ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{simulacao.questoes.length}</td>
                    <td className="px-5 py-4 text-slate-400">{new Date(simulacao.criadoEm).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditando(simulacao); setFormAberto(true); setErro(null); setSucesso(null) }} aria-label={`Editar ${simulacao.titulo}`} className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-[#b2ff00] hover:text-[#d5ff86]"><Pencil size={16} /></button>
                        <button type="button" onClick={() => void excluir(simulacao)} aria-label={`Excluir ${simulacao.titulo}`} className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-300"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-white">Nenhuma simulação cadastrada</p>
            <p className="mt-1 text-sm text-slate-400">Crie uma simulação para os alunos praticarem sem nota.</p>
          </div>
        )}
      </div>
    </section>
  )
}
