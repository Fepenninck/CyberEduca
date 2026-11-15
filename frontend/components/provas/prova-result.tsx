'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { ResultadoTentativa } from '@/lib/provas-api'

export function ProvaResult({ resultado, modal = false }: { resultado: ResultadoTentativa; modal?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [modalOpen, setModalOpen] = useState(true)
  useEffect(() => {
    if (!modal || !modalOpen) return
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialog && !dialog.open) dialog.showModal()
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow }
  }, [modal, modalOpen])
  const aprovado = resultado.aprovado ?? resultado.nota >= (resultado.notaMinima ?? 6)
  const percentual = Math.max(0, Math.min(100, resultado.nota * 10))
  const circunferencia = 2 * Math.PI * 52

  const summary = (
    <>
      <h2 id={titleId}>Prova concluída</h2>
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
          <p className="activity-muted">{aprovado ? resultado.nivel ? 'Você conquistou a insígnia deste nível. Continue sua jornada pelas trilhas.' : 'Sua nota foi registrada no histórico da conta.' : 'Sua nota foi registrada. Revise as questões e volte às aulas do nível.'}</p>
          {!aprovado && resultado.proximaTentativaEm && <p className="activity-muted">Uma prova com outras questões estará disponível em {new Date(resultado.proximaTentativaEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}.</p>}
        </div>
      </div>
    </>
  )
  const content = (
    <section className="activity-panel assessment-result" aria-live="polite">
      {modal ? <h2>Confira suas respostas</h2> : summary}
      {resultado.feedback && <div className="quiz-feedback-list">
        {resultado.feedback.map((item) => <article key={item.questaoId} className={`quiz-feedback${item.correta ? ' is-correct' : ''}`}>
          <span className="activity-feedback-label">{item.correta ? 'Resposta correta' : 'Revise esta resposta'}</span>
          <h3>{item.enunciado}</h3>
          <p>Resposta correta: {item.respostaCorreta}</p>
          {item.explicacao && <p className="feedback-explanation">{item.explicacao}</p>}
        </article>)}
      </div>}
      <div className="activity-actions">
        <Link className="dashboard-button-primary" href="/aulas">Voltar às trilhas</Link>
      </div>
    </section>
  )
  return <>
    {content}
    {modal && modalOpen && <dialog ref={dialogRef} className="certification-result-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); setModalOpen(false) }}>
      <button type="button" className="certification-result-close" aria-label="Fechar resultado" onClick={() => setModalOpen(false)}><X size={20} /></button>
      <section className="activity-panel assessment-result">
        {summary}
        <div className="activity-actions">
          <button type="button" className="dashboard-button-primary" onClick={() => setModalOpen(false)}>Fechar</button>
        </div>
      </section>
    </dialog>}
  </>
}
