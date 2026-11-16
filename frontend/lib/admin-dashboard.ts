import type { AdminUsuario, ResultadoProvaAdmin, ResultadoSimulacaoAdmin } from './admin-api'

export const DASHBOARD_TIMEZONE = 'America/Sao_Paulo'
export function diaLocal(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-')
}
export function diasDoPeriodo(dias: number, agora = new Date()) {
  const hoje = diaLocal(agora)
  const referencia = new Date(`${hoje}T12:00:00Z`)
  return Array.from({ length: dias }, (_, index) => {
    const dia = new Date(referencia)
    dia.setUTCDate(dia.getUTCDate() - dias + index + 1)
    return dia.toISOString().slice(0, 10)
  })
}
export function filtrarPeriodo<T extends { criadoEm: string }>(registros: T[], dias: string[], agora = new Date()) {
  const permitidos = new Set(dias)
  return registros.filter(item => Number.isFinite(Date.parse(item.criadoEm)) && new Date(item.criadoEm) <= agora && permitidos.has(diaLocal(item.criadoEm)))
}
export function mediaNotas(resultados: { acertos: number; totalQuestoes: number }[]): number | null {
  const validos = resultados.filter(item => Number.isFinite(item.totalQuestoes) && Number.isFinite(item.acertos) && item.totalQuestoes > 0 && item.acertos >= 0 && item.acertos <= item.totalQuestoes)
  return validos.length ? validos.reduce((soma, item) => soma + item.acertos / item.totalQuestoes * 100, 0) / validos.length : null
}
export function resumirAtividades(provas: ResultadoProvaAdmin[], simulacoes: ResultadoSimulacaoAdmin[], usuarios: AdminUsuario[], dias: string[], aulas: {criadoEm: string}[] = [], acessos: {criadoEm: string}[] = []) {
  const serie = dias.map(dia => ({ dia, nome: dia.slice(8) + '/' + dia.slice(5, 7), provas: 0, simulacoes: 0, cadastros: 0, aulas: 0, acessos: 0 }))
  const porDia = new Map(serie.map(item => [item.dia, item]))
  for (const [chave, registros] of [['provas', provas], ['simulacoes', simulacoes], ['cadastros', usuarios], ['aulas', aulas], ['acessos', acessos]] as const) {
    for (const registro of registros) {
      if (!Number.isFinite(Date.parse(registro.criadoEm))) continue
      const dia = porDia.get(diaLocal(registro.criadoEm))
      if (dia) dia[chave] += 1
    }
  }
  return serie
}

export function taxaAprovacao(resultados: { aprovado?: boolean | null }[]): number | null {
  const definidos = resultados.filter(item => typeof item.aprovado === 'boolean');
  return definidos.length ? definidos.filter(item => item.aprovado).length / definidos.length * 100 : null;
}
export type FiltroResultadosDashboard = { dias: number; ate: string };
export function lerFiltroResultadosDashboard(query: string): FiltroResultadosDashboard | null {
  const params = new URLSearchParams(query);
  const dias = Number(params.get('dias'));
  const ate = params.get('ate');
  if (![7, 30, 90].includes(dias) || !ate || !Number.isFinite(Date.parse(ate))) return null;
  return { dias, ate };
}
export function linkResultadosDashboard(tom: TomDashboard, dias: number, agora: Date | null) {
  if (!agora) return '/admin/resultados#provas';
  return `/admin/resultados?${new URLSearchParams({ faixa: tom, dias: String(dias), ate: agora.toISOString() })}#provas`;
}

export type TomDashboard = 'success' | 'warning' | 'danger' | 'neutral'
export function situacaoNota(nota: number | null): { tom: TomDashboard; texto: string } {
  if (nota === null || !Number.isFinite(nota)) return { tom: 'neutral', texto: 'Sem nota' }
  if (nota < 40) return { tom: 'danger', texto: 'Reforço necessário' }
  if (nota < 70) return { tom: 'warning', texto: 'Atenção' }
  return { tom: 'success', texto: 'Bom desempenho' }
}
export function contarAlunosAtivos(usuarios: AdminUsuario[], resultados: { usuario: { id: string } }[]): number {
  const alunos = new Set(usuarios.filter(item => item.papel === 'USUARIO' || item.papel === 'ALUNO').map(item => item.id))
  return new Set(resultados.filter(item => alunos.has(item.usuario.id)).map(item => item.usuario.id)).size
}
