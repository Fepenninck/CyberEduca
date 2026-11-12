import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight, Flame, ListChecks, MailWarning, Trophy } from 'lucide-react'
import type { Desempenho } from '@/lib/api'

const canais: Record<Desempenho['phishing']['porTipo'][number]['tipo'], string> = {
  EMAIL: 'e-mail',
  SMS: 'SMS',
  SITE: 'sites',
  REDE_SOCIAL: 'redes sociais',
}

const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function nomeDoDia(chave: string) {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return diasDaSemana[new Date(ano, mes - 1, dia).getDay()]
}

function Comparativo({ dados }: { dados: Desempenho['comparativo'] }) {
  const percentil = dados.percentil
  return (
    <article className="insight-card" style={{ '--insight-color': '#b2ff00' } as CSSProperties}>
      <span className="insight-icon"><Trophy size={18} /></span>
      {percentil === null ? (
        <>
          <h3>Você está abrindo caminho</h3>
          <p>Ainda não há outros alunos para comparar. Suas {dados.aulasConcluidas} aulas concluídas já contam como referência.</p>
        </>
      ) : (
        <>
          <h3>À frente de <em>{percentil}%</em> dos alunos</h3>
          <p>{dados.aulasConcluidas === 0 ? 'Conclua sua primeira aula para entrar no ranking da turma.' : `Comparação feita pelas ${dados.aulasConcluidas} aulas que você já concluiu.`}</p>
          <div className="insight-rank" aria-hidden="true">
            <span className="insight-rank-fill" style={{ width: `${percentil}%` }} />
            <span className="insight-rank-you" style={{ left: `${percentil}%` }}>você</span>
          </div>
          <div className="insight-rank-scale" aria-hidden="true"><span>Menos aulas</span><span>Mais aulas</span></div>
        </>
      )}
    </article>
  )
}

function Ritmo({ dados }: { dados: Desempenho['ritmo'] }) {
  const maior = Math.max(1, ...dados.semana.map((dia) => dia.aulas))
  return (
    <article className="insight-card" style={{ '--insight-color': '#c28cf5' } as CSSProperties}>
      <span className="insight-icon"><Flame size={18} /></span>
      <h3>{dados.diasSeguidos > 0 ? <><em>{dados.diasSeguidos}</em> {dados.diasSeguidos === 1 ? 'dia' : 'dias'} seguidos estudando</> : 'Comece uma sequência hoje'}</h3>
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

function DetectorDeGolpes({ dados }: { dados: Desempenho['phishing'] }) {
  const comTaxa = dados.porTipo.map((canal) => ({ ...canal, taxa: Math.round((canal.acertos / canal.total) * 100) }))
  const ordenados = [...comTaxa].sort((a, b) => b.taxa - a.taxa || b.total - a.total)
  const forte = ordenados[0]
  const fraco = ordenados.length > 1 && ordenados[ordenados.length - 1].taxa < forte.taxa ? ordenados[ordenados.length - 1] : null

  return (
    <article className="insight-card" style={{ '--insight-color': '#24b4ff' } as CSSProperties}>
      <span className="insight-icon"><MailWarning size={18} /></span>
      {dados.respondidos === 0 ? (
        <>
          <h3>Qual golpe engana você?</h3>
          <p>Responda algumas simulações para descobrir em qual canal você reconhece melhor o phishing.</p>
          <Link className="insight-link" href="/simulacoes">Fazer uma simulação <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </>
      ) : (
        <>
          <h3>Você reconhece melhor golpes por <em>{canais[forte.tipo]}</em></h3>
          <p>{fraco ? `Fique de olho em ${canais[fraco.tipo]}: ${fraco.acertos} de ${fraco.total} acertos.` : `${dados.acertos} de ${dados.respondidos} situações identificadas corretamente.`}</p>
          <ul className="insight-channels">
            {comTaxa.map((canal) => (
              <li key={canal.tipo}>
                <span>{canais[canal.tipo]}</span>
                <span className="insight-channel-bar"><span style={{ width: `${canal.taxa}%` }} /></span>
                <strong>{canal.acertos}/{canal.total}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

function Quizzes({ dados }: { dados: Desempenho['quizzes'] }) {
  return (
    <article className="insight-card" style={{ '--insight-color': '#ffd34e' } as CSSProperties}>
      <span className="insight-icon"><ListChecks size={18} /></span>
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
        <Comparativo dados={desempenho.comparativo} />
        <Ritmo dados={desempenho.ritmo} />
        <DetectorDeGolpes dados={desempenho.phishing} />
        <Quizzes dados={desempenho.quizzes} />
      </div>
    </section>
  )
}
