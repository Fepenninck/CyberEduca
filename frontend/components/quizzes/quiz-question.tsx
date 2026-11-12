import type { QuestaoQuiz } from "@/lib/quizzes-api";
export function QuizQuestion({
  questao,
  index,
  value,
  onChange,
  disabled,
}: {
  questao: QuestaoQuiz;
  index: number;
  value?: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="quiz-question" disabled={disabled}>
      <legend>
        <span className="activity-kicker">
          Questão {index + 1}
        </span>
        <span className="quiz-enunciado">{questao.enunciado}</span>
      </legend>
      <div className="quiz-options">
        {questao.alternativas.map((alternativa, i) => (
          <label
            key={alternativa.id}
            className={`quiz-option ${value === alternativa.id ? "is-selected" : ""}`}
          >
            <input
              type="radio"
              name={`questao-${questao.id}`}
              value={alternativa.id}
              checked={value === alternativa.id}
              onChange={() => onChange(alternativa.id)}
              required
            />
            <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
            <span>{alternativa.texto}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
