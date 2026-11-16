import type { QuestaoProvaInput, QuestaoSimulacaoInput } from "./admin-api";

export type QuestaoEditorial = {
  enunciado: string;
  tipo?: "MULTIPLA_ESCOLHA" | "DISSERTATIVA";
  contexto?: string;
  explicacao?: string;
  alternativas?: { texto: string; isCorreta: boolean }[];
};
export type FalhaQuestao = { indice: number; mensagem: string };
export function validarQuestoesEditoriais(
  questoes: QuestaoEditorial[],
  exigirQuestoes = false,
  exigirExplicacao = false,
): FalhaQuestao | null {
  if (exigirQuestoes && !questoes.length)
    return {
      indice: 0,
      mensagem: "Adicione pelo menos uma questão antes de continuar.",
    };
  for (let indice = 0; indice < questoes.length; indice++) {
    const questao = questoes[indice];
    const prefixo = `Questão ${indice + 1}: `;
    if (!questao.enunciado.trim())
      return { indice, mensagem: prefixo + "preencha o enunciado." };
    if (questao.enunciado.length > 3000)
      return {
        indice,
        mensagem: prefixo + "o enunciado deve ter até 3.000 caracteres.",
      };
    if (exigirExplicacao && !questao.explicacao?.trim())
      return {
        indice,
        mensagem: prefixo + "preencha a explicação da resposta.",
      };
    if ((questao.contexto?.length ?? 0) > 10000)
      return {
        indice,
        mensagem:
          prefixo + "reduza o conteúdo do cenário para até 10.000 caracteres.",
      };
    if (questao.tipo !== "DISSERTATIVA") {
      const alternativas = questao.alternativas ?? [];
      if (
        alternativas.length < 2 ||
        alternativas.some((item) => !item.texto.trim())
      )
        return {
          indice,
          mensagem: prefixo + "preencha pelo menos duas alternativas.",
        };
      if (alternativas.filter((item) => item.isCorreta).length !== 1)
        return {
          indice,
          mensagem: prefixo + "selecione uma única alternativa correta.",
        };
    }
  }
  return null;
}
export function prepararQuestoesProva(
  questoes: QuestaoEditorial[],
): QuestaoProvaInput[] {
  return questoes.map((item) => ({
    ...item,
    enunciado: item.enunciado.trim(),
    tipo: item.tipo ?? "MULTIPLA_ESCOLHA",
    alternativas:
      item.tipo === "DISSERTATIVA"
        ? []
        : (item.alternativas ?? []).map((alt) => ({
            ...alt,
            texto: alt.texto.trim(),
          })),
  }));
}
export function prepararQuestoesSimulacao(
  questoes: QuestaoEditorial[],
): QuestaoSimulacaoInput[] {
  return questoes.map((item) => ({
    ...item,
    enunciado: item.enunciado.trim(),
    contexto: item.contexto?.trim() ?? "",
    explicacao: item.explicacao?.trim() ?? "",
    alternativas: (item.alternativas ?? []).map((alt) => ({
      ...alt,
      texto: alt.texto.trim(),
    })),
  }));
}
export function separarContextoEditorial(contexto = "") {
  const [titulo, ...linhas] = contexto.split("\n");
  return { titulo, texto: linhas.join("\n") };
}
export function juntarContextoEditorial(titulo: string, texto: string) {
  return texto ? `${titulo}\n${texto}` : titulo;
}
