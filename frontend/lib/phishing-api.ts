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
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoCenario;
  aulaId: string;
  aula: AulaAtividade;
};
export type CenarioDetalhe = CenarioResumo & { conteudoMensagem: string };
export type ResultadoPhishing = {
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
) =>
  activityRequest<ResultadoPhishing>(
    `/phishing/cenarios/${encodeURIComponent(id)}/tentativas`,
    jsonBody({ respostaEhPhishing }),
  );
