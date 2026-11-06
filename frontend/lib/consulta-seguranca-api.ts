import { activityRequest, jsonBody } from "./activities-api";
export type ConsultaDominio = {
  dominio: string;
  resultado: "SEM_DETECCOES" | "SUSPEITO" | "MALICIOSO" | "SEM_DADOS";
  deteccoesMaliciosas: number;
  deteccoesSuspeitas: number;
  consultadoEm: string;
};
export const consultarDominio = (dominio: string) =>
  activityRequest<ConsultaDominio>(
    "/seguranca/consultar-dominio",
    jsonBody({ dominio }),
  );
