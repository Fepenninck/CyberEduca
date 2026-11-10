'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { ActivityShell } from '@/components/activities/activity-shell'
import { ActivityEmpty, ActivityError, ActivityLoading } from '@/components/activities/activity-state'
import { useActivity } from '@/components/activities/use-activity'
import { ProvaCard } from '@/components/provas/prova-card'
import { listarProvas, listarMinhasTentativas } from '@/lib/provas-api'

export default function AvaliacoesPage() {
  const loader = useCallback(async () => {
    const [provas, tentativas] = await Promise.all([listarProvas(), listarMinhasTentativas()])
    return {
      provas: provas.map((prova) => ({ ...prova, resultado: tentativas.find((tentativa) => tentativa.provaId === prova.id && tentativa.concluidoEm) })),
      anteriores: tentativas.filter((tentativa, indice) => tentativa.concluidoEm && !provas.some((prova) => prova.id === tentativa.provaId) && tentativas.findIndex((item) => item.provaId === tentativa.provaId) === indice),
    }
  }, [])
  const { data, error, loading, retry } = useActivity(loader)
  const provas = data?.provas

  return (
    <ActivityShell section="avaliacoes" title="Uma conquista para cada nível." description="Os quizzes revisam cada aula. Aqui, as avaliações finais reúnem o conteúdo das trilhas de nível básico, intermediário e avançado, com nota e resultado salvos na sua conta.">
      <div className="activity-section-label">
        <h2>Avaliações disponíveis</h2>
        <span>{provas ? `${provas.length} avaliações` : 'Conhecimento na prática'}</span>
      </div>
      {loading ? <ActivityLoading /> : error ? <ActivityError error={error} retry={retry} /> : provas?.length ? (
        <div className="assessment-levels">{(['BASICO', 'INTERMEDIARIO', 'AVANCADO'] as const).map((nivel) => {
          const grupo = provas.filter((prova) => prova.trilha.nivel === nivel)
          return grupo.length > 0 && <section key={nivel} className="library-section">
            <div className="activity-section-label"><h2>Nível {nivel === 'BASICO' ? 'básico' : nivel === 'INTERMEDIARIO' ? 'intermediário' : 'avançado'}</h2></div>
            <div className="activity-grid">{grupo.map((prova) => <ProvaCard key={prova.id} prova={prova} resultado={prova.resultado} />)}</div>
          </section>
        })}</div>
      ) : <ActivityEmpty>As avaliações aparecerão aqui quando forem publicadas.</ActivityEmpty>}
      {!!data?.anteriores.length && <section className="library-section">
        <div className="activity-section-label"><h2>Resultados anteriores</h2></div>
        <p className="activity-muted">Seu histórico continua disponível mesmo quando uma avaliação é arquivada.</p>
        <div className="activity-grid">{data.anteriores.map((tentativa) => <article key={tentativa.tentativaId} className="activity-card">
          <span className="activity-kicker">Concluída</span><h2>{tentativa.provaTitulo}</h2>
          <p>Nota {tentativa.nota.toFixed(1).replace('.', ',')} de 10 · {tentativa.totalAcertos} de {tentativa.totalQuestoes} acertos</p>
          <Link className="activity-card-link" href={`/avaliacoes/${tentativa.provaId}`}>Ver resultado</Link>
        </article>)}</div>
      </section>}
    </ActivityShell>
  )
}
