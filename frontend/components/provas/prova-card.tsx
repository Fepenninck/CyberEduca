import Link from 'next/link'
import type { ProvaResumo } from '@/lib/provas-api'

export function ProvaCard({ prova }: { prova: ProvaResumo }) {
  return (
    <article className="prova-card">
      <h3>{prova.titulo}</h3>
      {prova.descricao && <p>{prova.descricao}</p>}
      <div className="prova-card-meta">
        <span>{prova.trilha.titulo}</span>
        <span>{prova.totalQuestoes} {prova.totalQuestoes === 1 ? 'questão' : 'questões'}</span>
      </div>
      <Link className="prova-card-cta" href={`/avaliacoes/${prova.id}`}>
        Iniciar avaliação
      </Link>
    </article>
  )
}
