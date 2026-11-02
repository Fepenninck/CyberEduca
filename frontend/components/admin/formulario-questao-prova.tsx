'use client'

import { useState, type FormEvent } from 'react'
import type { QuestaoProvaInput } from '@/lib/admin-api'

type FormularioQuestaoProvaProps = {
  onSubmit: (dados: Pick<QuestaoProvaInput, 'enunciado' | 'tipo'>) => Promise<void>
}

export function FormularioQuestaoProva({ onSubmit }: FormularioQuestaoProvaProps) {
  const [enunciado, setEnunciado] = useState('')
  const [tipo, setTipo] = useState<QuestaoProvaInput['tipo']>('MULTIPLA_ESCOLHA')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ enunciado: enunciado.trim(), tipo })
      setEnunciado('')
      setTipo('MULTIPLA_ESCOLHA')
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível adicionar a questão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-xl border border-[#29394f] bg-[#0b1522] p-4">
      <label className="block text-sm font-medium text-slate-200">
        Enunciado da questão
        <textarea
          value={enunciado}
          onChange={(event) => setEnunciado(event.target.value)}
          required
          maxLength={3000}
          className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]"
          placeholder="Escreva a pergunta da avaliação"
        />
      </label>
      <label className="mt-3 block text-sm font-medium text-slate-200">
        Tipo da questão
        <select value={tipo} onChange={(event) => setTipo(event.target.value as QuestaoProvaInput['tipo'])} className="mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none focus:border-[#b2ff00]">
          <option value="MULTIPLA_ESCOLHA">Quiz (Múltipla escolha)</option>
          <option value="DISSERTATIVA">Dissertativa (Texto aberto)</option>
        </select>
      </label>
      {erro && <p role="alert" className="mt-3 text-sm text-rose-300">{erro}</p>}
      <div className="mt-3 flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#b2ff00] px-4 py-2 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:opacity-60">
          {salvando ? 'Adicionando…' : 'Adicionar questão'}
        </button>
      </div>
    </form>
  )
}
