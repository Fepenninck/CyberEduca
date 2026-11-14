import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Desempenho } from '@/lib/api'

const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function nomeDoDia(chave: string) {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return diasDaSemana[new Date(ano, mes - 1, dia).getDay()]
}

function Ritmo({ dados, aulas }: { dados: Desempenho['ritmo']; aulas: Desempenho['aulas'] }) {
  const maior = Math.max(1, ...dados.semana.map((dia) => dia.aulas))
  return (
    <article className="insight-card" style={{ '--insight-color': '#c28cf5' } as CSSProperties}>
      <span className="insight-category">Aulas</span>
      <h3><em>{aulas.concluidas}</em> de {aulas.total} aulas concluídas</h3>
      <p>{dados.diasSeguidos > 0 ? `${dados.diasSeguidos} ${dados.diasSeguidos === 1 ? 'dia seguido' : 'dias seguidos'} estudando.` : 'Comece uma sequência hoje.'}</p>
      <p>{dados.aulasNaSemana > 0 ? `${dados.aulasNaSemana} ${dados.aulasNaSemana === 1 ? 'aula concluída' : 'aulas concluídas'} nos últimos 7 dias.` : 'Nenhuma aula nos últimos 7 dias. Uma aula hoje já inicia sua sequência.'}</p>
      <ol className="insight-week" aria-label="Aulas concluídas por dia">
        {dados.semana.map((dia, indice) => (
          <li key={dia.dia} className={indice === dados.semana.length - 1 ? 'is-today' : undefined}>
            <span className="insight-week-bar"><span style={{ height: `${Math.max(dia.aulas ? 14 : 4, (dia.aulas / maior) * 100)}%` }} /></span>
            <small>{indice === dados.semana.length - 1 ? 'Hoje' : nomeDoDia(dia.dia)}</small>
            <span className="sr-only">{dia.aulas} aulas</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function Quizzes({ dados }: { dados: Desempenho['quizzes'] }) {
  return (
    <article className="insight-card" style={{ '--insight-color': '#ffd34e' } as CSSProperties}>
      <span className="insight-category">Quizzes</span>
      {dados.media === null ? (
        <>
          <h3>Teste o que você aprendeu</h3>
          <p>Cada aula tem um quiz rápido. Faça o primeiro para ver aqui seus pontos fortes.</p>
          <Link className="insight-link" href="/quizzes">Ver quizzes <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </>
      ) : (
        <>
          <h3>Média de <em>{dados.media}%</em> nos quizzes</h3>
          <p>{dados.feitos} {dados.feitos === 1 ? 'quiz respondido' : 'quizzes respondidos'} até agora.</p>
          <dl className="insight-quiz">
            {dados.melhor && <div><dt>Seu melhor</dt><dd>{dados.melhor.titulo}<strong>{dados.melhor.percentual}%</strong></dd></div>}
            {dados.revisar && <div className="is-review"><dt>Vale revisar</dt><dd><Link href={`/quizzes/${dados.revisar.quizId}`}>{dados.revisar.titulo}</Link><strong>{dados.revisar.percentual}%</strong></dd></div>}
          </dl>
        </>
      )}
    </article>
  )
}

export function DashboardInsights({ desempenho }: { desempenho: Desempenho | null }) {
  if (!desempenho) return null
  return (
    <section className="dashboard-insights" aria-labelledby="insights-title">
      <h2 id="insights-title">Seu desempenho</h2>
      <div className="insight-grid">
        <Ritmo dados={desempenho.ritmo} aulas={desempenho.aulas} />
        <Quizzes dados={desempenho.quizzes} />
        <article className="insight-card" style={{ '--insight-color': '#24b4ff' } as CSSProperties}>
          <span className="insight-category">Simulações</span>
          <h3>{desempenho.simulacoes.realizadas ? <><em>{desempenho.simulacoes.realizadas}</em> atividades realizadas</> : 'Pratique com situações simuladas'}</h3>
          <p>{desempenho.simulacoes.aproveitamento === null ? 'Seus resultados aparecem aqui após a primeira simulação.' : `${desempenho.simulacoes.acertos} de ${desempenho.simulacoes.totalQuestoes} respostas corretas · ${desempenho.simulacoes.aproveitamento}% de aproveitamento.`}</p>
          <Link className="insight-link" href="/simulacoes">Acessar simulações</Link>
        </article>
        <article className="insight-card" style={{ '--insight-color': '#ff7085' } as CSSProperties}>
          <span className="insight-category">Avaliações</span>
          <h3>{desempenho.avaliacoes.media === null ? 'Acompanhe suas avaliações' : <>Média de <em>{desempenho.avaliacoes.media}%</em> nas avaliações</>}</h3>
          <p>{desempenho.avaliacoes.realizadas ? `${desempenho.avaliacoes.realizadas} tentativas concluídas · Melhor resultado: ${desempenho.avaliacoes.melhor}%.` : 'As notas aparecerão quando você concluir uma avaliação.'}</p>
          <Link className="insight-link" href="/avaliacoes">Acessar avaliações</Link>
        </article>
      </div>
    </section>
  )
}
