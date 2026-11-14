'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { ActivityEmpty, ActivityError, ActivityLoading } from '@/components/activities/activity-state'
import { useActivity } from '@/components/activities/use-activity'
import { listarCenarios, nomesTipos } from '@/lib/phishing-api'
import { listarSimulacoesDisponiveis } from '@/lib/simulacoes-api'
import { simulationImage, simulationLevels, simulationTheme, type SimulationLevel } from '@/lib/simulation-theme'
import './simulacoes.css'

type Card = { id: string; title: string; description: string; category: string; channel?: string; level: SimulationLevel; minutes: number; decisions: number; href: string; completed: boolean; correct: number; total: number }
const PAGE_SIZE = 8
export default function SimulacoesPage() {
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)
  const [category, setCategory] = useState('')
  const loader = useCallback(async (signal: AbortSignal) => {
    const aulaId = new URLSearchParams(window.location.search).get('aulaId') || undefined
    const [phishing, simulations] = await Promise.all([listarCenarios(aulaId, signal), aulaId ? Promise.resolve([]) : listarSimulacoesDisponiveis(signal)])
    return { phishing, simulations, aulaId }
  }, [])
  const { data, loading, error, retry } = useActivity(loader)
  const cards = useMemo(() => {
    const scenarios: Card[] = (data?.phishing ?? []).map(item => ({ id: item.id, title: item.titulo, description: item.descricao, category: 'Phishing', channel: nomesTipos[item.tipo], level: item.aula.trilha?.nivel ?? 'BASICO', minutes: 2, decisions: 1, href: `/simulacoes/${item.id}`, completed: Boolean(item.tentativas?.length), correct: item.tentativas?.[0]?.acertou ? 1 : 0, total: 1 }))
    const simulations: Card[] = (data?.simulations ?? []).map(item => ({ id: item.id, title: item.titulo, description: item.descricao, category: item.categoria?.nome || 'Outros treinos', level: item.nivel ?? 'BASICO', minutes: item.duracaoMinutos ?? 5, decisions: item._count.questoes, href: `/simulacoes/treino/${item.id}`, completed: Boolean(item.resultados?.length), correct: item.resultados?.[0]?.acertos ?? 0, total: item.resultados?.[0]?.totalQuestoes ?? item._count.questoes }))
    const groups = new Map<string, Card[]>()
    for (const item of [...simulations, ...scenarios]) groups.set(item.category, [...(groups.get(item.category) ?? []), item])
    const order: SimulationLevel[] = ['BASICO', 'INTERMEDIARIO', 'AVANCADO']
    for (const group of groups.values()) group.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level) || a.title.localeCompare(b.title, 'pt-BR'))
    // Alternate topics so the first page offers different kinds of practice.
    const all: Card[] = []
    const pools = [...groups.values()].sort((a, b) => order.indexOf(a[0].level) - order.indexOf(b[0].level) || a[0].category.localeCompare(b[0].category, 'pt-BR'))
    for (let index = 0; pools.some(group => group[index]); index++) for (const group of pools) if (group[index]) all.push(group[index])
    return all.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
  }, [data])
  const categories = useMemo(() => [...new Set(cards.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [cards])
  const filteredCards = cards.filter(item => !category || item.category === category)
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const completed = cards.filter(item => item.completed)
  const totalAnswered = completed.reduce((sum, item) => sum + item.total, 0)
  const accuracy = totalAnswered ? Math.round(completed.reduce((sum, item) => sum + item.correct, 0) / totalAnswered * 100) : null
  const changePage = (delta: number) => { setDirection(delta); setPage(Math.max(0, Math.min(totalPages - 1, currentPage + delta))) }
  return <main className="app-shell dashboard-page simulation-hub"><DashboardNavigation active="simulacoes" />
    <section className="simulation-hub-wrap">
      <header className="simulation-hub-heading"><div><span className="simulation-eyebrow">Aprender na prática</span><h1>Simulações de segurança</h1><p>Explore situações do cotidiano e desafios técnicos. Escolha um cenário, tome suas decisões e entenda o resultado, tudo dentro do site.</p></div><aside className="simulation-header-summary"><span>Seu treinamento</span><div><p><strong>{loading ? '—' : cards.length}</strong>cenários disponíveis</p><p><strong>{loading ? '—' : completed.length}</strong>concluídos por você</p></div><p>{accuracy === null ? 'Cada decisão é uma oportunidade de aprender.' : `${accuracy}% de acertos nas decisões realizadas.`}</p></aside></header>
      {data?.aulaId && <p className="simulation-lesson-context">Exibindo os cenários vinculados à aula. <Link href="/simulacoes">Explorar todos os treinos </Link></p>}
      {loading ? <ActivityLoading /> : error ? <ActivityError error={error} retry={retry} /> : <>
        <div className="simulation-type-picker"><span id="simulation-type-label">O que você quer praticar?</span><details className="simulation-type-dropdown" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary aria-describedby="simulation-type-label">{category || 'Todos os tipos de simulação'}<ChevronDown size={16} /></summary><div className="simulation-type-options" aria-label="Tipos de simulação">{['', ...categories].map(value => <button key={value} type="button" aria-pressed={category === value} onClick={event => { setCategory(value); setPage(0); setDirection(1); const dropdown = event.currentTarget.closest('details'); if (dropdown) { dropdown.open = false; dropdown.querySelector('summary')?.focus() } }}>{value || 'Todos os tipos de simulação'}</button>)}</div></details><span className="simulation-type-order">Do Fácil ao Difícil</span></div>
        <div className="simulation-catalog-heading"><p aria-live="polite">{filteredCards.length ? `Mostrando ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredCards.length)} de ${filteredCards.length} simulações` : 'Nenhuma simulação disponível'}</p><div className="simulation-pager"><span>{currentPage + 1} / {totalPages}</span><button type="button" disabled={currentPage === 0} onClick={() => changePage(-1)} aria-label="Simulações anteriores"><ChevronLeft size={20} /></button><button type="button" disabled={currentPage >= totalPages - 1} onClick={() => changePage(1)} aria-label="Próximas simulações"><ChevronRight size={20} /></button></div></div>
        {filteredCards.length ? <div className="simulation-page-region" tabIndex={0} role="region" aria-label="Catálogo de simulações. Use as setas esquerda e direita para navegar." onKeyDown={event => { if (event.target === event.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); changePage(event.key === 'ArrowLeft' ? -1 : 1) } }}><div className="simulation-card-grid" key={`${category}-${currentPage}`} style={{ '--slide-direction': direction } as CSSProperties}>{filteredCards.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(item => {
          const theme = simulationTheme(item.category)
          return <article key={item.id} className="simulation-card" style={{ '--simulation-color': theme.color } as CSSProperties}><div className="simulation-card-image"><img src={simulationImage(item.title, item.category, item.channel)} alt="" width={600} height={360} loading="lazy" /><span className="simulation-difficulty" data-level={item.level}>{simulationLevels[item.level]}</span></div><div className="simulation-card-body"><div className="simulation-card-tags"><span className="simulation-category">{item.category}{item.channel ? ` · ${item.channel}` : ''}</span></div><h2>{item.title}</h2><p>{item.description}</p><div className="simulation-card-meta"><span>{item.minutes} min</span><span>{item.decisions} {item.decisions === 1 ? 'decisão' : 'decisões'}</span></div>{item.completed && <span className="simulation-completed">Concluída · {Math.round(item.correct / Math.max(1, item.total) * 100)}% de acertos</span>}<Link href={item.href} data-completed={item.completed}>{item.completed ? 'Rever resultado' : 'Iniciar simulação'}<span className="sr-only">: {item.title}</span></Link>{item.completed && <Link className="simulation-card-retry" href={`${item.href}?refazer=1`}>Refazer simulação<span className="sr-only">: {item.title}</span></Link>}</div></article>
        })}</div></div> : <ActivityEmpty>As simulações aparecerão aqui quando estiverem disponíveis.</ActivityEmpty>}
        <p className="simulation-footer-note">Fácil: situações do dia a dia. Médio: análise de acessos e configurações. Difícil: registros, incidentes e código.</p>
      </>}
    </section>
  </main>
}
