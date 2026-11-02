import { apiFetch } from '@/lib/api'

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
