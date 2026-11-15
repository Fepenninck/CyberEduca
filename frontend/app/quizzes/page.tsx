'use client'

import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { ActivityError, ActivityLoading } from '@/components/activities/activity-state'
import { useActivity } from '@/components/activities/use-activity'
import { QuizCard } from '@/components/quizzes/quiz-card'
import { listarQuizzes, type QuizResumo } from '@/lib/quizzes-api'
import '@/components/activities/activities.css'
import './quizzes.css'

const PAGE_SIZE = 6
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
type Topic = { id: string; title: string; quizzes: QuizResumo[] }

function topicImage(title: string) {
  const text = normalize(title)
  const images: Array<[RegExp, string]> = [
    [/backup|copia|recupera|arquivo/, 'copias'],
    [/senha|conta|autentica|passkey/, 'contas'],
    [/privacidade|compartilh|dados|coleta/, 'privacidade'],
    [/rede|wifi|wi-fi|dns|tls|conexao/, 'redes'],
    [/celular|computador|dispositivo|atualiza/, 'dispositivos'],
    [/malware|ransomware|infecc|anexo/, 'malware'],
    [/acesso|permiss|privilegio/, 'acesso'],
    [/configura|ambiente|segredo/, 'configuracao'],
    [/codigo|injec|xss|software|api|projeto/, 'codigo'],
    [/analise|registro|linha do tempo|triagem|alerta/, 'analise'],
    [/remoto|trabalho/, 'remoto'],
  ]
  return `/images/trilhas/${images.find(([pattern]) => pattern.test(text))?.[1] ?? 'intermediario'}.jpg`
}

