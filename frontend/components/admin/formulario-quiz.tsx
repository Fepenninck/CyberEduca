'use client'

import { useState, type FormEvent } from 'react'
import type { AdminAula, QuizAdminInput } from '@/lib/admin-api'

type FormularioQuizProps = {
  aulas: AdminAula[]
  onSubmit: (dados: QuizAdminInput) => Promise<void>
}

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

export function FormularioQuiz({ aulas, onSubmit }: FormularioQuizProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [aulaId, setAulaId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ titulo: titulo.trim(), descricao: descricao.trim(), aulaId })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível criar o quiz.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5">
        <label className="text-sm font-medium text-slate-200">
          Título
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={160} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Descrição
          <textarea className={`${campoClass} min-h-32 resize-y`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={2000} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Aula vinculada
          <select className={campoClass} value={aulaId} onChange={(event) => setAulaId(event.target.value)} required disabled={aulas.length === 0}>
            <option value="" disabled>Selecione uma aula</option>
            {aulas.map((aula) => (
              <option key={aula.id} value={aula.id}>{aula.trilha.titulo} · {aula.titulo}</option>
            ))}
          </select>
          {aulas.length === 0 && <span className="mt-2 block text-xs text-amber-300">Cadastre uma aula antes de criar quizzes.</span>}
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando || aulas.length === 0} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Criar quiz'}
        </button>
      </div>
    </form>
  )
}
