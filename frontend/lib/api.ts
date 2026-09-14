const browserApiUrl = typeof window === 'undefined'
  ? 'http://localhost:3002'
  : `${window.location.protocol}//${window.location.hostname}:3002`

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? browserApiUrl

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
