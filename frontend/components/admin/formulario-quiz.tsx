"use client";

import { useState, type FormEvent } from "react";
import type { AdminAula, QuizAdminInput } from "@/lib/admin-api";
import {
  AbasEditorAvaliacao,
  PreviaAvaliacao,
  type AbaAvaliacao,
} from "./assessment-editor";

type Props = {
  aulas: AdminAula[];
  onSubmit: (dados: QuizAdminInput) => Promise<void>;
  initialValues?: Partial<QuizAdminInput>;
  submitLabel?: string;
  disabled?: boolean;
  mostrarPrevia?: boolean;
};
export function FormularioQuiz({
  aulas,
  onSubmit,
  initialValues,
  submitLabel = "Criar quiz e continuar",
  disabled = false,
  mostrarPrevia = true,
}: Props) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? "");
  const [aulaId, setAulaId] = useState(initialValues?.aulaId ?? "");
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando || disabled) return;
    setErro(null);
    if (!titulo.trim() || !descricao.trim() || !aulaId) {
      setErro("Preencha o título, a descrição e a aula vinculada.");
      setAba("informacoes");
      return;
    }
    setSalvando(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        aulaId,
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar o quiz.",
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
        <h3>Informações do quiz</h3>
        <p>
          Defina os dados e a aula relacionada. Depois, organize as questões e o
          feedback.
        </p>
      </div>
      <fieldset disabled={salvando || disabled}>
        {mostrarPrevia && (
          <AbasEditorAvaliacao value={aba} onChange={setAba} questoes={false} />
        )}
        <div className="admin-editor-body">
          {aba === "informacoes" ? (
            <div className="admin-field-grid">
              <label className="admin-field-wide">
                Título do quiz
                <input
                  className="admin-control"
                  maxLength={160}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Revise seus conhecimentos sobre senhas"
                />
              </label>
              <label className="admin-field-wide">
                Descrição e orientações
                <textarea
                  className="admin-control"
                  rows={3}
                  maxLength={2000}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Apresente o objetivo deste quiz para o aluno."
                />
              </label>
              <label className="admin-field-wide">
                Aula vinculada
                <select
                  className="admin-control"
                  value={aulaId}
                  onChange={(e) => setAulaId(e.target.value)}
                  disabled={!aulas.length}
                >
                  <option value="" disabled>
                    Selecione uma aula
                  </option>
                  {aulas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.trilha.titulo} · {a.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <PreviaAvaliacao
              titulo={titulo}
              descricao={descricao}
              vinculo={aulas.find((a) => a.id === aulaId)?.titulo}
              questoes={[]}
              detalhe="Adicione as questões após criar o quiz"
            />
          )}
        </div>
      </fieldset>
      {!aulas.length && (
        <p className="admin-notice" data-tone="warning">
          Cadastre uma aula antes de criar quizzes.
        </p>
      )}
      {erro && (
        <p className="admin-notice" data-tone="danger" role="alert">
          {erro}
        </p>
      )}
      <div className="admin-form-actions">
        <button
          className="admin-action-primary"
          type="submit"
          disabled={salvando || disabled || !aulas.length}
        >
          {salvando ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
