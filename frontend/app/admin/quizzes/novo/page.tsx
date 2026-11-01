'use client'

import { ArrowLeft, ClipboardCheck } from 'lucide-react'
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
    await criarQuizAdmin(dados)
    window.alert('Quiz criado com sucesso.')
    router.push('/admin/quizzes')
    router.refresh()
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admin/quizzes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft aria-hidden="true" size={16} /> Voltar para quizzes
      </Link>
      <div className="mb-6">
        <span className="grid size-11 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
          <ClipboardCheck aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Novo quiz</h2>
        <p className="mt-2 text-sm text-slate-400">Preencha os dados e selecione a aula relacionada.</p>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
      {carregando ? (
        <div className="h-72 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" aria-label="Carregando aulas" />
      ) : (
        <FormularioQuiz aulas={aulas} onSubmit={salvarQuiz} />
      )}
    </section>
  )
}
