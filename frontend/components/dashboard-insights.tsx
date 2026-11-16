import { Children, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Desempenho } from '@/lib/api'
import type { Achievement } from './level-achievements'
import { progressoDoPercurso } from '@/lib/learning-progress'

const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function CardsCompactos({ children }: { children: ReactNode }) {
  const grid = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = grid.current
    if (!element) return
    const update = () => {
      const styles = getComputedStyle(element)
      const gap = parseFloat(styles.rowGap) || 0
      const row = parseFloat(styles.gridAutoRows) || 1
      for (const wrapper of Array.from(element.children) as HTMLElement[]) {
        const card = wrapper.firstElementChild
        if (card) wrapper.style.gridRowEnd = `span ${Math.ceil((card.getBoundingClientRect().height + gap) / (row + gap))}`
      }
    }
    const observer = new ResizeObserver(update)
    for (const wrapper of Array.from(element.children)) {
      if (wrapper.firstElementChild) observer.observe(wrapper.firstElementChild)
    }
    update()
    return () => observer.disconnect()
  }, [children])
  return <div className="insight-grid insight-grid-compact" ref={grid}>{Children.toArray(children).map((child, index) => <div className="insight-slot" key={index}>{child}</div>)}</div>
}

function nomeDoDia(chave: string) {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return diasDaSemana[new Date(ano, mes - 1, dia).getDay()]
}

function Progresso({ categoria, percentual, descricao, indicador = 'concluído' }: { categoria: string; percentual: number; descricao: string; indicador?: string }) {
  return <header className="insight-heading">
    <div className="insight-heading-row"><h3>{categoria}</h3><span className="insight-completion"><strong>{percentual}%</strong> {indicador}</span></div>
    <div className="insight-progress" role="progressbar" aria-label={`${categoria}: conclusão`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentual}><span style={{ width: `${percentual}%` }} /></div>
    <p>{descricao}</p>
  </header>
}

function Ritmo({ dados, aulas, niveis }: { dados: Desempenho['ritmo']; aulas: Desempenho['aulas']; niveis: Achievement[] }) {
  const maior = Math.max(1, ...dados.semana.map((dia) => dia.aulas))
  return (
    <article className="insight-card" style={{ '--insight-color': '#b2ff00' } as CSSProperties}>
      <Progresso categoria="Aulas e provas" percentual={progressoDoPercurso(niveis)} descricao="Cada nível tem duas etapas: aulas (50%) e aprovação na prova (50%). Níveis bloqueados não somam progresso." />
      <p className="insight-history">Histórico preservado: {aulas.concluidas} de {aulas.total} aulas estudadas.</p>
      <dl className="insight-metrics">
        <div><dt>Dias seguidos estudando</dt><dd>{dados.diasSeguidos}</dd></div>
        <div><dt>Aulas nos últimos 7 dias</dt><dd>{dados.aulasNaSemana}</dd></div>
      </dl>
      <div className="insight-activity"><h4>Atividade nos últimos 7 dias</h4>
      <ol className="insight-week" aria-label="Aulas concluídas por dia">
        {dados.semana.map((dia, indice) => (
          <li key={dia.dia} title={`${dia.dia}: ${dia.aulas} aulas concluídas`} className={indice === dados.semana.length - 1 ? 'is-today' : undefined}>
            <span className="insight-week-bar"><span style={{ height: `${dia.aulas ? Math.max(4, (dia.aulas / maior) * 100) : 0}%` }} /></span>
            <small>{indice === dados.semana.length - 1 ? 'Hoje' : nomeDoDia(dia.dia)}</small>
            <span className="insight-week-count">{dia.aulas}</span>
          </li>
        ))}
      </ol>
      </div>
    </article>
  )
}

type Resultado = { id: string; titulo: string; acertos: number; totalQuestoes: number; percentual: number }

