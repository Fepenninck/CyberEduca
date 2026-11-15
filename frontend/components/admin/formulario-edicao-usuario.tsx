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
    if (salvando) return
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

  const campoClass = 'mt-2 w-full rounded-lg border border-[#d4dce6] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#242a33] outline-none transition placeholder:text-slate-500 focus:border-[#1768bd]'

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5 sm:p-6">
      <div className="admin-form-heading"><h3>Dados da conta</h3><p>Atualize o nome e o e-mail sem alterar as credenciais do usuário.</p></div>
      <div className="grid gap-5">
        <label className="text-sm font-medium text-slate-700">
          Nome
          <input className={campoClass} value={nome} onChange={(event) => setNome(event.target.value)} required maxLength={160} autoComplete="name" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          E-mail
          <input className={campoClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" />
        </label>
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-700">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d] disabled:cursor-wait disabled:opacity-60">
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
