'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ActivityShell } from '@/components/activities/activity-shell'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { ProvaPlayer } from '@/components/provas/prova-player'
import { ProvaResult } from '@/components/provas/prova-result'
import { buscarResultadoTentativa, type ResultadoTentativa } from '@/lib/provas-api'
import { listarCertificacoes, iniciarCertificacao, enviarCertificacao, levelTitles, type Level, type CertificationStatus, type CertificationPaper } from '@/lib/certificacoes-api'
import './certification.css'

export default function LevelExamPage({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel: rawLevel } = use(params)
  const level = rawLevel.toUpperCase() as Level
  const [status, setStatus] = useState<CertificationStatus | null>(null)
  const [paper, setPaper] = useState<CertificationPaper | null>(null)
  const [result, setResult] = useState<ResultadoTentativa | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    setLoading(true); setPaper(null); setResult(null); setError('')
    async function load() {
      try {
        if (!levelTitles[level]) throw new Error('Nível não encontrado.')
        const state = (await listarCertificacoes()).find(item => item.nivel === level)!
        if (!active) return
        setStatus(state)
        if (state.ultimaTentativa) {
          const saved = await buscarResultadoTentativa(state.ultimaTentativa.id)
          if (active) setResult({ ...saved, nivel: level, aprovado: state.aprovado, notaMinima: state.notaMinima, proximaTentativaEm: state.proximaTentativaEm, feedback: saved.feedback?.map(item => ({ ...item, explicacao: item.explicacao.replace(/^\[aula:[a-zA-Z0-9-]+\]\s*/, '') })) })
        }
        if (state.motivo === 'AGUARDE' && state.proximaTentativaEm) timer = setTimeout(() => setRefresh(value => value + 1), Math.max(500, new Date(state.proximaTentativaEm).getTime() - Date.now() + 500))
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a prova.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false; if (timer) clearTimeout(timer) }
  }, [level, refresh])
  async function start() {
    setStarting(true); setError('')
    try { setPaper(await iniciarCertificacao(level)); setResult(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a prova.') }
    finally { setStarting(false) }
  }
  return <div className="certification-detail-page"><ActivityShell section="aulas" title={`Prova - Nível ${levelTitles[level] ?? ''}`} description="Reúna o que aprendeu nas aulas deste nível. A aprovação concede a insígnia e libera a próxima etapa da sua jornada." back="/aulas">
    {loading ? <LoadingScreen label="Preparando sua prova..." /> : <>
      {error && <div className="activity-state activity-error" role="alert"><p>{error}</p><button type="button" className="dashboard-button-secondary" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div>}
      {paper ? <ProvaPlayer key={paper.token} prova={{ id: status!.provaId, titulo: paper.titulo, descricao: '', totalQuestoes: paper.totalQuestoes, trilha: { id: status!.provaId, titulo: `Nível ${levelTitles[level]}`, nivel: level }, questoes: paper.questoes }} onEnviar={answers => enviarCertificacao(level, paper.token, answers)} /> : status && <>
        {status.podeIniciar ? <section className="activity-panel certification-intro"><h2>{status.ultimaTentativa ? 'Uma nova oportunidade de avançar' : 'Pronto para concluir este nível?'}</h2><p>Esta prova tem {status.totalQuestoes} questões, uma sobre cada aula do nível {levelTitles[level].toLowerCase()}. Para passar, acerte pelo menos {status.notaMinima * 10}% das questões.</p><p>Após uma reprovação, a próxima tentativa fica disponível depois de 24 horas, com outras questões. Revise os conteúdos e responda com atenção.</p><button type="button" className="dashboard-button-primary" disabled={starting} onClick={start}>{starting ? 'Preparando questões...' : 'Iniciar prova'}</button></section> : !result && <section className="activity-state"><h2>{status.motivo === 'NIVEL_ANTERIOR' ? 'Conclua o nível anterior' : status.motivo === 'BANCO_INCOMPLETO' ? 'Prova em preparação' : 'Conclua todas as aulas deste nível'}</h2><p>{status.aulasConcluidas} de {status.totalAulas} aulas concluídas.</p><Link className="dashboard-button-secondary" href="/aulas">Voltar às trilhas</Link></section>}
        {result && <ProvaResult resultado={result} modal />}
      </>}
    </>}
  </ActivityShell></div>
}
