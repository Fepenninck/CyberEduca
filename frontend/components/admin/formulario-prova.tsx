"use client";

import { useState, type FormEvent } from "react";
import type {
  AdminTrilha,
  ProvaInput,
  QuestaoProvaInput,
  StatusPublicacao,
} from "@/lib/admin-api";
import {
  prepararQuestoesProva,
  validarQuestoesEditoriais,
  type QuestaoEditorial,
} from "@/lib/admin-assessment";
import {
  AbasEditorAvaliacao,
  PreviaAvaliacao,
  QuestoesRascunhoEditor,
  type AbaAvaliacao,
} from "./assessment-editor";

type Props = {
  trilhas: AdminTrilha[];
  onSubmit: (dados: ProvaInput) => Promise<void>;
  initialValues?: Partial<ProvaInput>;
  submitLabel?: string;
  permitirQuestoes?: boolean;
  mostrarPrevia?: boolean;
};
export function FormularioProva({
  trilhas,
  onSubmit,
  initialValues,
  submitLabel = "Salvar prova",
  permitirQuestoes = true,
  mostrarPrevia = true,
}: Props) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? "");
  const [trilhaId, setTrilhaId] = useState(
    initialValues?.trilhaId ?? trilhas[0]?.id ?? "",
  );
  const [status, setStatus] = useState<StatusPublicacao>(
    initialValues?.status ?? "RASCUNHO",
  );
  const [questoes, setQuestoes] = useState<QuestaoProvaInput[]>(
    initialValues?.questoes ?? [],
  );
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  const [foco, setFoco] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setErro(null);
    if (!titulo.trim() || !descricao.trim() || !trilhaId) {
      setErro("Preencha o título, a descrição e a trilha da prova.");
      setAba("informacoes");
      return;
    }
    if (permitirQuestoes) {
      const falha = validarQuestoesEditoriais(questoes, status === "PUBLICADO");
      if (falha) {
        setErro(falha.mensagem);
        setAba("questoes");
        setFoco(falha.indice);
        return;
      }
    }
    setSalvando(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        trilhaId,
        status,
        ...(permitirQuestoes
          ? { questoes: prepararQuestoesProva(questoes) }
          : {}),
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar a prova.",
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
      aria-busy={salvando}
    >
      <div className="admin-form-heading">
        <h3>Dados da prova</h3>
        <p>
          Organize a avaliação, confira as respostas e revise o conteúdo antes
          de publicar.
        </p>
      </div>
      <fieldset disabled={salvando}>
        {mostrarPrevia && (
          <AbasEditorAvaliacao
            value={aba}
            onChange={setAba}
            questoes={permitirQuestoes}
          />
        )}
        <div className="admin-editor-body">
          {aba === "informacoes" && (
            <div className="admin-field-grid">
              <label className="admin-field-wide">
                Título da prova
                <input
                  className="admin-control"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={160}
                  placeholder="Ex.: Segurança de contas e senhas"
                />
              </label>
              <label className="admin-field-wide">
                Descrição e orientações
                <textarea
                  className="admin-control"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={2000}
                  placeholder="Explique o objetivo da prova e o que o aluno precisa saber antes de começar."
                />
              </label>
              <label>
                Trilha vinculada
                <select
                  className="admin-control"
                  value={trilhaId}
                  onChange={(e) => setTrilhaId(e.target.value)}
                  disabled={!trilhas.length}
                >
                  <option value="" disabled>
                    Selecione uma trilha
                  </option>
                  {trilhas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Situação
                <select
                  className="admin-control"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as StatusPublicacao)
                  }
                >
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="PUBLICADO">Publicada</option>
                  <option value="ARQUIVADO">Arquivada</option>
                </select>
                <small>
                  Use rascunho enquanto estiver preparando a avaliação.
                </small>
              </label>
            </div>
          )}
          {aba === "questoes" && permitirQuestoes && (
            <QuestoesRascunhoEditor
              value={questoes}
              onChange={(value) =>
                setQuestoes(
                  value.map((item) => ({
                    ...item,
                    tipo: item.tipo ?? "MULTIPLA_ESCOLHA",
                  })),
                )
              }
              foco={foco}
              onFocoConsumido={() => setFoco(null)}
            />
          )}
          {aba === "previa" && (
            <PreviaAvaliacao
              titulo={titulo}
              descricao={descricao}
              vinculo={trilhas.find((t) => t.id === trilhaId)?.titulo}
              questoes={questoes}
              detalhe={
                status === "RASCUNHO"
                  ? "Rascunho"
                  : status === "PUBLICADO"
                    ? "Publicada"
                    : "Arquivada"
              }
            />
          )}
        </div>
      </fieldset>
      {!trilhas.length && (
        <p className="admin-notice" data-tone="warning">
          Cadastre uma trilha antes de criar uma prova.
        </p>
      )}
      {erro && (
        <p className="admin-notice" data-tone="danger" role="alert">
          {erro}
        </p>
      )}
      <div className="admin-form-actions">
        {permitirQuestoes && <span className="admin-form-help">{questoes.length} questões nesta avaliação</span>}
        <button
          type="submit"
          className="admin-action-primary"
          disabled={salvando || !trilhas.length}
        >
          {salvando ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
