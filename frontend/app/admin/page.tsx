'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buscarResumoDashboard, listarUsuarios, listarProvasAdmin, listarSimulacoes, listarResultadosProvas, listarResultadosSimulacoes, type ResumoDashboard, type AdminUsuario, type ProvaAdmin, type SimulacaoAdmin, type ResultadoProvaAdmin, type ResultadoSimulacaoAdmin } from '@/lib/admin-api'
import { DASHBOARD_TIMEZONE, diasDoPeriodo, filtrarPeriodo, mediaNotas, resumirAtividades, situacaoNota, contarAlunosAtivos, taxaAprovacao, linkResultadosDashboard, type TomDashboard } from '@/lib/admin-dashboard'
import './dashboard-admin.css'

type Dados = { resumo: ResumoDashboard; usuarios: AdminUsuario[]; provas: ProvaAdmin[]; simulacoes: SimulacaoAdmin[]; resultadosProvas: ResultadoProvaAdmin[]; resultadosSimulacoes: ResultadoSimulacaoAdmin[] }
const fontes = { resumo: 'indicadores gerais', usuarios: 'cadastros', provas: 'provas', simulacoes: 'simulações', resultadosProvas: 'resultados de provas', resultadosSimulacoes: 'resultados de simulações' }
const numero = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('pt-BR')
const percentual = (value: number | null) => value === null ? '—' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
function Painel({ titulo, detalhe, children, className = '' }: { titulo: string; detalhe?: string; children: ReactNode; className?: string }) {
  return <article className={`edu-panel ${className}`}><div className="edu-panel-heading"><h3>{titulo}</h3>{detalhe && <p>{detalhe}</p>}</div>{children}</article>
}
function Vazio({ children, tom = 'warning' }: { children: ReactNode; tom?: TomDashboard }) { return <p className="edu-empty" data-tone={tom}>{children}</p> }
function Situacao({ tom, children }: { tom: TomDashboard; children: ReactNode }) { return <span className="edu-status" data-tone={tom}>{children}</span> }

