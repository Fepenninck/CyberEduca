'use client'

import { ArrowLeft, Check, CircleHelp, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormularioAlternativaProva } from '@/components/admin/formulario-alternativa-prova'
import { FormularioProva } from '@/components/admin/formulario-prova'
import { FormularioQuestaoProva } from '@/components/admin/formulario-questao-prova'
import {
  adicionarAlternativaProva,
  adicionarQuestaoProva,
  atualizarProvaAdmin,
  listarProvasAdmin,
  listarTrilhas,
  type AdminTrilha,
  type AlternativaProvaInput,
  type ProvaAdmin,
  type ProvaInput,
  type QuestaoProvaAdmin,
} from '@/lib/admin-api'

export default function EditarProvaPage() {
  const { provaId } = useParams<{ provaId: string }>()
  const [prova, setProva] = useState<ProvaAdmin | null>(null)
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [questaoAtualizando, setQuestaoAtualizando] = useState(false)
  const [alternativaAtualizando, setAlternativaAtualizando] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    Promise.all([listarProvasAdmin(), listarTrilhas()])
      .then(([provas, listaTrilhas]) => {
        if (!ativo) return
        const provaEncontrada = provas.find((item) => item.id === provaId)
        if (!provaEncontrada) {
          setErro('A prova solicitada não foi encontrada.')
          return
        }
        setProva({ ...provaEncontrada, questoes: provaEncontrada.questoes ?? [] })
        setTrilhas(listaTrilhas)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar os dados da prova.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [provaId])

  async function salvarDadosProva(dados: ProvaInput) {
    if (!prova) return
    const atualizada = await atualizarProvaAdmin(prova.id, dados)
    setProva((atual) => atual ? { ...atual, ...dados, ...atualizada, questoes: atualizada.questoes ?? atual.questoes } : atual)
    setSucesso('Dados da prova atualizados.')
    setErro(null)
  }

  async function adicionarQuestao(enunciado: string) {
    if (!prova) return
    setQuestaoAtualizando(true)
    setErro(null)
    setSucesso(null)

    try {
      const questao = await adicionarQuestaoProva(prova.id, { enunciado })
      setProva((atual) => atual ? {
        ...atual,
        questoes: [...(atual.questoes ?? []), { ...questao, alternativas: questao.alternativas ?? [] }],
      } : atual)
      setSucesso('Questão adicionada à prova.')
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível adicionar a questão.')
      throw erroEnvio
    } finally {
      setQuestaoAtualizando(false)
    }
  }

  async function adicionarAlternativa(questaoId: string, dados: AlternativaProvaInput) {
    if (!prova) return
    setAlternativaAtualizando(questaoId)
    setErro(null)
    setSucesso(null)

    try {
      const alternativa = await adicionarAlternativaProva(prova.id, questaoId, dados)
      setProva((atual) => atual ? {
        ...atual,
        questoes: (atual.questoes ?? []).map((questao) => questao.id === questaoId
          ? { ...questao, alternativas: [...(questao.alternativas ?? []), alternativa] }
          : questao),
      } : atual)
      setSucesso('Alternativa adicionada à questão.')
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível adicionar a alternativa.')
      throw erroEnvio
    } finally {
      setAlternativaAtualizando(null)
    }
  }

  return (
    <section>
      <Link href="/admin/provas" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft aria-hidden="true" size={16} /> Voltar para provas
      </Link>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
      {sucesso && <p role="status" className="mb-5 rounded-xl border border-[#b2ff00]/25 bg-[#b2ff00]/[0.07] px-4 py-3 text-sm text-[#d8ff8a]">{sucesso}</p>}

      {carregando ? (
        <div className="space-y-5">
          <div className="h-72 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />
          <div className="h-48 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />
        </div>
      ) : prova ? (
        <>
          <div className="mb-9">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Editor de avaliação</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{prova.titulo}</h2>
            <p className="mt-2 text-sm text-slate-400">Atualize os dados, monte as questões e defina as alternativas corretas.</p>
            <div className="mt-5">
              <FormularioProva
                key={prova.id}
                trilhas={trilhas}
                initialValues={prova}
                submitLabel="Salvar dados da prova"
                onSubmit={salvarDadosProva}
              />
            </div>
          </div>

          <section className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                <CircleHelp aria-hidden="true" size={20} />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-white">Questões</h3>
                <p className="text-xs text-slate-400">Adicione o enunciado e depois cadastre suas alternativas.</p>
              </div>
            </div>
            <FormularioQuestaoProva onSubmit={adicionarQuestao} />
            {questaoAtualizando && <span className="sr-only">Adicionando questão</span>}
          </section>

          <div className="space-y-5">
            {(prova.questoes ?? []).map((questao, indice) => (
              <article key={questao.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#b2ff00]/10 text-sm font-semibold text-[#d5ff86]">{indice + 1}</span>
                  <h4 className="pt-1 font-medium leading-6 text-white">{questao.enunciado}</h4>
                </div>

                <div className="mt-5 space-y-2 pl-0 sm:pl-11">
                  {(questao.alternativas ?? []).map((alternativa) => (
                    <div key={alternativa.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${alternativa.isCorreta ? 'border-[#b2ff00]/25 bg-[#b2ff00]/[0.06] text-[#e0ffad]' : 'border-[#29394f] bg-[#0b1522] text-slate-300'}`}>
                      {alternativa.isCorreta && <Check aria-label="Correta" size={15} className="shrink-0 text-[#b2ff00]" />}
                      <span>{alternativa.texto}</span>
                    </div>
                  ))}
                  <FormularioAlternativaProva
                    onSubmit={(dados) => adicionarAlternativa(questao.id, dados)}
                  />
                  {alternativaAtualizando === questao.id && <span className="sr-only">Adicionando alternativa</span>}
                </div>
              </article>
            ))}
            {!prova.questoes?.length && (
              <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-10 text-center">
                <Plus className="mx-auto text-slate-500" size={26} />
                <p className="mt-3 text-sm text-slate-400">Ainda não há questões nesta prova.</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
