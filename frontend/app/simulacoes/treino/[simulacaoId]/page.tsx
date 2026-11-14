'use client'

import { LoadingScreen } from '@/components/ui/loading-screen'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { buscarSimulacao, finalizarSimulacao, verificarStatusSimulacao, type ResultadoTreino, type SimulacaoTreino } from '@/lib/simulacoes-api'
import { simulationLevels, simulationTheme } from '@/lib/simulation-theme'
import { SimulationBack } from '@/components/activities/simulation-back'
import { ImmersiveSimulation } from '@/components/activities/immersive-simulation'
import '../../simulacoes.css'
import '../../treino.css'

export default function IniciarSimulacaoPage() {
  const { simulacaoId } = useParams<{ simulacaoId: string }>()
  const [simulation, setSimulation] = useState<SimulacaoTreino | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ResultadoTreino | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [redo, setRedo] = useState(false)
  const attemptToken = useRef({ id: '', repeat: false })
  const startAgain = () => { setRedo(true); setAttempt(value => value + 1) }
  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setSimulation(null); setResult(null); setAnswers({}); setCurrent(0)
    async function load() {
      try {
        const status = await verificarStatusSimulacao(simulacaoId)
        if (!active) return
        const repeat = redo || new URLSearchParams(window.location.search).get('refazer') === '1'
        if (!repeat && status.concluida && status.resultado) { setResult({ ...status.resultado, respostas: status.resultado.respostas ?? [] }); return }
        attemptToken.current = { id: crypto.randomUUID(), repeat }
        const content = await buscarSimulacao(simulacaoId)
        if (active) setSimulation(content)
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a simulação.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [simulacaoId, attempt, redo])
  async function next() {
    if (!simulation || sending) return
    if (current < simulation.questoes.length - 1) { setCurrent(value => value + 1); return }
    setSending(true); setError('')
    try {
      const saved = await finalizarSimulacao(simulation.id, { refazer: attemptToken.current.repeat, tentativaId: attemptToken.current.id, respostas: simulation.questoes.map(item => ({ questaoId: item.id, alternativaId: answers[item.id] })) })
      setResult(saved)
      window.dispatchEvent(new Event('simulation-progress-updated'))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Suas escolhas continuam nesta tela.') }
    finally { setSending(false) }
  }
  const theme = simulationTheme(simulation?.categoria.nome || '')
  const decision = simulation?.questoes[current]
  return <main className="app-shell dashboard-page simulation-training" style={{ '--simulation-color': theme.color } as CSSProperties}><DashboardNavigation active="simulacoes" />
    <section className="simulation-training-wrap"><SimulationBack />
      {error && <div className="simulation-training-error" role="alert"><p>{error}</p>{!simulation && !result && <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</div>}
      {loading ? <LoadingScreen label={"Preparando o ambiente de treinamento…"} /> : result ? <>
        <header className="simulation-result-heading"><div><span className="simulation-eyebrow">Simulação concluída</span><h1>{result.titulo || simulation?.titulo || 'Sua simulação'}</h1><p>{result.acertos === result.totalQuestoes ? 'Você tomou as decisões recomendadas. Confira por que elas ajudam a proteger você.' : 'Veja suas escolhas e entenda como agir nas situações que precisam de atenção.'}</p></div><button type="button" className="simulation-training-primary" onClick={startAgain}>Refazer simulação</button></header>
        <dl className="simulation-result-summary" aria-label="Resumo do resultado">
          <div><dt>Aproveitamento</dt><dd>{Math.round(result.acertos / Math.max(1, result.totalQuestoes) * 100)}<span>%</span></dd></div>
          <div><dt>Decisões corretas</dt><dd>{result.acertos}<span> de {result.totalQuestoes}</span></dd></div>
          <div><dt>Para revisar</dt><dd>{result.totalQuestoes - result.acertos}<span>{result.totalQuestoes - result.acertos === 1 ? ' decisão' : ' decisões'}</span></dd></div>
        </dl>
        {result.respostas.length > 0 && <div className="simulation-review-heading"><h2>Suas decisões, explicadas</h2><p>Compare sua resposta com a orientação de cada situação.</p></div>}
        <div className="simulation-result-list">{result.respostas.map((item, index) => <article key={item.questaoId} className={`simulation-result-item${item.correta ? ' is-correct' : ' is-review'}`}>
          <header className="simulation-result-card-heading"><span className="simulation-result-step">Decisão {String(index + 1).padStart(2, '0')}</span><span className="simulation-result-status">{item.correta ? 'Você acertou' : 'Precisa revisar'}</span></header>
          <h2>{item.enunciado || `Situação ${index + 1}`}</h2>
          <div className="simulation-result-answers">
            {item.textoEscolhido && <div className="simulation-result-answer"><span>Sua escolha</span><p>{item.textoEscolhido}</p></div>}
            {!item.correta && item.textoCorreto && <div className="simulation-result-answer is-recommended"><span>Ação recomendada</span><p>{item.textoCorreto}</p></div>}
          </div>
          <div className="simulation-result-explanation"><h3>Entenda a resposta</h3><p>{item.explicacao || (item.correta ? 'Sua escolha corresponde à ação recomendada para este cenário.' : 'Compare sua decisão com a ação recomendada acima.')}</p></div>
        </article>)}</div>
        {!result.respostas.length && <p className="simulation-legacy-result">Este resultado foi salvo antes do feedback detalhado. O placar permanece disponível.</p>}
        <footer className="simulation-result-footer"><div><h2>Continue praticando</h2><p>Explore outras situações para colocar seus conhecimentos em prática.</p></div><Link className="simulation-training-primary" href="/simulacoes">Escolher outra simulação<ArrowRight size={16} /></Link></footer><p className="simulation-training-note">Resultado salvo. Esta prática não gera nota nem conclui aulas automaticamente.</p>
      </> : simulation && decision ? <>
        <header className="simulation-training-heading"><div className="simulation-card-tags"><span className="simulation-category">{simulation.categoria.nome}</span><span className="simulation-difficulty" data-level={simulation.nivel}>{simulationLevels[simulation.nivel]}</span><span className="simulation-training-time">{simulation.duracaoMinutos} min</span></div><h1>{simulation.titulo}</h1><p>{simulation.descricao}</p></header>
        <div className="simulation-training-layout"><section className="simulation-decision"><div className="simulation-decision-position"><span>Etapa {current + 1} de {simulation.questoes.length}</span><span>Ambiente fictício</span></div><div className="simulation-decision-progress" role="progressbar" aria-label="Decisões respondidas" aria-valuemin={0} aria-valuemax={simulation.questoes.length} aria-valuenow={Object.keys(answers).length}><span style={{ width: `${Object.keys(answers).length / simulation.questoes.length * 100}%` }} /></div>
          <ImmersiveSimulation step={current} key={decision.id} title={simulation.titulo} category={simulation.categoria.nome} decision={decision} selected={answers[decision.id]} disabled={sending} onChoose={id => setAnswers(values => ({ ...values, [decision.id]: id }))} />
          <div className="simulation-decision-actions"><button type="button" onClick={() => setCurrent(value => Math.max(0, value - 1))} disabled={current === 0 || sending}><ChevronLeft size={16} />Voltar</button><button className="simulation-training-primary" type="button" onClick={() => void next()} disabled={!answers[decision.id] || sending}>{sending ? 'Salvando resultado…' : current === simulation.questoes.length - 1 ? 'Concluir cenário' : 'Continuar cenário'}<ArrowRight size={16} /></button></div>
        </section></div>
      </> : !error && <div className="simulation-training-loading">Este treino ainda não tem decisões disponíveis. <Link href="/simulacoes">Voltar ao catálogo</Link></div>}
    </section>
  </main>
}
