'use client'

import { useState, type FormEvent } from 'react'
import type { AdminTrilha, ProvaInput, StatusPublicacao } from '@/lib/admin-api'

type FormularioProvaProps = {
  trilhas: AdminTrilha[]
  onSubmit: (dados: ProvaInput) => Promise<void>
  initialValues?: Partial<ProvaInput>
  submitLabel?: string
}

const statusOptions: Array<{ value: StatusPublicacao; label: string }> = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
]

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

export function FormularioProva({
  trilhas,
  onSubmit,
  initialValues,
  submitLabel = 'Salvar prova',
}: FormularioProvaProps) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? '')
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? '')
  const [trilhaId, setTrilhaId] = useState(initialValues?.trilhaId ?? trilhas[0]?.id ?? '')
  const [status, setStatus] = useState<StatusPublicacao>(initialValues?.status ?? 'RASCUNHO')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ titulo: titulo.trim(), descricao: descricao.trim(), trilhaId, status })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível salvar a prova.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Título
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={160} />
        </label>
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Descrição
          <textarea className={`${campoClass} min-h-28 resize-y`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={2000} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Trilha
          <select className={campoClass} value={trilhaId} onChange={(event) => setTrilhaId(event.target.value)} required disabled={trilhas.length === 0}>
            <option value="" disabled>Selecione uma trilha</option>
            {trilhas.map((trilha) => <option key={trilha.id} value={trilha.id}>{trilha.titulo}</option>)}
          </select>
          {trilhas.length === 0 && <span className="mt-2 block text-xs text-amber-300">Cadastre uma trilha antes de criar provas.</span>}
        </label>
        <label className="text-sm font-medium text-slate-200">
          Status
          <select className={campoClass} value={status} onChange={(event) => setStatus(event.target.value as StatusPublicacao)}>
            {statusOptions.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
          </select>
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando || trilhas.length === 0} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-60">
          {salvando ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
