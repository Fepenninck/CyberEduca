export const API_URL = '/api'

export const apiFetch = (path: string, options?: RequestInit) => fetch(`${API_URL}${path}`, {
  ...options,
  credentials: 'include',
})

export type UserProfile = {
  id: string
  nome: string
  email: string
  foto?: string | null
  avatar?: string | null
  papel: string
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiFetch('/usuarios/me')
  if (!response.ok) throw new Error('Não foi possível carregar o perfil.')
  return response.json()
}

export async function updateCurrentUser(data: Partial<Pick<UserProfile, 'nome' | 'email' | 'foto' | 'avatar'>> & { senha?: string }): Promise<UserProfile> {
  const response = await apiFetch('/usuarios/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Não foi possível salvar o perfil.')
  }
  return response.json()
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
  comparativo: { aulasConcluidas: number; totalAlunos: number; percentil: number | null }
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
