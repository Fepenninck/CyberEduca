"use client";

import { useState, type FormEvent } from "react";
import type { QuestaoProvaInput } from "@/lib/admin-api";
import {
  AbasEditorAvaliacao,
  CamposQuestaoEditorial,
  PreviaQuestaoEditorial,
  type AbaAvaliacao,
} from "./assessment-editor";

type Props = {
  onSubmit: (
    dados: Pick<QuestaoProvaInput, "enunciado" | "tipo">,
  ) => Promise<void>;
};
export function FormularioQuestaoProva({ onSubmit }: Props) {
  const [questao, setQuestao] = useState<QuestaoProvaInput>({
    enunciado: "",
    tipo: "MULTIPLA_ESCOLHA",
  });
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setErro(null);
    if (!questao.enunciado.trim()) {
      setErro("Preencha o enunciado da questão.");
      setAba("informacoes");
      return;
    }
    setSalvando(true);
    try {
      await onSubmit({
        enunciado: questao.enunciado.trim(),
        tipo: questao.tipo,
      });
      setQuestao({ enunciado: "", tipo: "MULTIPLA_ESCOLHA" });
      setAba("informacoes");
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível adicionar a questão.",
      );
    } finally {
      setSalvando(false);
    }
  }
  return (
    <form
      className="admin-editor admin-assessment-form"
      onSubmit={enviar}
      noValidate
    >
      <div className="admin-form-heading">
        <h3>Nova questão</h3>
        <p>
          Defina o tipo e a pergunta. As alternativas podem ser adicionadas
          depois de salvar.
        </p>
      </div>
      <fieldset disabled={salvando}>
        <AbasEditorAvaliacao value={aba} onChange={setAba} questoes={false} />
        <div className="admin-editor-body">
          {aba === "informacoes" ? (
            <CamposQuestaoEditorial
              value={questao}
              onChange={(value) =>
                setQuestao({ ...value, tipo: value.tipo ?? "MULTIPLA_ESCOLHA" })
              }
              tipo
              alternativas={false}
            />
          ) : (
            <PreviaQuestaoEditorial questao={questao} numero={1} />
          )}
        </div>
      </fieldset>
      {erro && (
        <p className="admin-notice" data-tone="danger" role="alert">
          {erro}
        </p>
      )}
      <div className="admin-form-actions">
        <button className="admin-action-primary" disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar questão"}
        </button>
      </div>
    </form>
  );
}
