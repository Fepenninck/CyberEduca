import { activityRequest, jsonBody } from './activities-api'
import type { QuestaoProva, ResultadoTentativa } from './provas-api'
export type Level = 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
export const levelTitles: Record<Level, string> = { BASICO: 'Básico', INTERMEDIARIO: 'Intermediário', AVANCADO: 'Avançado' }
export type CertificationStatus = {
  nivel: Level; provaId: string; totalAulas: number; aulasConcluidas: number; aulasCompletas: boolean;
  desbloqueado: boolean; aprovado: boolean; conquistada: boolean; conquistadaEm: string | null;
  notaMinima: number; totalQuestoes: number; bancoPronto: boolean; podeIniciar: boolean;
  motivo: string | null; proximaTentativaEm: string | null;
  ultimaTentativa: { id: string; nota: number; totalAcertos: number; totalQuestoes: number; concluidoEm: string } | null;
}
export type CertificationPaper = { nivel: Level; titulo: string; notaMinima: number; totalQuestoes: number; token: string; questoes: QuestaoProva[] }
export const listarCertificacoes = (signal?: AbortSignal) => activityRequest<CertificationStatus[]>('/certificacoes', { signal })
export const iniciarCertificacao = (nivel: Level, signal?: AbortSignal) => activityRequest<CertificationPaper>(`/certificacoes/${nivel}/iniciar`, { ...jsonBody({}), signal })
export const enviarCertificacao = (nivel: Level, token: string, respostas: { questaoId: string; alternativaId: string }[]) => activityRequest<ResultadoTentativa>(`/certificacoes/${nivel}/tentativas`, jsonBody({ token, respostas }))
