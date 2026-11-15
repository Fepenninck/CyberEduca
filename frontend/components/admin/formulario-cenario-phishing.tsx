'use client'

import { useState, type FormEvent } from 'react'
import type { CenarioPhishingInput } from '@/lib/admin-api'

type Dificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL'

type FormularioCenarioPhishingProps = {
  onSubmit: (dados: CenarioPhishingInput) => Promise<void>
}

const campoClass = 'mt-2 w-full rounded-lg border border-[#d4dce6] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#242a33] outline-none transition placeholder:text-slate-500 focus:border-[#1768bd]'

const dificuldades: Array<{ valor: Dificuldade; label: string }> = [
  { valor: 'FACIL', label: 'Fácil' },
  { valor: 'MEDIO', label: 'Médio' },
  { valor: 'DIFICIL', label: 'Difícil' },
]

export function FormularioCenarioPhishing({ onSubmit }: FormularioCenarioPhishingProps) {
  const [titulo, setTitulo] = useState('')
  const [conteudoEmail, setConteudoEmail] = useState('')
  const [remetenteFalso, setRemetenteFalso] = useState('')
  const [dificuldade, setDificuldade] = useState<Dificuldade>('FACIL')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ titulo: titulo.trim(), conteudoEmail, remetenteFalso: remetenteFalso.trim(), dificuldade })
      setTitulo('')
      setConteudoEmail('')
      setRemetenteFalso('')
      setDificuldade('FACIL')
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível criar o cenário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Título do cenário
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={160} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Conteúdo do e-mail
          <textarea className={`${campoClass} min-h-48 resize-y`} value={conteudoEmail} onChange={(event) => setConteudoEmail(event.target.value)} required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Remetente falso
          <input className={campoClass} value={remetenteFalso} onChange={(event) => setRemetenteFalso(event.target.value)} required maxLength={254} placeholder="exemplo@dominio-falso.com" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Dificuldade
          <select className={campoClass} value={dificuldade} onChange={(event) => setDificuldade(event.target.value as Dificuldade)}>
            {dificuldades.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>)}
          </select>
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-700">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d] disabled:cursor-wait disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Criar cenário'}
        </button>
      </div>
    </form>
  )
}
