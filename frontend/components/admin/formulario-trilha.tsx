'use client'

import { useState, type FormEvent } from 'react'
import type { TrilhaInput } from '@/lib/admin-api'

type FormularioTrilhaProps = {
  onSubmit: (dados: TrilhaInput) => Promise<void>
  initialValues?: Partial<TrilhaInput>
  submitLabel?: string
  onCancel?: () => void
}

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

export function FormularioTrilha({
  onSubmit,
  initialValues,
  submitLabel = 'Salvar trilha',
  onCancel,
}: FormularioTrilhaProps) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? '')
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? '')
  const [ordem, setOrdem] = useState(String(initialValues?.ordem ?? 1))
  const [bloqueada, setBloqueada] = useState(initialValues?.bloqueada ?? false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        ordem: Number(ordem),
        bloqueada,
      })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível salvar a trilha.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Título
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={120} />
        </label>
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Descrição
          <textarea className={`${campoClass} min-h-28 resize-y`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={2000} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Ordem
          <input className={campoClass} type="number" min={1} step={1} value={ordem} onChange={(event) => setOrdem(event.target.value)} required />
        </label>
        <label className="flex min-h-20 items-center gap-3 rounded-lg border border-[#29394f] bg-[#0b1522] px-4 text-sm text-slate-200">
          <input className="size-4 accent-[#b2ff00]" type="checkbox" checked={bloqueada} onChange={(event) => setBloqueada(event.target.checked)} />
          Iniciar trilha bloqueada
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#40516a] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-wait disabled:opacity-60">
          {salvando ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
