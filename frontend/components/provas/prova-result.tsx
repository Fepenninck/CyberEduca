import Link from 'next/link'
import type { ResultadoTentativa } from '@/lib/provas-api'

export function ProvaResult({ resultado }: { resultado: ResultadoTentativa }) {
  const aprovado = resultado.nota >= 6

  return (
    <section className="activity-panel" aria-live="polite">
      <h2>Avaliação concluída</h2>
      <p className={`prova-resultado-nota ${aprovado ? 'is-aprovado' : 'is-reprovado'}`}>
        {resultado.nota.toFixed(1)}
      </p>
      <p className="prova-resultado-detalhe">
        Você acertou {resultado.totalAcertos} de {resultado.totalQuestoes}{' '}
        {resultado.totalQuestoes === 1 ? 'questão' : 'questões'}.
      </p>
      <p className="activity-muted">Sua nota foi registrada no histórico da conta.</p>
      {resultado.feedback && <div className="quiz-feedback-list">
        {resultado.feedback.map((item) => <article key={item.questaoId} className={`quiz-feedback${item.correta ? ' is-correct' : ''}`}>
          <span className="activity-feedback-label">{item.correta ? 'Resposta correta' : 'Revise esta resposta'}</span>
          <h3>{item.enunciado}</h3>
          <p>Resposta correta: {item.respostaCorreta}</p>
          {item.explicacao && <p className="feedback-explanation">{item.explicacao}</p>}
        </article>)}
      </div>}
      <div className="activity-actions">
        <Link className="dashboard-button-primary" href="/avaliacoes">Voltar às avaliações</Link>
        <Link className="dashboard-button-secondary" href="/aulas">Continuar estudando</Link>
      </div>
    </section>
  )
}
