'use client'

import { useState, type FormEvent } from 'react'
import type { AtualizacaoUsuario } from '@/lib/admin-api'

type FormularioEdicaoUsuarioProps = {
  initialValues: AtualizacaoUsuario
  onSubmit: (dados: AtualizacaoUsuario) => Promise<void>
}

export function FormularioEdicaoUsuario({ initialValues, onSubmit }: FormularioEdicaoUsuarioProps) {
  const [nome, setNome] = useState(initialValues.nome)
  const [email, setEmail] = useState(initialValues.email)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      await onSubmit({ nome: nome.trim(), email: email.trim() })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível atualizar o usuário.')
    } finally {
      setSalvando(false)
    }
  }

  const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5">
        <label className="text-sm font-medium text-slate-200">
          Nome
          <input className={campoClass} value={nome} onChange={(event) => setNome(event.target.value)} required maxLength={160} autoComplete="name" />
        </label>
        <label className="text-sm font-medium text-slate-200">
          E-mail
          <input className={campoClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" />
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-wait disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
