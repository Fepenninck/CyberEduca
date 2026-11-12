import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { ProvaResumo, TentativaHistorico } from '@/lib/provas-api'
import './provas.css'

const niveis: Record<string, { nome: string; cor: string }> = {
  BASICO: { nome: 'Básico', cor: '#24b4ff' },
  INTERMEDIARIO: { nome: 'Intermediário', cor: '#ffd34e' },
  AVANCADO: { nome: 'Avançado', cor: '#ff4654' },
}

export function ProvaCard({ prova, resultado }: { prova: ProvaResumo; resultado?: TentativaHistorico }) {
  const nivel = niveis[prova.trilha.nivel] ?? niveis.BASICO
  const aprovado = resultado ? resultado.nota >= 6 : false

  return (
    <article className="activity-card prova-nivel-card" style={{ '--level-color': nivel.cor } as CSSProperties}>
      <div className="prova-card-top">
        <span className="activity-kicker">Nível {nivel.nome.toLowerCase()}</span>
        {resultado && <span className={`prova-card-nota ${aprovado ? 'is-aprovado' : 'is-reprovado'}`}>{resultado.nota.toFixed(1).replace('.', ',')}</span>}
      </div>
      <h2>{prova.titulo}</h2>
      {prova.descricao && <p>{prova.descricao}</p>}
      <div className="activity-card-footer">
        <span>{prova.totalQuestoes} {prova.totalQuestoes === 1 ? 'questão' : 'questões'}</span>
        {resultado && <span className={`activity-status${aprovado ? '' : ' is-low'}`}>{aprovado ? 'Aprovado' : 'Abaixo da média'}: {resultado.totalAcertos} de {resultado.totalQuestoes}</span>}
      </div>
      <Link className="activity-card-link" href={`/avaliacoes/${prova.id}`}>
        {resultado ? 'Ver resultado' : 'Iniciar avaliação'}
      </Link>
    </article>
  )
}
