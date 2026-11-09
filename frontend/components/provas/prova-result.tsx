import Link from 'next/link'
import type { ResultadoTentativa } from '@/lib/provas-api'

export function ProvaResult({ resultado }: { resultado: ResultadoTentativa }) {
  const aprovado = resultado.nota >= 6

  return (
    <section className="prova-resultado" aria-live="polite">
      <h2>Avaliação concluída</h2>
      <p className={`prova-resultado-nota ${aprovado ? 'is-aprovado' : 'is-reprovado'}`}>
        {resultado.nota.toFixed(1)}
      </p>
      <p className="prova-resultado-detalhe">
        Você acertou {resultado.totalAcertos} de {resultado.totalQuestoes}{' '}
        {resultado.totalQuestoes === 1 ? 'questão' : 'questões'}.
      </p>
      <div className="prova-resultado-acoes">
        <Link href="/avaliacoes">Voltar às avaliações</Link>
        <Link href="/aulas">Continuar estudando</Link>
      </div>
    </section>
  )
}
