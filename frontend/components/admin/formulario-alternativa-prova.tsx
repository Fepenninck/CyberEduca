"use client";

import { useState, type FormEvent } from "react";
import type { AlternativaProvaInput } from "@/lib/admin-api";

type Props = { onSubmit: (dados: AlternativaProvaInput) => Promise<void> };
export function FormularioAlternativaProva({ onSubmit }: Props) {
  const [texto, setTexto] = useState("");
  const [isCorreta, setIsCorreta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setErro(null);
    if (!texto.trim()) {
      setErro("Escreva o texto da alternativa.");
      return;
    }
    setSalvando(true);
    try {
      await onSubmit({ texto: texto.trim(), isCorreta });
      setTexto("");
      setIsCorreta(false);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar a alternativa.",
      );
    } finally {
      setSalvando(false);
    }
  }
  return (
    <form onSubmit={enviar} className="admin-answer-append" noValidate>
      <fieldset disabled={salvando}>
        <label className="admin-editor-field">
          Texto da alternativa
          <textarea
            className="admin-control"
            rows={2}
            maxLength={1000}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Escreva uma das opções de resposta."
          />
        </label>
        <div className="admin-answer-append-actions">
          <label>
            <input
              type="checkbox"
              checked={isCorreta}
              onChange={(event) => setIsCorreta(event.target.checked)}
            />
            Esta é a resposta correta
          </label>
          <button
            type="submit"
            className="admin-action-secondary"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Adicionar alternativa"}
          </button>
        </div>
      </fieldset>
      {erro && (
        <p role="alert" className="admin-notice" data-tone="danger">
          {erro}
        </p>
      )}
    </form>
  );
}
