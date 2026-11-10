'use client'

import type { QuestaoProva } from '@/lib/provas-api'

type Props = {
  questao: QuestaoProva
  numero: number
  selecionada?: string
  onSelecionar: (questaoId: string, alternativaId: string) => void
}

export function ProvaQuestion({ questao, numero, selecionada, onSelecionar }: Props) {
  return (
    <fieldset className="quiz-question">
      <legend className="quiz-enunciado">
        {numero}. {questao.enunciado}
      </legend>
      <div className="quiz-options">
        {questao.alternativas.map((alternativa) => (
          <label
            key={alternativa.id}
            className={`quiz-option${selecionada === alternativa.id ? ' is-selected' : ''}`}
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
  )
}
