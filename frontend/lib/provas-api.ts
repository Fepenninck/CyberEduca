import { apiFetch } from './api'

export type ProvaResumo = {
  id: string
  titulo: string
  descricao: string
  trilha: { id: string; titulo: string; nivel: string }
  totalQuestoes: number
}

export type AlternativaProva = {
  id: string
  texto: string
  ordem: number
}

export type QuestaoProva = {
  id: string
  enunciado: string
  ordem: number
  alternativas: AlternativaProva[]
}

export type ProvaDetalhe = {
  id: string
  titulo: string
  descricao: string
  trilha: { id: string; titulo: string; nivel: string }
  totalQuestoes: number
  questoes: QuestaoProva[]
}

export type ResultadoTentativa = {
  tentativaId: string
  provaId: string
  nota: number
  totalQuestoes: number
  totalAcertos: number
  concluido: boolean
}

export type TentativaHistorico = ResultadoTentativa & {
  provaTitulo: string
  concluidoEm: string | null
}

async function lerErro(response: Response, padrao: string) {
  const resultado = await response.json().catch(() => ({}))
  const mensagem = resultado?.message
  return Array.isArray(mensagem) ? mensagem.join(' ') : mensagem || padrao
}

export async function listarProvas(trilhaId?: string): Promise<ProvaResumo[]> {
  const query = trilhaId ? `?trilhaId=${encodeURIComponent(trilhaId)}` : ''
  const response = await apiFetch(`/provas${query}`)
  if (!response.ok) throw new Error(await lerErro(response, 'Não foi possível carregar as avaliações.'))
  return response.json()
}

export async function buscarProva(provaId: string): Promise<ProvaDetalhe> {
  const response = await apiFetch(`/provas/${provaId}`)
  if (!response.ok) throw new Error(await lerErro(response, 'Não foi possível carregar esta avaliação.'))
  return response.json()
}

export async function enviarTentativa(
  provaId: string,
  respostas: Array<{ questaoId: string; alternativaId: string }>,
): Promise<ResultadoTentativa> {
  const response = await apiFetch(`/provas/${provaId}/tentativas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respostas }),
  })
  if (!response.ok) throw new Error(await lerErro(response, 'Não foi possível enviar suas respostas.'))
  return response.json()
}

export async function listarMinhasTentativas(): Promise<TentativaHistorico[]> {
  const response = await apiFetch('/avaliacoes/tentativas')
  if (!response.ok) throw new Error(await lerErro(response, 'Não foi possível carregar seu histórico.'))
  return response.json()
}



export type ProvaDisponivel = {
  id: string
  titulo: string
  descricao: string
  trilha: { id: string; titulo: string; nivel: string }
  _count: { questoes: number }
}

export type QuestaoDisponivel = {
  id: string
  enunciado: string
  tipo: 'MULTIPLA_ESCOLHA' | 'DISSERTATIVA'
  alternativas: Array<{ id: string; texto: string }>
}

export type ProvaDisponivelDetalhe = {
  id: string
  titulo: string
  descricao: string
  questoes: QuestaoDisponivel[]
}

export type ResultadoProva = {
  acertos: number
  totalQuestoes: number
  percentual: number
  criadoEm?: string
  titulo?: string
  jaConcluida?: boolean
  resultado: Array<{
    questaoId: string
    tipo: 'MULTIPLA_ESCOLHA' | 'DISSERTATIVA'
    correta: boolean
    avaliacaoManual: boolean
    respostaTexto: string | null
    alternativaEscolhidaId: string | null
    alternativaEscolhidaValida: boolean
    alternativaCorretaId: string | null
    textoCorreto: string | null
  }>
}

export type StatusProva = {
  concluida: boolean
  resultado: { acertos: number; totalQuestoes: number; criadoEm: string; titulo: string } | null
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options)
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined
    const errorMessage = Array.isArray(message)
      ? message.join(' ')
      : typeof message === 'string'
        ? message
        : 'Não foi possível carregar a avaliação.'
    throw new Error(errorMessage)
  }

  return body as T
}

export function listarProvasDisponiveis(): Promise<ProvaDisponivel[]> {
  return requestJson('/provas')
}

export function buscarProvaDisponivel(id: string): Promise<ProvaDisponivelDetalhe> {
  return requestJson(`/provas/${encodeURIComponent(id)}`)
}

export function enviarRespostasProva(
  id: string,
  respostas: Array<{ questaoId: string; alternativaId?: string; respostaTexto?: string }>,
): Promise<ResultadoProva> {
  return requestJson(`/provas/${encodeURIComponent(id)}/respostas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respostas }),
  })
}

export function verificarStatusProva(id: string): Promise<StatusProva> {
  return requestJson(`/provas/${encodeURIComponent(id)}/status`)
}

export function finalizarProva(
  id: string,
  dados: {
    acertos: number
    totalQuestoes: number
    respostas: Array<{ questaoId: string; alternativaId?: string; respostaTexto?: string }>
  },
): Promise<ResultadoProva> {
  return requestJson(`/provas/${encodeURIComponent(id)}/finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
}
