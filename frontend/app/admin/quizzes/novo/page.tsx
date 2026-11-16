'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormularioQuiz } from '@/components/admin/formulario-quiz'
import { criarQuizAdmin, listarAulas, type AdminAula, type QuizAdminInput } from '@/lib/admin-api'

export default function NovoQuizPage() {
  const router = useRouter()
  const [aulas, setAulas] = useState<AdminAula[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    listarAulas()
      .then((dados) => {
        if (ativo) setAulas(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as aulas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  async function salvarQuiz(dados: QuizAdminInput) {
    const quiz = await criarQuizAdmin(dados)
    router.push(`/admin/quizzes/${encodeURIComponent(quiz.id)}/editar`)
    router.refresh()
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admin/quizzes" className="mb-6 inline-flex items-center gap-2 text-sm text-[#626c79] transition hover:text-[#242a33]">
         Voltar para quizzes
      </Link>
      <div className="mb-6">

        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#242a33]">Novo quiz</h2>
        <p className="mt-2 text-sm text-[#626c79]">Preencha os dados e selecione a aula relacionada.</p>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700">{erro}</p>}
      {carregando ? (
        <p role="status" className="text-sm text-[#626c79]">Carregando...</p>
      ) : (
        <FormularioQuiz aulas={aulas} onSubmit={salvarQuiz} />
      )}
    </section>
  )
}
