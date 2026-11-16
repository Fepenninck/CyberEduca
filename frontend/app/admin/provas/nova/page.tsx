'use client'

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
      <Link href="/admin/provas" className="mb-6 inline-flex items-center gap-2 text-sm text-[#626c79] transition hover:text-[#242a33]">
         Voltar para provas
      </Link>
      <div className="mb-6">

        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#242a33]">Nova prova</h2>
        <p className="mt-2 text-sm text-[#626c79]">Defina os dados básicos da prova. Depois você poderá adicionar questões e alternativas.</p>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700">{erro}</p>}
      {carregando ? (
        <p role="status" className="text-sm text-[#626c79]">Carregando...</p>
      ) : (
        <FormularioProva trilhas={trilhas} onSubmit={salvarProva} submitLabel="Criar prova e continuar" />
      )}
    </section>
  )
}
