import Link from 'next/link'
import type { ResultadoTentativa } from '@/lib/provas-api'

export function ProvaResult({ resultado }: { resultado: ResultadoTentativa }) {
  const aprovado = resultado.nota >= 6
  const percentual = Math.max(0, Math.min(100, resultado.nota * 10))
  const circunferencia = 2 * Math.PI * 52

  return (
    <section className="activity-panel" aria-live="polite">
      <h2>Avaliação concluída</h2>
      <div className="prova-resultado-resumo">
        <div className={`prova-resultado-anel ${aprovado ? 'is-aprovado' : 'is-reprovado'}`} role="img" aria-label={`Nota ${resultado.nota.toFixed(1).replace('.', ',')} de 10`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="prova-anel-fundo" cx="60" cy="60" r="52" />
            <circle className="prova-anel-valor" cx="60" cy="60" r="52" strokeDasharray={circunferencia} strokeDashoffset={circunferencia * (1 - percentual / 100)} />
          </svg>
          <p className={`prova-resultado-nota ${aprovado ? 'is-aprovado' : 'is-reprovado'}`}>
            {resultado.nota.toFixed(1).replace('.', ',')}<small>de 10</small>
          </p>
        </div>
        <div>
          <strong className="prova-resultado-titulo">{aprovado ? 'Você foi aprovado.' : 'Ainda não foi desta vez.'}</strong>
          <p className="prova-resultado-detalhe">
            Você acertou {resultado.totalAcertos} de {resultado.totalQuestoes}{' '}
            {resultado.totalQuestoes === 1 ? 'questão' : 'questões'}.
          </p>
          <p className="activity-muted">{aprovado ? 'Sua nota foi registrada no histórico da conta.' : 'Sua nota foi registrada. Revise as explicações abaixo e volte às aulas do nível.'}</p>
        </div>
      </div>
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
