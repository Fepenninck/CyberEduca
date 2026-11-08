import { apiFetch } from '@/lib/api'

export type SimulacaoDisponivel = {
  id: string
  titulo: string
  descricao: string
  criadoEm: string
  _count: { questoes: number }
}

export type CategoriaSimulacaoDisponivel = {
  id: string
  nome: string
  descricao: string
  criadoEm?: string
  simulacoes: Array<Pick<SimulacaoDisponivel, 'id' | 'titulo' | 'descricao' | 'criadoEm'>>
}

export type QuestaoTreino = {
  id: string
  enunciado: string
  alternativas: Array<{ id: string; texto: string }>
}

export type SimulacaoTreino = {
  id: string
  titulo: string
  descricao: string
  questoes: QuestaoTreino[]
}

export type ResultadoTreino = {
  acertos: number
  totalQuestoes: number
  criadoEm?: string
  titulo?: string
  jaConcluida?: boolean
  respostas: Array<{
    questaoId: string
    alternativaEscolhidaId: string | null
    correta: boolean
    alternativaCorretaId: string | null
    textoCorreto: string | null
  }>
}

export type CorrecaoTreino = Pick<ResultadoTreino, 'respostas'>

export type StatusSimulacao = {
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
        : 'Não foi possível carregar a simulação.'
    throw new Error(errorMessage)
  }

  return body as T
}

export function listarSimulacoesDisponiveis(): Promise<SimulacaoDisponivel[]> {
  return requestJson('/simulacoes')
}

export function listarCategoriasSimulacao(): Promise<CategoriaSimulacaoDisponivel[]> {
  return requestJson('/simulacoes/categorias')
}

export function buscarCategoriaSimulacao(id: string): Promise<CategoriaSimulacaoDisponivel> {
  return requestJson(`/simulacoes/categorias/${encodeURIComponent(id)}`)
}

export function buscarSimulacao(id: string): Promise<SimulacaoTreino> {
  return requestJson(`/simulacoes/${encodeURIComponent(id)}`)
}

export function responderSimulacao(
  id: string,
  respostas: Array<{ questaoId: string; alternativaId: string }>,
): Promise<CorrecaoTreino> {
  return requestJson(`/simulacoes/${encodeURIComponent(id)}/respostas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respostas }),
  })
}

export function verificarStatusSimulacao(id: string): Promise<StatusSimulacao> {
  return requestJson(`/simulacoes/${encodeURIComponent(id)}/status`)
}

export function finalizarSimulacao(
  id: string,
  dados: {
    acertos: number
    totalQuestoes: number
    respostas: Array<{ questaoId: string; alternativaId: string }>
  },
): Promise<ResultadoTreino> {
  return requestJson(`/simulacoes/${encodeURIComponent(id)}/finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
}
