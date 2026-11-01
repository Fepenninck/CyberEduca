'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TabelaUsuarios } from '@/components/admin/tabela-usuarios'
import { listarUsuarios, type AdminUsuario } from '@/lib/admin-api'

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    listarUsuarios()
      .then((dados) => {
        if (ativo) setUsuarios(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar os usuários.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [tentativa])

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Gestão</p>
        <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
          <Users aria-hidden="true" className="text-[#b2ff00]" size={28} /> Usuários
        </h2>
        <p className="mt-2 text-sm text-slate-400">Consulte as contas cadastradas na plataforma.</p>
      </div>

      {erro && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <span>{erro}</span>
          <button type="button" onClick={() => setTentativa((valor) => valor + 1)} className="rounded-lg border border-rose-200/30 px-3 py-1.5 font-medium transition hover:bg-rose-200/10">
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="h-64 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" aria-label="Carregando usuários" />
      ) : (
        <TabelaUsuarios usuarios={usuarios} />
      )}
    </section>
  )
}
