import { beginLoading } from './loading-state'
import { markBackendReady, waitForBackend } from './backend-ready'
import { fetchWithTimeout } from './fetch-with-timeout'
import { createInflightRequests } from './inflight-requests'
export const API_URL = '/api'
const inflightReads = createInflightRequests()

export const apiFetch = (path: string, options?: RequestInit): Promise<Response> => {
  const method = (options?.method ?? 'GET').toUpperCase()
  // Share only plain browser reads; custom request options retain their semantics.
  if (typeof window !== 'undefined' && method === 'GET' && Object.keys(options ?? {}).every(key => ['method', 'cache', 'signal'].includes(key))) {
    const { signal, ...sharedOptions } = options ?? {}
    return inflightReads.read(`${path}:${options?.cache ?? 'default'}`, () => performApiFetch(path, sharedOptions), signal)
  }
  if (method === 'GET' || method === 'HEAD') return performApiFetch(path, options)
  inflightReads.clear()
  return performApiFetch(path, options).finally(() => inflightReads.clear())
}

const performApiFetch = async (path: string, options?: RequestInit) => {
  const method = (options?.method ?? 'GET').toUpperCase()
  // Consultas e atualizações ao voltar à janela não devem bloquear toda a interface.
  const end = method === 'GET' || method === 'HEAD' ? () => {} : beginLoading(path === '/auth/login' ? 'Entrando na sua conta…' : 'Carregando…')
  try {
  if (path === '/auth/login' || path === '/auth/register') await waitForBackend()
  const request = () => fetchWithTimeout(`${API_URL}${path}`, { ...options, credentials: 'include' })
  let response = await request()
  if (response.headers.get('content-type')?.includes('text/html')) {
    if ((options?.method ?? 'GET').toUpperCase() === 'GET' && !options?.signal?.aborted) {
      await waitForBackend()
      if (options?.signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
      response = await request()
    }
    if (response.headers.get('content-type')?.includes('text/html')) return Response.json({ message: 'O servidor está iniciando. Tente novamente em instantes.' }, { status: 503 })
  }
  if (response.status < 500 && response.headers.get('content-type')?.includes('application/json')) markBackendReady()
  if (response.ok && method !== 'GET' && method !== 'HEAD') inflightReads.clear()
  if (response.ok && options?.method?.toUpperCase() === 'POST' && /^\/aulas\/[^/]+\/concluir$/.test(path) && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('learning-progress-updated'))
  }
  if (response.ok && ((path === '/auth/logout' || path === '/auth/login' || path === '/auth/login/confirmar') && options?.method?.toUpperCase() === 'POST' || path === '/usuarios/me' && options?.method?.toUpperCase() === 'DELETE')) clearCurrentUser()
  return response
  } finally { end() }
}

export type UserProfile = {
  id: string
  nome: string
  email: string
  foto?: string | null
  avatar?: string | null
  papel: string
  temSenha?: boolean
}

let currentUser: UserProfile | null = null
let currentUserRequest: Promise<UserProfile> | null = null
let profileGeneration = 0
const profileListeners = new Set<() => void>()
export const getCachedCurrentUser = () => currentUser
export const getServerCurrentUser = () => null
export function subscribeCurrentUser(listener: () => void) { profileListeners.add(listener); return () => { profileListeners.delete(listener) } }
function publishCurrentUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return
  currentUser = user
  for (const listener of profileListeners) listener()
}
export function clearCurrentUser() { inflightReads.clear(); profileGeneration++; currentUserRequest = null; publishCurrentUser(null) }

export async function getCurrentUser(): Promise<UserProfile> {
  if (typeof window !== 'undefined' && currentUserRequest) return currentUserRequest
  const generation = profileGeneration
  const request = (async () => {
    const response = await apiFetch('/usuarios/me')
    if (!response.ok) {
      if (response.status === 401 && generation === profileGeneration) clearCurrentUser()
      throw new Error('Não foi possível carregar o perfil.')
    }
    const user: UserProfile = await response.json()
    if (generation === profileGeneration) publishCurrentUser(user)
    return user
  })()
  if (typeof window !== 'undefined') currentUserRequest = request
  try { return await request } finally { if (currentUserRequest === request) currentUserRequest = null }
}

export async function updateCurrentUser(data: Partial<Pick<UserProfile, 'nome' | 'email' | 'foto' | 'avatar'>> & { senha?: string; senhaAtual?: string }): Promise<UserProfile> {
  const generation = profileGeneration
  const response = await apiFetch('/usuarios/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Não foi possível salvar o perfil.')
  }
  const user: UserProfile = await response.json()
  if (generation === profileGeneration) publishCurrentUser(user)
  return user
}

export type TrackSummary = {
  id: string
  titulo: string
  descricao: string
  nivel: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
  bloqueada: boolean
  totalAulas: number
  percentual: number
}

export type TrackDetail = TrackSummary & {
  aulas: Array<{ id: string; titulo: string; ordem: number; concluida: boolean }>
}

type ResumoResultados = {
  conclusao: number
  feitas: number
  melhorResultado: { id: string; titulo: string; acertos: number; totalQuestoes: number; percentual: number } | null
  piorResultado: { id: string; titulo: string; acertos: number; totalQuestoes: number; percentual: number } | null
}

export type Desempenho = {
  aulas: { total: number; concluidas: number }
  simulacoes: ResumoResultados & { realizadas: number; acertos: number; erros: number; totalQuestoes: number; aproveitamento: number | null }
  avaliacoes: ResumoResultados & {
    acertos: number
    erros: number
    realizadas: number
    media: number | null
    melhor: number | null
    notas: Array<{ nivel: string; nota: number }>
    melhorNivel: { nivel: string; media: number; tentativas: number } | null
    nivelRevisar: { nivel: string; media: number; tentativas: number } | null
  }
  ritmo: { diasSeguidos: number; aulasNaSemana: number; semana: Array<{ dia: string; aulas: number }> }
  phishing: { respondidos: number; acertos: number; porTipo: Array<{ tipo: 'EMAIL' | 'SMS' | 'SITE' | 'REDE_SOCIAL'; total: number; acertos: number }> }
  quizzes: {
    conclusao: number
    feitos: number
    tentativas: number
    acertos: number
    erros: number
    media: number | null
    melhor: { quizId: string; titulo: string; acertos: number; totalQuestoes: number; percentual: number } | null
    pior: { quizId: string; titulo: string; acertos: number; totalQuestoes: number; percentual: number } | null
  }
}

export async function getDesempenho(): Promise<Desempenho> {
  const response = await apiFetch('/usuarios/me/desempenho', { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível carregar seu desempenho.')
  return response.json()
}