export default function AdminDashboardPage() {
  const [dados, setDados] = useState<Partial<Dados>>({})
  const [erros, setErros] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tentativa, setTentativa] = useState(0)
  const [periodo, setPeriodo] = useState(30)
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    let ativo = true
    setCarregando(true); setDados({}); setErros([])
    async function carregar<K extends keyof Dados>(chave: K, buscar: () => Promise<Dados[K]>) {
      try { const value = await buscar(); if (chave === 'resumo' ? !value || !['totalUsuarios', 'totalTrilhas', 'totalAulas'].every(key => typeof (value as unknown as Record<string, unknown>)[key] === 'number') : !Array.isArray(value)) throw new Error('Resposta invalida'); if (ativo) setDados(atual => ({ ...atual, [chave]: value })) }
      catch { if (ativo) setErros(atual => [...atual, fontes[chave]]) }
    }
    void Promise.allSettled([
      carregar('resumo', buscarResumoDashboard), carregar('usuarios', listarUsuarios),
      carregar('provas', listarProvasAdmin), carregar('simulacoes', listarSimulacoes),
      carregar('resultadosProvas', listarResultadosProvas), carregar('resultadosSimulacoes', listarResultadosSimulacoes),
    ]).then(() => { if (ativo) { setAgora(new Date()); setCarregando(false) } })
    return () => { ativo = false }
  }, [tentativa])
  const analise = useMemo(() => {
    if (!agora) return null
    const dias = diasDoPeriodo(periodo, agora)
    const provas = filtrarPeriodo(dados.resultadosProvas ?? [], dias, agora)
    const simulacoes = filtrarPeriodo(dados.resultadosSimulacoes ?? [], dias, agora)
    const usuarios = filtrarPeriodo(dados.usuarios ?? [], dias, agora)
    const aulas = filtrarPeriodo(dados.resumo?.aulasConcluidas ?? [], dias, agora)
    const acessos = filtrarPeriodo(dados.resumo?.acessos ?? [], dias, agora)
    const concluidas = filtrarPeriodo(dados.resumo?.conclusoesTrilhas ?? [], dias, agora)
    const dificuldades = new Map<string, { titulo: string; notas: ResultadoProvaAdmin[] }>()
    provas.forEach(item => { const grupo = dificuldades.get(item.prova.id) ?? { titulo: item.prova.titulo, notas: [] }; grupo.notas.push(item); dificuldades.set(item.prova.id, grupo) })
    const recentes = [
      ...concluidas.map(item => ({ id: `trilha-${item.usuarioId}-${item.trilhaId}`, data: item.criadoEm, nome: item.nome, tipo: 'Trilha concluída', descricao: item.titulo, href: `/admin/historico?usuarioId=${encodeURIComponent(item.usuarioId)}`, nota: null })),
      ...usuarios.map(item => ({ id: `usuario-${item.id}`, data: item.criadoEm, nome: item.nome, tipo: 'Cadastro', descricao: 'Criou uma conta na plataforma', href: `/admin/usuarios/${encodeURIComponent(item.id)}/editar`, nota: null })),
      ...provas.map(item => ({ id: `prova-${item.id}`, data: item.criadoEm, nome: item.usuario.nome, tipo: 'Prova', descricao: item.prova.titulo, href: '/admin/resultados#provas', nota: mediaNotas([item]) })),
      ...simulacoes.map(item => ({ id: `simulacao-${item.id}`, data: item.criadoEm, nome: item.usuario.nome, tipo: 'Simulação', descricao: item.simulacao.titulo, href: '/admin/resultados#simulacoes', nota: mediaNotas([item]) })),
    ].sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 7)
    return { provas, simulacoes, usuarios, aulas, acessos, recentes, serie: resumirAtividades(provas, simulacoes, usuarios, dias, aulas, acessos), dificuldades: [...dificuldades.values()].map(item => ({ ...item, media: mediaNotas(item.notas) })).filter(item => item.media !== null).sort((a, b) => a.media! - b.media!).slice(0, 5) }
  }, [dados, periodo, agora])
  const provasDisponiveis = dados.resultadosProvas !== undefined
  const simulacoesDisponiveis = dados.resultadosSimulacoes !== undefined
  const resultadosDisponiveis = provasDisponiveis && simulacoesDisponiveis
  const media = provasDisponiveis && !carregando ? mediaNotas(analise?.provas ?? []) : null
  const situacaoMedia = situacaoNota(media)
  const alunosAtivos = !carregando && dados.usuarios && resultadosDisponiveis && analise ? contarAlunosAtivos(dados.usuarios, [...analise.provas, ...analise.simulacoes, ...analise.aulas.map(item => ({usuario: {id: item.usuarioId}})), ...analise.acessos.map(item => ({usuario: {id: item.usuarioId}}))]) : undefined
  const cards = [
    { titulo: 'Total de usuários', valor: dados.resumo?.totalUsuarios, detalhe: 'Contas cadastradas' },
    { titulo: 'Alunos ativos', valor: alunosAtivos, detalhe: 'Com acesso ou atividade no período' },
    { titulo: 'Trilhas', valor: dados.resumo?.totalTrilhas, detalhe: 'Trilhas cadastradas' },
    { titulo: 'Aulas', valor: dados.resumo?.totalAulas, detalhe: 'Aulas cadastradas' },
    { titulo: 'Simulações', valor: dados.simulacoes?.length, detalhe: 'Simulações cadastradas' },
    { titulo: 'Provas', valor: dados.provas?.length, detalhe: 'Inclui todos os status' },
    { titulo: 'Taxa de conclusão', valor: dados.resumo?.taxaConclusao ?? undefined, detalhe: 'Trilhas concluídas entre as iniciadas' },
  ]
  return <section className="edu-dashboard" aria-busy={carregando}>
    <div className="edu-heading"><div><p className="edu-eyebrow">Visão geral</p><h2>Dashboard</h2><p className="edu-description">Acompanhe o aprendizado e a atividade na plataforma CyberEduca+.</p></div><button className="edu-button" onClick={() => setTentativa(value => value + 1)} disabled={carregando}>{carregando ? 'Atualizando...' : 'Atualizar dados'}</button></div>
    {erros.length > 0 && <div role="alert" className="edu-alert">Não foi possível carregar: {erros.join(', ')}. Os demais dados continuam disponíveis. <button onClick={() => setTentativa(value => value + 1)} disabled={carregando}>Tentar novamente</button></div>}
    {carregando && <p role="status" className="edu-loading">Carregando os dados da plataforma...</p>}
    <div className="edu-metrics" aria-label="Indicadores da plataforma">{cards.map(card => {
      const falhou = !carregando && card.valor === undefined && !(card.titulo === 'Taxa de conclusão' && dados.resumo?.taxaConclusao === null)
      const tom: TomDashboard = carregando ? 'neutral' : card.valor !== undefined ? 'success' : falhou ? 'danger' : 'warning'
      return <article key={card.titulo} className="edu-metric"><p>{card.titulo}</p><strong>{carregando ? '…' : card.titulo === 'Taxa de conclusão' ? percentual(card.valor ?? null) : numero(card.valor)}</strong><small>{!carregando && card.valor === undefined ? <span data-tone={tom}>{falhou ? 'Falha na consulta' : 'Nenhuma trilha iniciada'}</span> : card.detalhe}</small></article>
    })}</div>
    <div className="edu-period-bar"><div><strong>Acompanhamento educacional</strong><p>Resultados de provas no período selecionado.</p></div><label>Período<select value={periodo} onChange={event => setPeriodo(Number(event.target.value))}><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select></label></div>
    <div className="edu-health-summary" aria-label="Situação dos resultados de provas">
      {([
        { tom: 'warning', titulo: 'Precisam de atenção', faixa: 'De 40% a menos de 70%' },
        { tom: 'success', titulo: 'Bom desempenho', faixa: 'A partir de 70% de acertos' },
        { tom: 'danger', titulo: 'Precisam de reforço', faixa: 'Abaixo de 40% de acertos' },
      ] as const).map(item => <Link href={linkResultadosDashboard(item.tom, periodo, agora)} className="edu-health-card" data-tone={item.tom} key={item.tom}>
        <span><strong>{carregando ? '…' : !provasDisponiveis || !analise ? '—' : numero(analise.provas.filter(prova => { const nota = mediaNotas([prova]); return nota !== null && situacaoNota(nota).tom === item.tom }).length)}</strong><span>{item.titulo}</span><small>{!carregando && !provasDisponiveis ? 'Resultados indisponíveis' : item.faixa}</small></span>
        <span className="edu-health-action" aria-hidden="true">↗</span>
      </Link>)}
    </div>
    <div className="edu-grid edu-grid-main">
      <Painel titulo="Evolução dos alunos" detalhe="Logins de alunos, aulas concluídas, provas, simulações e novos cadastros.">
        {!analise || carregando ? <Vazio tom="neutral">Carregando histórico...</Vazio> : !provasDisponiveis && !simulacoesDisponiveis && dados.usuarios === undefined && !dados.resumo ? <Vazio tom="danger">Não foi possível carregar o histórico. Tente atualizar os dados.</Vazio> : analise.provas.length + analise.simulacoes.length + analise.usuarios.length + analise.aulas.length + analise.acessos.length === 0 ? <Vazio tom="neutral">Nenhuma atividade registrada nas fontes disponíveis neste período.</Vazio> : <><div className="edu-chart" role="img" aria-label={`Atividades diárias: ${analise.acessos.length} logins, ${analise.aulas.length} aulas concluídas, ${analise.provas.length} provas, ${analise.simulacoes.length} simulações e ${analise.usuarios.length} cadastros nas fontes disponíveis.`}><ResponsiveContainer width="100%" height="100%"><LineChart data={analise.serie} margin={{ top: 12, right: 14, left: -18, bottom: 4 }}><CartesianGrid stroke="#e7ebf0" vertical={false} /><XAxis dataKey="nome" tick={{ fill: '#626c79', fontSize: 11 }} minTickGap={34} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#626c79', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#fff', border: '1px solid #dce1e8', color: '#242a33', fontSize: 12 }} />{dados.resumo && <Line name="Aulas concluídas" dataKey="aulas" stroke="#25804d" strokeWidth={2} dot={false} />}{dados.resumo && <Line name="Acessos (login)" dataKey="acessos" stroke="#9a721c" strokeWidth={2} dot={false} />}{provasDisponiveis && <Line name="Provas" dataKey="provas" stroke="#1768bd" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />}{simulacoesDisponiveis && <Line name="Simulações" dataKey="simulacoes" stroke="#536174" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />}{dados.usuarios !== undefined && <Line name="Cadastros" dataKey="cadastros" stroke="#8794a5" strokeWidth={2} strokeDasharray="4 3" dot={false} />}</LineChart></ResponsiveContainer></div><div className="edu-legend">{dados.resumo && <><span data-series="aulas"><i />Aulas concluídas</span><span data-series="acessos"><i />Acessos (login)</span></>}{provasDisponiveis && <span data-series="provas"><i />Provas</span>}{simulacoesDisponiveis && <span data-series="simulacoes"><i />Simulações</span>}{dados.usuarios !== undefined && <span data-series="cadastros"><i />Cadastros</span>}</div></>}
        <p className="edu-note">Acessos representam logins bem-sucedidos de alunos. Aulas representam conclusões salvas no progresso atual. Datas no horário de Brasília.</p>
      </Painel>
      <Painel titulo="Desempenho educacional" detalhe="Notas calculadas pelo percentual de acertos em cada resultado de prova.">
        <div className="edu-performance"><div data-tone={situacaoMedia.tom}><span>Média de notas</span><strong>{percentual(media)}</strong><Situacao tom={situacaoMedia.tom}>{carregando ? 'Carregando' : situacaoMedia.texto}</Situacao><small>{provasDisponiveis && analise ? `${numero(analise.provas.length)} resultados de provas no período` : 'Resultados indisponíveis'}</small></div><div data-tone={situacaoNota(taxaAprovacao(analise?.provas ?? [])).tom}><span>Taxa de aprovação</span><strong>{carregando ? "…" : percentual(taxaAprovacao(analise?.provas ?? []))}</strong><small>{carregando ? "Carregando resultados..." : !provasDisponiveis ? "Resultados indisponíveis." : (analise?.provas ?? []).some(item => typeof item.aprovado === "boolean") ? "Provas de certificação no período. Aprovação: nota mínima 6/10." : "Sem provas de certificação concluídas neste período."}</small></div></div>
        <h4 className="edu-subtitle">Avaliações com maior dificuldade</h4>
        {carregando ? <Vazio tom="neutral">Carregando resultados...</Vazio> : !provasDisponiveis ? <Vazio tom="danger">Resultados de provas indisponíveis.</Vazio> : !analise?.dificuldades.length ? <Vazio tom="neutral">Ainda não há notas válidas para comparar neste período.</Vazio> : <ol className="edu-difficulties">{analise.dificuldades.map(item => <li key={item.notas[0].prova.id} data-tone={situacaoNota(item.media).tom}><div><span>{item.titulo}</span><strong>{percentual(item.media)}</strong></div><meter min={0} max={100} value={item.media ?? 0} aria-label={`Média em ${item.titulo}`} /><small>{situacaoNota(item.media).texto} - {item.notas.length} resultado(s)</small></li>)}</ol>}
        <p className="edu-note">Faixas visuais: abaixo de 40% requer reforço; de 40% a menos de 70% pede atenção; a partir de 70% indica bom desempenho. Essas faixas não definem aprovação.</p>
      </Painel>
    </div>
    <div className="edu-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
      <Painel titulo="Atividades recentes" detalhe="Últimos cadastros e resultados registrados no período selecionado.">{carregando ? <Vazio tom="neutral">Carregando atividades...</Vazio> : !analise?.recentes.length ? <Vazio>{erros.length ? 'Nenhuma atividade disponível nas fontes carregadas.' : 'Nenhum cadastro ou resultado registrado neste período.'}</Vazio> : <ul className="edu-feed">{analise.recentes.map(item => <li key={item.id}><span className="edu-event-type" data-tone={(item.tipo === 'Cadastro' || item.tipo === 'Trilha concluída') ? 'success' : situacaoNota(item.nota).tom}>{item.tipo}</span><div><Link href={item.href}>{item.nome}</Link><p>{item.descricao}</p>{item.nota !== null && <Situacao tom={situacaoNota(item.nota).tom}>{percentual(item.nota)} - {situacaoNota(item.nota).texto}</Situacao>}</div><time dateTime={item.data}>{new Intl.DateTimeFormat('pt-BR', { timeZone: DASHBOARD_TIMEZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(item.data))}</time></li>)}</ul>}<p className="edu-note">Inclui trilhas com todas as aulas atuais concluídas pelo aluno.</p></Painel>
    </div>
    <div className="edu-grid edu-grid-availability">
      <div className="edu-progress-column">
      <Painel titulo="Progresso das trilhas" detalhe="Participações de alunos por trilha, considerando as aulas concluídas.">
        {carregando ? <Vazio tom="neutral">Carregando progresso...</Vazio> : !dados.resumo?.progressoTrilhas ? <Vazio tom="danger">Não foi possível carregar o progresso. Atualize os dados e verifique se a API está atualizada.</Vazio> : <><dl className="edu-progress">{[
          { label: 'Iniciadas', valor: dados.resumo.progressoTrilhas.iniciadas },
          { label: 'Em andamento', valor: dados.resumo.progressoTrilhas.emAndamento },
          { label: 'Concluídas', valor: dados.resumo.progressoTrilhas.concluidas },
        ].map(item => <div key={item.label}><dt>{item.label}</dt><dd>{numero(item.valor)}</dd></div>)}</dl><p className="edu-note">Iniciada: ao menos uma aula concluída. Concluída: todas as aulas atuais da trilha concluídas. Cada aluno conta uma vez por trilha. Totais de todo o histórico; não incluem administradores.</p></>}
      </Painel>
        {!carregando && agora && <p className="edu-updated">Atualizado em {new Intl.DateTimeFormat('pt-BR', { timeZone: DASHBOARD_TIMEZONE, dateStyle: 'short', timeStyle: 'short' }).format(agora)} · Totais consideram todos os registros. {resultadosDisponiveis ? 'Histórico de provas e simulações carregado.' : 'Algumas fontes do histórico estão indisponíveis.'}</p>}
      </div>
      <Painel titulo="Trilhas mais populares" detalhe="Ranking por alunos com aulas concluídas, com desempate por conclusões da trilha.">
        {carregando ? <Vazio tom="neutral">Carregando ranking...</Vazio> : !dados.resumo?.trilhasPopulares ? <Vazio tom="danger">Não foi possível carregar o ranking. Atualize os dados e verifique se a API está atualizada.</Vazio> : !dados.resumo.trilhasPopulares.length ? <Vazio tom="neutral">Ainda não há aulas concluídas por alunos para montar o ranking.</Vazio> : <ol className="edu-difficulties">{dados.resumo.trilhasPopulares.map((item, index) => <li key={item.id}><div><span>{index + 1}. {item.titulo}</span><strong>{numero(item.iniciadas)} aluno(s)</strong></div><small>{numero(item.concluidas)} conclusão(ões) da trilha</small></li>)}</ol>}
        <p className="edu-note">Baseado no progresso salvo. Visualizações de páginas não são registradas. Todo o histórico.</p><Link className="edu-text-link" href="/admin/trilhas">Gerenciar trilhas</Link>
      </Painel>
    </div>
  </section>
}
