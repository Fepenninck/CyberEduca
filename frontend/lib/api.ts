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
  papel: string
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiFetch('/usuarios/me')
  if (!response.ok) throw new Error('Não foi possível carregar o perfil.')
  return response.json()
}

export async function updateCurrentUser(data: Partial<Pick<UserProfile, 'nome' | 'email' | 'foto'>> & { senha?: string }): Promise<UserProfile> {
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
