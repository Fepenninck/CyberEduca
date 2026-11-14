import { beginLoading } from './loading-state'
import { waitForBackend } from './backend-ready'
export const API_URL = '/api'

export const apiFetch = async (path: string, options?: RequestInit) => {
  const end = beginLoading(path === '/auth/login' ? 'Entrando na sua conta…' : 'Carregando…')
  try {
  if (path === '/auth/login' || path === '/auth/register') await waitForBackend()
  const request = () => fetch(`${API_URL}${path}`, { ...options, credentials: 'include' })
  let response = await request()
  if (response.headers.get('content-type')?.includes('text/html')) {
    if ((options?.method ?? 'GET').toUpperCase() === 'GET' && !options?.signal?.aborted) {
      await waitForBackend()
      if (options?.signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
      response = await request()
    }
    if (response.headers.get('content-type')?.includes('text/html')) return Response.json({ message: 'O servidor está iniciando. Tente novamente em instantes.' }, { status: 503 })
  }
  if (response.ok && options?.method?.toUpperCase() === 'POST' && /^\/aulas\/[^/]+\/concluir$/.test(path) && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('learning-progress-updated'))
  }
  if (response.ok && ((path === '/auth/logout' || path === '/auth/login') && options?.method?.toUpperCase() === 'POST' || path === '/usuarios/me' && options?.method?.toUpperCase() === 'DELETE')) clearCurrentUser()
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
export function clearCurrentUser() { profileGeneration++; currentUserRequest = null; publishCurrentUser(null) }

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

export async function updateCurrentUser(data: Partial<Pick<UserProfile, 'nome' | 'email' | 'foto' | 'avatar'>> & { senha?: string }): Promise<UserProfile> {
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

export type Desempenho = {
  aulas: { total: number; concluidas: number }
  simulacoes: { realizadas: number; acertos: number; totalQuestoes: number; aproveitamento: number | null }
  avaliacoes: { realizadas: number; media: number | null; melhor: number | null }
  ritmo: { diasSeguidos: number; aulasNaSemana: number; semana: Array<{ dia: string; aulas: number }> }
  phishing: { respondidos: number; acertos: number; porTipo: Array<{ tipo: 'EMAIL' | 'SMS' | 'SITE' | 'REDE_SOCIAL'; total: number; acertos: number }> }
  quizzes: {
    feitos: number
    media: number | null
    melhor: { quizId: string; titulo: string; percentual: number } | null
    revisar: { quizId: string; titulo: string; percentual: number } | null
  }
}

export async function getDesempenho(): Promise<Desempenho> {
  const response = await apiFetch('/usuarios/me/desempenho', { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível carregar seu desempenho.')
  return response.json()
}
