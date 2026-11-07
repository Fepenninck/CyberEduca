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
