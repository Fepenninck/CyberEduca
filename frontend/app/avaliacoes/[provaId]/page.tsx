'use client'

import { ArrowLeft, CheckCircle2, CircleHelp } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import {
  buscarProvaDisponivel,
  enviarRespostasProva,
  type ProvaDisponivelDetalhe,
  type ResultadoProva,
} from '@/lib/provas-api'

export default function IniciarAvaliacaoPage() {
  const { provaId } = useParams<{ provaId: string }>()
  const [prova, setProva] = useState<ProvaDisponivelDetalhe | null>(null)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<ResultadoProva | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarProvaDisponivel(provaId)
      .then((dados) => {
        if (ativo) setProva(dados)
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir esta avaliação.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [provaId])

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!prova) return
    setErro(null)
    setEnviando(true)
    try {
      const resultado = await enviarRespostasProva(
        prova.id,
        Object.entries(respostas).map(([questaoId, resposta]) => {
          const questao = prova.questoes.find((item) => item.id === questaoId)
          return questao?.tipo === 'DISSERTATIVA'
            ? { questaoId, respostaTexto: resposta }
            : { questaoId, alternativaId: resposta }
        }),
      )
      setResultado(resultado)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar as respostas.')
    } finally {
      setEnviando(false)
    }
  }

  const resultadoPorQuestao = new Map(resultado?.resultado.map((item) => [item.questaoId, item]) ?? [])

  return (
    <main className="app-shell dashboard-page min-h-screen">
      <DashboardNavigation active="avaliacoes" />
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
        <Link href="/avaliacoes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft aria-hidden="true" size={16} /> Voltar às avaliações
        </Link>

        {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
        {carregando ? (
          <div className="h-80 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />
        ) : prova ? (
          <>
            <header className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Avaliação</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{prova.titulo}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">{prova.descricao}</p>
            </header>

            {resultado && (
              <div role="status" className="mb-6 flex items-center gap-4 rounded-2xl border border-[#b2ff00]/25 bg-[#b2ff00]/[0.07] p-5">
                <CheckCircle2 aria-hidden="true" className="shrink-0 text-[#b2ff00]" size={26} />
                <div>
                  <p className="font-semibold text-white">Resultado: {resultado.acertos} de {resultado.totalQuestoes} questões objetivas ({resultado.percentual}%)</p>
                  <p className="mt-1 text-sm text-slate-300">As respostas dissertativas ficam disponíveis para correção manual.</p>
                </div>
              </div>
            )}

            <form onSubmit={enviar} className="space-y-5">
              {prova.questoes.map((questao, indice) => {
                const correcao = resultadoPorQuestao.get(questao.id)
                return (
                  <fieldset key={questao.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 sm:p-6">
                    <legend className="sr-only">Questão {indice + 1}</legend>
                    <div className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-sm font-semibold text-violet-200">{indice + 1}</span>
                      <h2 className="pt-1 font-medium leading-6 text-white">{questao.enunciado}</h2>
                    </div>
                    <div className="mt-4 space-y-2 pl-0 sm:pl-11">
                      {questao.tipo === 'DISSERTATIVA' ? (
                        <textarea
                          value={respostas[questao.id] ?? ''}
                          onChange={(event) => setRespostas((atual) => ({ ...atual, [questao.id]: event.target.value }))}
                          disabled={Boolean(resultado) || enviando}
                          required
                          maxLength={5000}
                          placeholder="Escreva sua resposta..."
                          className="min-h-32 w-full resize-y rounded-lg border border-[#35465c] bg-[#091321] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#b2ff00] disabled:opacity-70"
                        />
                      ) : questao.alternativas.map((alternativa) => {
                        const correta = correcao?.alternativaCorretaId === alternativa.id
                        const escolhida = respostas[questao.id] === alternativa.id
                        return (
                          <label key={alternativa.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${correta ? 'border-[#b2ff00]/40 bg-[#b2ff00]/[0.07] text-[#e5ffb8]' : escolhida && resultado ? 'border-rose-400/30 bg-rose-400/[0.06] text-rose-100' : 'border-[#29394f] bg-[#0b1522] text-slate-300 hover:border-[#52647e]'}`}>
                            <input
                              type="radio"
                              name={`questao-${questao.id}`}
                              value={alternativa.id}
                              checked={escolhida}
                              disabled={Boolean(resultado) || enviando}
                              onChange={() => setRespostas((atual) => ({ ...atual, [questao.id]: alternativa.id }))}
                              className="mt-0.5 size-4 shrink-0 accent-[#b2ff00]"
                            />
                            <span className="flex-1">{alternativa.texto}</span>
                            {correta && <CheckCircle2 aria-label="Resposta correta" className="shrink-0 text-[#b2ff00]" size={17} />}
                          </label>
                        )
                      })}
                    </div>
                    {correcao?.avaliacaoManual && <p className="mt-3 pl-0 text-xs text-amber-200 sm:pl-11">Resposta registrada para correção manual.</p>}
                    {correcao && !correcao.correta && correcao.textoCorreto && (
                      <p className="mt-3 pl-0 text-xs text-slate-400 sm:pl-11">Resposta correta: {correcao.textoCorreto}</p>
                    )}
                  </fieldset>
                )
              })}

              {prova.questoes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-12 text-center">
                  <CircleHelp aria-hidden="true" className="mx-auto text-slate-500" size={28} />
                  <p className="mt-3 text-sm text-slate-300">Esta prova ainda não possui questões.</p>
                </div>
              ) : !resultado && (
                <div className="flex justify-end">
                  <button type="submit" disabled={enviando || Object.keys(respostas).length !== prova.questoes.length} className="rounded-lg bg-[#b2ff00] px-5 py-3 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-50">
                    {enviando ? 'A corrigir…' : 'Enviar respostas'}
                  </button>
                </div>
              )}
            </form>
          </>
        ) : null}
      </section>
    </main>
  )
}