function CardResultados({ categoria, cor, media, conclusao, feitas, tentativas, acertos, erros, melhor, pior, singular, plural, vazio, notaMinima }: {
  categoria: string; cor: string; media: number | null; conclusao: number; feitas: number; tentativas: number;
  acertos: number; erros: number; melhor: Resultado | null; pior: Resultado | null;
  singular: string; plural: string; vazio: string;
  notaMinima?: number;
}) {
  return <article className="insight-card" style={{ '--insight-color': cor } as CSSProperties}>
    <Progresso categoria={categoria} percentual={conclusao} descricao={`${feitas} ${feitas === 1 ? singular : plural} em ${tentativas} ${tentativas === 1 ? 'tentativa' : 'tentativas'}.`} />
      <dl className="insight-metrics">
        <div><dt>Acertos</dt><dd>{acertos}</dd></div>
        <div><dt>Erros</dt><dd>{erros}</dd></div>
      </dl>
    {media === null ? <div className="insight-empty"><h4>Comece sua primeira atividade</h4><p>{vazio}</p></div> : <>
      <dl className="insight-quiz">
        {melhor && <div className={notaMinima !== undefined && melhor.acertos / melhor.totalQuestoes * 100 < notaMinima ? 'is-review' : undefined}><dt>{notaMinima !== undefined && melhor.acertos / melhor.totalQuestoes * 100 < notaMinima ? 'Abaixo da nota mínima — precisa revisar' : 'Maior aproveitamento'}</dt><dd><span>{melhor.titulo}<small>{melhor.acertos} de {melhor.totalQuestoes} acertos</small></span><strong>{melhor.percentual}%</strong></dd></div>}
        {pior && pior.id !== melhor?.id && <div className="is-review"><dt>Precisa de mais atenção</dt><dd><span>{pior.titulo}<small>{pior.acertos} de {pior.totalQuestoes} acertos</small></span><strong>{pior.percentual}%</strong></dd></div>}
      </dl>
    </>}
    {notaMinima !== undefined && <p className="insight-note">Nota mínima para aprovação: {notaMinima / 10} de 10 ({notaMinima}%).</p>}
  </article>
}

export function DashboardInsights({ desempenho, niveis = [] }: { desempenho: Desempenho | null; niveis?: Achievement[] }) {
  if (!desempenho) return null
  return <section className="dashboard-insights" aria-labelledby="insights-title">
    <h2 id="insights-title">Seu desempenho</h2>
    <CardsCompactos>
      <Ritmo dados={desempenho.ritmo} aulas={desempenho.aulas} niveis={niveis} />
      <CardResultados categoria="Quizzes" cor="#ffd34e" conclusao={desempenho.quizzes.conclusao} media={desempenho.quizzes.media}
        feitas={desempenho.quizzes.feitos} tentativas={desempenho.quizzes.tentativas}
        acertos={desempenho.quizzes.acertos} erros={desempenho.quizzes.erros}
        melhor={desempenho.quizzes.melhor && { ...desempenho.quizzes.melhor, id: desempenho.quizzes.melhor.quizId }}
        pior={desempenho.quizzes.pior && { ...desempenho.quizzes.pior, id: desempenho.quizzes.pior.quizId }}
        singular="quiz respondido" plural="quizzes respondidos"
        vazio="Responda aos quizzes das aulas para acompanhar seus acertos e identificar temas para revisar." />
      <CardResultados categoria="Simulações" cor="#24b4ff" conclusao={desempenho.simulacoes.conclusao} media={desempenho.simulacoes.aproveitamento}
        feitas={desempenho.simulacoes.feitas} tentativas={desempenho.simulacoes.realizadas}
        acertos={desempenho.simulacoes.acertos} erros={desempenho.simulacoes.erros}
        melhor={desempenho.simulacoes.melhorResultado} pior={desempenho.simulacoes.piorResultado}
        singular="simulação respondida" plural="simulações respondidas"
        vazio="Conclua simulações para acompanhar seus acertos e identificar situações para revisar." />
      <CardResultados categoria="Avaliações" cor="#ff7085" conclusao={desempenho.avaliacoes.conclusao} media={desempenho.avaliacoes.media} notaMinima={60}
        feitas={desempenho.avaliacoes.feitas} tentativas={desempenho.avaliacoes.realizadas}
        acertos={desempenho.avaliacoes.acertos} erros={desempenho.avaliacoes.erros}
        melhor={desempenho.avaliacoes.melhorResultado} pior={desempenho.avaliacoes.piorResultado}
        singular="avaliação respondida" plural="avaliações respondidas"
        vazio="Conclua avaliações nas trilhas para acompanhar seus acertos e identificar conteúdos para revisar." />
    </CardsCompactos>
  </section>
}
