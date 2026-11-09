"use client";

import type { QuestaoProva } from "@/lib/provas-api";

type Props = {
  questao: QuestaoProva;
  numero: number;
  selecionada?: string;
  onSelecionar: (questaoId: string, alternativaId: string) => void;
};

export function ProvaQuestion({
  questao,
  numero,
  selecionada,
  onSelecionar,
}: Props) {
  return (
    <fieldset className="prova-questao">
      <legend className="prova-questao-enunciado">
        {numero}. {questao.enunciado}
      </legend>
      <div className="prova-alternativas">
        {questao.tipo === "DISSERTATIVA" && (
          <textarea
            aria-label={`Resposta da questão ${numero}`}
            value={selecionada ?? ""}
            maxLength={5000}
            onChange={(event) => onSelecionar(questao.id, event.target.value)}
            className="min-h-36 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
          />
        )}
        {questao.alternativas.map((alternativa) => (
          <label
            key={alternativa.id}
            className={`prova-alternativa${selecionada === alternativa.id ? " is-selected" : ""}`}
          >
            <input
              type="radio"
              name={`questao-${questao.id}`}
              value={alternativa.id}
              checked={selecionada === alternativa.id}
              onChange={() => onSelecionar(questao.id, alternativa.id)}
            />
            <span>{alternativa.texto}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
