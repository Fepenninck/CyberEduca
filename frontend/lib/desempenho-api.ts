import { activityRequest } from "./activities-api";
export type Desempenho = {
  usuarioId: string;
  nome: string;
  totalAulasConcluidas: number;
  totalQuizzesConcluidos: number;
  totalSimulacoesConcluidas: number;
  totalProvasRealizadas: number;
  mediaNotas: number;
  aulas: Array<{ id: string; dataConclusao: string; aula: { titulo: string } }>;
  quizzes: Array<{
    id: string;
    totalAcertos: number;
    totalQuestoes: number;
    concluidoEm: string;
    quiz: { titulo: string };
  }>;
  simulacoes: Array<{
    id: string;
    acertou: boolean;
    concluidoEm: string;
    cenario: { titulo: string };
  }>;
  provas: Array<{
    id: string;
    nota: number;
    totalAcertos: number;
    totalQuestoes: number;
    concluidoEm: string;
    prova: { titulo: string };
  }>;
};
export const buscarMeuDesempenho = () =>
  activityRequest<Desempenho>("/desempenho/me");
export const buscarDesempenhoUsuario = (id: string) =>
  activityRequest<Desempenho>(
    `/admin/desempenho/usuarios/${encodeURIComponent(id)}`,
  );
export const buscarRelatorios = () =>
  activityRequest<Desempenho[]>("/admin/relatorios");
