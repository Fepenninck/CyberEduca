'use client'

import { ArrowRight, ClipboardCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { alterarStatusQuiz, listarQuizzesAdmin, type QuizAdmin, type StatusPublicacao } from '@/lib/admin-api'

const statusPossiveis: StatusPublicacao[] = ['RASCUNHO', 'PUBLICADO', 'ARQUIVADO']

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [quizAtualizando, setQuizAtualizando] = useState<string | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    listarQuizzesAdmin()
      .then((dados) => {
        if (ativo) setQuizzes(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar os quizzes.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [atualizacao])

  async function mudarStatus(quiz: QuizAdmin, status: StatusPublicacao) {
    if (status === quiz.status) return
    setQuizAtualizando(quiz.id)
    setErro(null)

    try {
      await alterarStatusQuiz(quiz.id, status)
      setQuizzes((lista) => lista.map((item) => item.id === quiz.id ? { ...item, status } : item))
    } catch (erroStatus) {
      setErro(erroStatus instanceof Error ? erroStatus.message : 'Não foi possível alterar o status do quiz.')
    } finally {
      setQuizAtualizando(null)
    }
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Avaliações</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Quizzes</h2>
          <p className="mt-2 text-sm text-slate-400">Gerencie as avaliações vinculadas às aulas.</p>
        </div>
        <Link href="/admin/quizzes/novo" className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">
          <Plus aria-hidden="true" size={17} /> Novo Quiz
        </Link>
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
        </div>
      ) : quizzes.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => {
            return (
              <article key={quiz.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                    <ClipboardCheck aria-hidden="true" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{quiz.titulo}</h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-400">{quiz.descricao}</p>
                  </div>
                  <ArrowRight aria-hidden="true" className="mt-1 text-slate-600" size={18} />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                  <span className="text-xs text-slate-500">Aula: {quiz.aulaId}</span>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Status
                    <select
                      aria-label={`Status do quiz ${quiz.titulo}`}
                      value={quiz.status}
                      disabled={quizAtualizando === quiz.id}
                      onChange={(event) => void mudarStatus(quiz, event.target.value as StatusPublicacao)}
                      className="rounded-md border border-[#35465c] bg-[#091321] px-2 py-1.5 text-xs text-white outline-none focus:border-[#b2ff00] disabled:opacity-50"
                    >
                      {statusPossiveis.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-14 text-center">
          <ClipboardCheck className="mx-auto text-slate-500" size={30} />
          <p className="mt-3 font-medium text-white">Nenhum quiz cadastrado</p>
          <p className="mt-1 text-sm text-slate-400">Crie o primeiro quiz e vincule-o a uma aula.</p>
        </div>
      )}
    </section>
  )
}
