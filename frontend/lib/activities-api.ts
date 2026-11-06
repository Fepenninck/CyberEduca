import { apiFetch } from "./api";

export class ActivityApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function activityRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await apiFetch(path, { cache: "no-store", ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      response.status === 401
        ? "Entre na sua conta para continuar."
        : response.status === 429
          ? "Limite de consultas atingido. Aguarde antes de tentar novamente."
          : Array.isArray(body?.message)
            ? body.message.join(" ")
            : body?.message;
    throw new ActivityApiError(
      typeof message === "string"
        ? message
        : "Não foi possível concluir a operação. Tente novamente.",
      response.status,
    );
  }
  return response.json();
}

export const jsonBody = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
export type AulaAtividade = { id: string; titulo: string };
