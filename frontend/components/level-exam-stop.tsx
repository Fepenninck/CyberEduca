'use client'
import Link from 'next/link'
import { LEVEL_BADGES } from './level-achievements'
import { type CertificationStatus, type Level, levelTitles } from '@/lib/certificacoes-api'
import './level-exam-stop.css'
export function LevelExamStop({ level, status, error }: { level: Level; status?: CertificationStatus; error: boolean }) {
  const badge = LEVEL_BADGES.find(item => item.level === level)!
  const waiting = status?.motivo === 'AGUARDE'
  return <article className={`trail-achievement level-exam-stop ${status?.aprovado ? 'is-earned' : 'is-locked'}`} data-level={level}>
    <span className="trail-achievement-label">Conquista do nível</span><img src={badge.src} alt={`Insígnia ${badge.title}`} width={300} height={200} /><h2>Prova final - {levelTitles[level]}</h2>
    {error ? <p role="status">Não foi possível carregar a prova. Atualize a página para tentar novamente.</p> : !status ? <p>Carregando progresso...</p> : <>
      <strong>{status.aprovado ? 'Insígnia conquistada!' : status.podeIniciar ? 'Você já pode fazer a prova' : waiting ? 'Revise o conteúdo antes de tentar novamente' : `${status.aulasConcluidas} de ${status.totalAulas} aulas concluídas`}</strong>
      {status.ultimaTentativa && <p>Última nota: {status.ultimaTentativa.nota.toFixed(1).replace('.', ',')} de 10</p>}
      {status.aprovado ? <p>{level === 'AVANCADO' ? 'Você concluiu todos os níveis da jornada.' : 'O próximo nível está liberado.'}</p> : <p>{status.motivo === 'NIVEL_ANTERIOR' ? 'Seja aprovado na prova do nível anterior para continuar.' : status.motivo === 'BANCO_INCOMPLETO' ? 'A prova deste nível está sendo preparada.' : `${status.totalQuestoes} questões sobre todas as aulas deste nível. Aprovação com nota ${status.notaMinima}.`}</p>}
      {waiting && status.proximaTentativaEm && <p>Nova prova disponível em {new Date(status.proximaTentativaEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}.</p>}
      {(status.podeIniciar || status.ultimaTentativa) && <Link className="dashboard-button-primary" href={`/aulas/prova/${level}`}>{status.podeIniciar ? status.ultimaTentativa ? 'Fazer nova prova' : 'Fazer prova final' : 'Ver resultado'}</Link>}
    </>}
  </article>
}
