import Link from 'next/link'
import { ArrowUpRight, ClipboardCheck } from 'lucide-react'
import type { ProvaResumo, TentativaHistorico } from '@/lib/provas-api'

export function ProvaCard({ prova, resultado }: { prova: ProvaResumo; resultado?: TentativaHistorico }) {
  return (
    <article className="activity-card">
      <div className="activity-card-icon"><ClipboardCheck size={26} /></div>
      <span className="activity-kicker">Avaliação • {prova.trilha.nivel === 'BASICO' ? 'Básico' : prova.trilha.nivel === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}</span>
      <h2>{prova.titulo}</h2>
      {prova.descricao && <p>{prova.descricao}</p>}
      <div className="activity-card-meta">
        <span>{prova.totalQuestoes} {prova.totalQuestoes === 1 ? 'questão' : 'questões'}</span>
      </div>
      <span className="activity-lesson">{prova.trilha.titulo}</span>
      {resultado && <p className="assessment-score">Concluída · Nota {resultado.nota.toFixed(1).replace('.', ',')} de 10</p>}
      <Link className="activity-card-link" href={`/avaliacoes/${prova.id}`}>
        {resultado ? 'Ver resultado' : 'Iniciar avaliação'} <ArrowUpRight size={18} />
      </Link>
    </article>
  )
}
