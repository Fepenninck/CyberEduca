'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormularioEdicaoUsuario } from '@/components/admin/formulario-edicao-usuario'
import { atualizarUsuario, buscarUsuario, type AdminUsuario, type AtualizacaoUsuario } from '@/lib/admin-api'

export default function EditarUsuarioPage() {
  const { usuarioId } = useParams<{ usuarioId: string }>()
  const router = useRouter()
  const [usuario, setUsuario] = useState<AdminUsuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    buscarUsuario(usuarioId)
      .then((dados) => {
        if (ativo) setUsuario(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar o usuário.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [usuarioId])

  async function salvar(dados: AtualizacaoUsuario) {
    await atualizarUsuario(usuarioId, dados)
    router.push('/admin/usuarios')
    router.refresh()
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/admin/usuarios" className="mb-6 inline-flex items-center gap-2 text-sm text-[#626c79] transition hover:text-[#242a33]">
         Voltar para usuários
      </Link>
      <div className="mb-6">

        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#242a33]">Editar usuário</h2>
        <p className="mt-2 text-sm text-[#626c79]">Atualize o nome e o e-mail da conta.</p>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700">{erro}</p>}
      {carregando ? (
        <p role="status" className="text-sm text-[#626c79]">Carregando...</p>
      ) : usuario ? (
        <FormularioEdicaoUsuario
          key={usuario.id}
          initialValues={{ nome: usuario.nome, email: usuario.email }}
          onSubmit={salvar}
        />
      ) : null}
    </section>
  )
}
