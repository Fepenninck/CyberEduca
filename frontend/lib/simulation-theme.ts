export type SimulationLevel = 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
export const simulationLevels: Record<SimulationLevel, string> = { BASICO: 'Fácil', INTERMEDIARIO: 'Médio', AVANCADO: 'Difícil' }
export type SimulationTheme = { kind: string; color: string; image: string }
export function simulationTheme(category: string): SimulationTheme {
  const key = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (key.includes('phishing') || key.includes('mensage')) return { kind: 'message', color: '#43b9ed', image: 'email' }
  if (key.includes('conta') || key.includes('acesso')) return { kind: 'account', color: '#65c7e8', image: 'acesso-desconhecido' }
  if (key.includes('disposit')) return { kind: 'device', color: '#b3a0ed', image: 'instalar-apps' }
  if (key.includes('privac')) return { kind: 'privacy', color: '#72d5bd', image: 'pasta-privada' }
  if (key.includes('rede') || key.includes('conex')) return { kind: 'network', color: '#eac477', image: 'rede-equipe' }
  if (key.includes('incidente')) return { kind: 'incident', color: '#ed939f', image: 'triagem' }
  if (key.includes('codigo')) return { kind: 'code', color: '#8eaaff', image: 'codigo-autorizacao' }
  return { kind: 'general', color: '#8daecc', image: 'site' }
}
const scenarioImages: Record<string, string> = {
  'Um acesso que não foi você': 'acesso-desconhecido', 'A conta de quem mudou de equipe': 'permissoes-equipe',
  'Antes de instalar, decida': 'instalar-apps', 'Os arquivos pararam de abrir': 'arquivo-bloqueado',
  'Compartilhar sem expor': 'publicar-foto', 'Quem pode entrar nessa pasta?': 'pasta-privada',
  'Conectar fora de casa': 'wifi-publico', 'Visitantes na rede da equipe': 'rede-equipe',
  'Depois do clique, o que fazer?': 'depois-clique', 'Do alerta à contenção': 'triagem',
  'Um pedido, outro usuário': 'codigo-autorizacao', 'Entrada, consulta e registro': 'codigo-consulta',
}
export function simulationImage(title: string, category: string, channel?: string) {
  const channelImages: Record<string, string> = { 'E-mail': 'email', SMS: 'sms', Site: 'site', 'Rede social': 'social' }
  return `/images/simulacoes/${scenarioImages[title] ?? channelImages[channel ?? ''] ?? simulationTheme(category).image}.jpg`
}
