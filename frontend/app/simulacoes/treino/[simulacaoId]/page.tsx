'use client'

import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import {
  buscarSimulacao,
  finalizarSimulacao,
  responderSimulacao,
  verificarStatusSimulacao,
  type ResultadoTreino,
  type SimulacaoTreino,
} from '@/lib/simulacoes-api'

export default function IniciarSimulacaoPage() {
  const { simulacaoId } = useParams<{ simulacaoId: string }>()
  const [simulacao, setSimulacao] = useState<SimulacaoTreino | null>(null)
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostasDoAluno, setRespostasDoAluno] = useState<Record<string, string>>({})
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [resultado, setResultado] = useState<ResultadoTreino | null>(null)
  const [tituloResultado, setTituloResultado] = useState('Simulação')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const status = await verificarStatusSimulacao(simulacaoId)
        if (!ativo) return
        if (status.concluida && status.resultado) {
          setTituloResultado(status.resultado.titulo)
          setResultado({
            acertos: status.resultado.acertos,
            totalQuestoes: status.resultado.totalQuestoes,
            criadoEm: status.resultado.criadoEm,
            titulo: status.resultado.titulo,
            respostas: [],
          })
          setMostrarResultado(true)
          return
        }
        const dados = await buscarSimulacao(simulacaoId)
        if (ativo) setSimulacao(dados)
      } catch (falha) {
        if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir o treino.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    void carregar()
    return () => { ativo = false }
  }, [simulacaoId])

  async function concluirTreino() {
    if (!simulacao) return
    setErro(null)
    setEnviando(true)
    try {
      const respostasEnviadas = Object.entries(respostasDoAluno).map(([questaoId, alternativaId]) => ({ questaoId, alternativaId }))
      const respostaCorrigida = await responderSimulacao(simulacao.id, respostasEnviadas)
      const acertos = respostaCorrigida.respostas.filter((resposta) => resposta.correta).length
      const resultadoSalvo = await finalizarSimulacao(simulacao.id, {
        acertos,
        totalQuestoes: respostaCorrigida.respostas.length,
        respostas: respostasEnviadas,
      })
      setTituloResultado(resultadoSalvo.titulo ?? simulacao.titulo)
      setResultado(resultadoSalvo)
      setMostrarResultado(true)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível concluir o treino.')
    } finally {
      setEnviando(false)
    }
  }

  function proximaQuestao() {
    if (!simulacao) return
    if (questaoAtual === simulacao.questoes.length - 1) {
      void concluirTreino()
    } else {
      setQuestaoAtual((atual) => atual + 1)
    }
  }

  const totalQuestoes = simulacao?.questoes.length ?? 0
  const questao = simulacao?.questoes[questaoAtual]
  const acertos = resultado?.acertos ?? 0
  const resultadoPorQuestao = new Map(resultado?.respostas.map((resposta) => [resposta.questaoId, resposta]) ?? [])

  return (
    <main className="app-shell dashboard-page min-h-screen">
      <DashboardNavigation active="simulacoes" />
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
        <Link href="/simulacoes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft size={16} /> Voltar às simulações</Link>
        {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

        {carregando ? <div className="h-80 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" /> : mostrarResultado && resultado ? (
          <section aria-live="polite" className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-6 sm:p-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#b2ff00]/10 text-[#b2ff00]"><CheckCircle2 size={30} /></span>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Treino sem nota</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Você concluiu {tituloResultado}</h1>
              <p className="mt-3 text-lg text-slate-200">Acertos: <strong className="text-[#d5ff86]">{acertos} de {resultado.totalQuestoes}</strong></p>
              <p className="mt-2 text-sm text-slate-400">Use o feedback para praticar. Este resultado não vale nota.</p>
            </div>

            {simulacao && resultado.respostas.length > 0 && <div className="mt-8 space-y-3">
              {simulacao.questoes.map((item, indice) => {
                const feedback = resultadoPorQuestao.get(item.id)
                return <article key={item.id} className="rounded-xl border border-[#29394f] bg-[#0b1522] p-4">
                  <p className="text-sm font-medium text-white">{indice + 1}. {item.enunciado}</p>
                  <p className={`mt-2 text-sm ${feedback?.correta ? 'text-[#d5ff86]' : 'text-amber-200'}`}>{feedback?.correta ? 'Resposta correta' : `Resposta correta: ${feedback?.textoCorreto ?? 'não definida'}`}</p>
                </article>
              })}
            </div>}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/simulacoes" className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b]">Voltar para a listagem</Link>
            </div>
          </section>
        ) : simulacao ? (
          <>
            <header className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Treino sem nota</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{simulacao.titulo}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">{simulacao.descricao}</p>
            </header>

            {totalQuestoes === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-12 text-center text-sm text-slate-300">Este treino ainda não possui questões.</div>
            ) : questao ? (
              <div className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between text-xs text-slate-400">
                  <span>Questão {questaoAtual + 1} de {totalQuestoes}</span>
                  <span>Seu progresso no treino</span>
                </div>
                <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#29394f]"><div className="h-full rounded-full bg-[#b2ff00] transition-all" style={{ width: `${((questaoAtual + 1) / totalQuestoes) * 100}%` }} /></div>
                <h2 className="text-lg font-semibold leading-7 text-white">{questao.enunciado}</h2>
                <div className="mt-5 space-y-2">
                  {questao.alternativas.map((alternativa) => (
                    <label key={alternativa.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${respostasDoAluno[questao.id] === alternativa.id ? 'border-[#b2ff00]/50 bg-[#b2ff00]/[0.06] text-white' : 'border-[#29394f] bg-[#0b1522] text-slate-300 hover:border-[#52647e]'}`}>
                      <input type="radio" name={`simulacao-${questao.id}`} value={alternativa.id} checked={respostasDoAluno[questao.id] === alternativa.id} onChange={() => setRespostasDoAluno((atuais) => ({ ...atuais, [questao.id]: alternativa.id }))} className="mt-0.5 size-4 shrink-0 accent-[#b2ff00]" />
                      <span>{alternativa.texto}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-7 flex justify-between gap-3">
                  <button type="button" onClick={() => setQuestaoAtual((atual) => Math.max(0, atual - 1))} disabled={questaoAtual === 0 || enviando} className="rounded-lg border border-[#50627b] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#b2ff00] disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                  <button type="button" onClick={proximaQuestao} disabled={!respostasDoAluno[questao.id] || enviando} className="inline-flex items-center gap-2 rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-50">{enviando ? 'Calculando…' : questaoAtual === totalQuestoes - 1 ? 'Concluir e ver acertos' : 'Próxima questão'}</button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  )
}