export default function QuizzesPage() {
  const [search, setSearch] = useState('')
  const [lesson, setLesson] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const loader = useCallback((signal: AbortSignal) => listarQuizzes(new URLSearchParams(window.location.search).get('aulaId') || undefined, signal), [])
  const { data, error, loading, retry } = useActivity(loader)
  const topics = new Map<string, Topic>()
  for (const quiz of data ?? []) {
    const topic = topics.get(quiz.aulaId)
    if (topic) topic.quizzes.push(quiz)
    else topics.set(quiz.aulaId, { id: quiz.aulaId, title: quiz.aula.titulo, quizzes: [quiz] })
  }
  const all = [...topics.values()]
  const filtered = all.map(topic => ({ ...topic, quizzes: topic.quizzes.filter(quiz => (!status || (status === 'done' ? Boolean(quiz.tentativas?.length) : !quiz.tentativas?.length)) && (!search.trim() || normalize(`${topic.title} ${quiz.titulo} ${quiz.descricao}`).includes(normalize(search.trim())))) })).filter(topic => topic.quizzes.length && (!lesson || topic.id === lesson))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const current = visible.find(topic => topic.id === selected) ?? visible[0]
  const completed = (data ?? []).filter(quiz => quiz.tentativas?.length).length
  const progress = data?.length ? Math.round(completed / data.length * 100) : 0
  const filteredCount = filtered.reduce((sum, topic) => sum + topic.quizzes.length, 0)
  function changePage(next: number) { setPage(next); setSelected(null) }
  function choose(topic: Topic) {
    setSelected(topic.id)
    if (window.matchMedia('(max-width: 800px)').matches) requestAnimationFrame(() => { detailHeading.current?.focus({ preventScroll: true }); document.getElementById('arena-mission-detail')?.scrollIntoView({ block: 'start' }) })
  }

  return <main className="app-shell dashboard-page quizzes-page arena-page">
    <DashboardNavigation active="quizzes" />
    <div className="arena-wrap">
      <header className="arena-hero"><div><span className="arena-eyebrow">Seu espaço de desafios</span><h1>Arena de Conhecimento</h1><p>Explore as missões, teste suas decisões e fortaleça sua segurança digital. Cada resposta é uma oportunidade de aprender.</p></div></header>
      {loading ? <ActivityLoading /> : error ? <ActivityError error={error} retry={retry} /> : <>
        <form className="arena-filters" role="search" aria-label="Pesquisar quizzes" onSubmit={event => event.preventDefault()}>
          <label className="arena-search"><span className="sr-only">Pesquisar assunto ou quiz</span><Search size={17} aria-hidden="true" /><input type="search" value={search} onChange={event => { setSearch(event.target.value); changePage(0) }} placeholder="Qual assunto você quer explorar?" /></label>
          <span className="arena-filter-prompt">O que você quer praticar?</span>
          {[{ value: lesson, label: 'Filtrar por aula', options: [{ value: '', label: 'Todas as aulas' }, ...all.map(topic => ({ value: topic.id, label: topic.title }))], change: setLesson }, { value: status, label: 'Filtrar por status', options: [{ value: '', label: 'Todos os desafios' }, { value: 'todo', label: 'Não concluídos' }, { value: 'done', label: 'Concluídos' }], change: setStatus }].map(filter => <details className="arena-filter-dropdown" key={filter.label} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false }}><summary aria-label={filter.label}><span>{filter.options.find(option => option.value === filter.value)?.label}</span><ChevronDown size={16} aria-hidden="true" /></summary><div className="arena-filter-options">{filter.options.map(option => <button type="button" key={option.value} aria-pressed={option.value === filter.value} onClick={event => { filter.change(option.value); changePage(0); const dropdown = event.currentTarget.closest('details'); if (dropdown) { dropdown.open = false; dropdown.querySelector('summary')?.focus() } }}>{option.label}</button>)}</div></details>)}
        </form>
        <div className="arena-section-heading"><div><span className="arena-eyebrow">Escolha onde praticar</span><h2>Explore os desafios</h2><p aria-live="polite">{filtered.length} assuntos · {filteredCount} quizzes</p></div>{Boolean(data?.length) && <div className="arena-journey"><div><span><strong>{completed} de {data!.length}</strong> quizzes concluídos</span><progress value={completed} max={data!.length} aria-label="Quizzes concluídos" /></div><small>{progress}%</small></div>}</div>
        {!filtered.length ? <div className="activity-state" role="status"><h2>Nenhuma atividade disponível</h2></div> : <div className="arena-layout">
          <div className="arena-topics-column"><div className="arena-topics">{visible.map((topic, index) => {
            const done = topic.quizzes.filter(quiz => quiz.tentativas?.length).length
            const percentage = Math.round(done / topic.quizzes.length * 100)
            const questionCount = topic.quizzes.reduce((sum, quiz) => sum + quiz._count.questoes, 0)
            return <button type="button" className={`arena-mission${selected === topic.id ? ' is-selected' : ''}${done === topic.quizzes.length ? ' is-complete' : ''}`} style={{ '--mission-color': '#b2ff00' } as CSSProperties} key={topic.id} aria-pressed={current?.id === topic.id} aria-controls="arena-mission-detail" onClick={() => choose(topic)}>
              <span className="arena-mission-image"><img src={topicImage(topic.title)} alt="" loading="lazy" /><span className="arena-mission-number">MISSÃO {String(currentPage * PAGE_SIZE + index + 1).padStart(2, '0')}</span></span>
              <span className="arena-mission-body"><span className="arena-mission-meta"><span>{topic.quizzes.length} {topic.quizzes.length === 1 ? 'quiz' : 'quizzes'} · {questionCount} {questionCount === 1 ? 'questão' : 'questões'}</span>{done === topic.quizzes.length && <span className="arena-complete">Concluída</span>}</span><strong>{topic.title}</strong><span className="arena-mission-progress"><span style={{ width: `${percentage}%` }} /></span><span className="arena-mission-bottom"><span>{done}/{topic.quizzes.length} concluídos</span><span>{selected === topic.id ? 'Selecionada' : 'Explorar'}</span></span></span>
            </button>
          })}</div>
            <nav className="arena-pagination" aria-label="Paginação dos assuntos"><button type="button" disabled={!currentPage} onClick={() => changePage(0)} aria-label="Ir para o começo"><ChevronsLeft size={18} /></button><button type="button" disabled={!currentPage} onClick={() => changePage(currentPage - 1)} aria-label="Assuntos anteriores"><ChevronLeft size={18} /></button><span>Setor {currentPage + 1} de {totalPages}</span><button type="button" disabled={currentPage === totalPages - 1} onClick={() => changePage(currentPage + 1)} aria-label="Próximos assuntos"><ChevronRight size={18} /></button><button type="button" disabled={currentPage === totalPages - 1} onClick={() => changePage(totalPages - 1)} aria-label="Ir para o final"><ChevronsRight size={18} /></button></nav>
            <p className="arena-topics-note">Explore na sua ordem. Todas as missões estão disponíveis.</p>
          </div>
          {current && <section className="arena-detail" id="arena-mission-detail" aria-labelledby="arena-detail-heading"><div className="arena-detail-image"><img src={topicImage(current.title)} alt="" /><span>Missão selecionada</span></div><div className="arena-detail-content"><span className="arena-eyebrow">Da aula para a prática</span><h2 id="arena-detail-heading" ref={detailHeading} tabIndex={-1}>{current.title}</h2><p>Escolha um desafio para responder ou revisite o que você já concluiu.</p><div className="arena-detail-progress"><span>{current.quizzes.filter(quiz => quiz.tentativas?.length).length} de {current.quizzes.length} quizzes concluídos</span><small>{current.quizzes.length} {current.quizzes.length === 1 ? 'quiz nesta missão' : 'quizzes nesta missão'}</small></div><div className="arena-challenges">{current.quizzes.map(quiz => <div className={`arena-challenge${quiz.tentativas?.length ? ' is-done' : ''}`} key={quiz.id}><QuizCard quiz={quiz} /></div>)}</div></div></section>}
        </div>}
      </>}
    </div>
  </main>
}
