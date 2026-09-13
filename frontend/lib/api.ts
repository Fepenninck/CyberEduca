export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

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
