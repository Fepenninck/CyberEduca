'use client'

import { ArrowLeft, FileCheck2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormularioProva } from '@/components/admin/formulario-prova'
import { criarProvaAdmin, listarTrilhas, type AdminTrilha, type ProvaInput } from '@/lib/admin-api'

export default function NovaProvaPage() {
  const router = useRouter()
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    listarTrilhas()
      .then((dados) => {
        if (ativo) setTrilhas(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as trilhas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  async function salvarProva(dados: ProvaInput) {
    const prova = await criarProvaAdmin(dados)
    router.push(`/admin/provas/${encodeURIComponent(prova.id)}/editar`)
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admin/provas" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft aria-hidden="true" size={16} /> Voltar para provas
      </Link>
      <div className="mb-6">
        <span className="grid size-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
          <FileCheck2 aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Nova prova</h2>
        <p className="mt-2 text-sm text-slate-400">Defina os dados básicos da prova. Depois você poderá adicionar questões e alternativas.</p>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
      {carregando ? (
        <div className="h-80 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" aria-label="Carregando trilhas" />
      ) : (
        <FormularioProva trilhas={trilhas} onSubmit={salvarProva} submitLabel="Criar prova e continuar" />
      )}
    </section>
  )
}
