'use client'

import { useState, type FormEvent } from 'react'
import type { AdminTrilha, AulaInput } from '@/lib/admin-api'

type FormularioAulaProps = {
  trilhas: AdminTrilha[]
  onSubmit: (dados: AulaInput) => Promise<void>
  initialValues?: Partial<AulaInput>
  submitLabel?: string
  onCancel?: () => void
}

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

export function FormularioAula({
  trilhas,
  onSubmit,
  initialValues,
  submitLabel = 'Salvar aula',
  onCancel,
}: FormularioAulaProps) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? '')
  const [conteudo, setConteudo] = useState(initialValues?.conteudo ?? '')
  const [ordem, setOrdem] = useState(String(initialValues?.ordem ?? 1))
  const [trilhaId, setTrilhaId] = useState(initialValues?.trilhaId ?? trilhas[0]?.id ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ titulo: titulo.trim(), conteudo, ordem: Number(ordem), trilhaId })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível salvar a aula.')
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
          Conteúdo
          <textarea className={`${campoClass} min-h-48 resize-y`} value={conteudo} onChange={(event) => setConteudo(event.target.value)} required />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Ordem
          <input className={campoClass} type="number" min={1} step={1} value={ordem} onChange={(event) => setOrdem(event.target.value)} required />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Trilha
          <select className={campoClass} value={trilhaId} onChange={(event) => setTrilhaId(event.target.value)} required disabled={trilhas.length === 0}>
            <option value="" disabled>Selecione uma trilha</option>
            {trilhas.map((trilha) => (
              <option key={trilha.id} value={trilha.id}>{trilha.titulo}</option>
            ))}
          </select>
          {trilhas.length === 0 && <span className="mt-2 block text-xs text-amber-300">Cadastre uma trilha antes de criar aulas.</span>}
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#40516a] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={salvando || trilhas.length === 0} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-60">
          {salvando ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
