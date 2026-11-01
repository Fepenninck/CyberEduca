'use client'

import { useState, type FormEvent } from 'react'
import type { AlternativaProvaInput } from '@/lib/admin-api'

type FormularioAlternativaProvaProps = {
  onSubmit: (dados: AlternativaProvaInput) => Promise<void>
}

export function FormularioAlternativaProva({ onSubmit }: FormularioAlternativaProvaProps) {
  const [texto, setTexto] = useState('')
  const [isCorreta, setIsCorreta] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ texto: texto.trim(), isCorreta })
      setTexto('')
      setIsCorreta(false)
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível adicionar a alternativa.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-[#29394f] bg-[#0b1522] p-3">
      <label className="block text-xs font-medium text-slate-300">
        Texto da alternativa
        <input value={texto} onChange={(event) => setTexto(event.target.value)} required maxLength={1000} className="mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]" />
      </label>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={isCorreta} onChange={(event) => setIsCorreta(event.target.checked)} className="size-4 accent-[#b2ff00]" />
          Alternativa correta
        </label>
        <button type="submit" disabled={salvando} className="rounded-lg border border-[#50627b] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#b2ff00] hover:text-[#d5ff86] disabled:opacity-50">
          {salvando ? 'Adicionando…' : 'Adicionar alternativa'}
        </button>
      </div>
      {erro && <p role="alert" className="mt-3 text-xs text-rose-300">{erro}</p>}
    </form>
  )
}
