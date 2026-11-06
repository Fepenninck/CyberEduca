import {
  activityRequest,
  jsonBody,
  type AulaAtividade,
} from "./activities-api";

export type QuizResumo = {
  id: string;
  titulo: string;
  descricao: string;
  aulaId: string;
  aula: AulaAtividade;
  _count: { questoes: number };
};
export type QuestaoQuiz = {
  id: string;
  enunciado: string;
  ordem: number;
  alternativas: { id: string; texto: string; ordem: number }[];
};
export type QuizDetalhe = Omit<QuizResumo, "_count"> & {
  questoes: QuestaoQuiz[];
};
export type RespostaQuiz = { questaoId: string; alternativaId: string };
export type ResultadoQuiz = {
  tentativaId: string;
  quizId: string;
  totalQuestoes: number;
  totalAcertos: number;
  concluido: boolean;
  progressoAtualizado: boolean;
  feedback: {
    questaoId: string;
    alternativaId: string;
    alternativaCorretaId: string;
    acertou: boolean;
    explicacao: string;
  }[];
};
export const listarQuizzes = (aulaId?: string, signal?: AbortSignal) =>
  activityRequest<QuizResumo[]>(
    `/quizzes${aulaId ? `?${new URLSearchParams({ aulaId })}` : ""}`,
    { signal },
  );
export const buscarQuiz = (id: string, signal?: AbortSignal) =>
  activityRequest<QuizDetalhe>(`/quizzes/${encodeURIComponent(id)}`, {
    signal,
  });
export const enviarRespostasQuiz = (id: string, respostas: RespostaQuiz[]) =>
  activityRequest<ResultadoQuiz>(
    `/quizzes/${encodeURIComponent(id)}/tentativas`,
    jsonBody({ respostas }),
  );
