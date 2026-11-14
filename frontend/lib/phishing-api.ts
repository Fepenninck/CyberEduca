import {
  activityRequest,
  jsonBody,
  type AulaAtividade,
} from "./activities-api";

export type TipoCenario = "EMAIL" | "SMS" | "SITE" | "REDE_SOCIAL";
export const nomesTipos: Record<TipoCenario, string> = {
  EMAIL: "E-mail",
  SMS: "SMS",
  SITE: "Site",
  REDE_SOCIAL: "Rede social",
};
export type CenarioResumo = {
  tentativas?: Array<{ id: string; acertou: boolean }>;
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoCenario;
  aulaId: string;
  aula: AulaAtividade & { trilha?: { nivel: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO' } };
};
export type CenarioDetalhe = CenarioResumo & { conteudoMensagem: string; resultado?: ResultadoPhishing | null };
export type ResultadoPhishing = {
  respostaEhPhishing?: boolean;
  tentativaId: string;
  cenarioId: string;
  acertou: boolean;
  concluido: boolean;
  progressoAtualizado: boolean;
  explicacao: string;
};
export const listarCenarios = (aulaId?: string, signal?: AbortSignal) =>
  activityRequest<CenarioResumo[]>(
    `/phishing/cenarios${aulaId ? `?${new URLSearchParams({ aulaId })}` : ""}`,
    { signal },
  );
export const buscarCenario = (id: string, signal?: AbortSignal) =>
  activityRequest<CenarioDetalhe>(
    `/phishing/cenarios/${encodeURIComponent(id)}`,
    { signal },
  );
export const enviarRespostaCenario = (
  id: string,
  respostaEhPhishing: boolean,
  tentativa?: { refazer: boolean; tentativaId: string },
) =>
  activityRequest<ResultadoPhishing>(
    `/phishing/cenarios/${encodeURIComponent(id)}/tentativas`,
    jsonBody({ respostaEhPhishing, ...tentativa }),
  );
