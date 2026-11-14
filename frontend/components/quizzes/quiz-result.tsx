import { CheckCircle2, CircleHelp } from "lucide-react";
import type { QuizDetalhe, ResultadoQuiz } from "@/lib/quizzes-api";
export function QuizResult({
  quiz,
  resultado,
}: {
  quiz: QuizDetalhe;
  resultado: ResultadoQuiz;
}) {
  return (
    <section className="activity-panel quiz-result" aria-labelledby="quiz-result-title">
      <div className="quiz-result-summary">
        <h2 id="quiz-result-title" tabIndex={-1}>
          Prática concluída
        </h2>
        <p>
          Você acertou{" "}
          <strong>
            {resultado.totalAcertos} de {resultado.totalQuestoes}
          </strong>{" "}
          questões. Confira as explicações abaixo.
        </p>
      </div>
      <div className="quiz-feedback-list">
        {resultado.feedback.map((item, index) => {
          const questao = quiz.questoes.find((q) => q.id === item.questaoId);
          return (
            <article
              className={`quiz-feedback ${item.acertou ? "is-correct" : ""}`}
              key={item.questaoId}
            >
              <span className="activity-feedback-label">
                {item.acertou ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <CircleHelp size={18} />
                )}
                {item.acertou ? "Você acertou" : "Vamos revisar"} na questão {index + 1}
              </span>
              <h3>{questao?.enunciado}</h3>
              <p>
                <strong>Sua resposta:</strong>{" "}
                {
                  questao?.alternativas.find((a) => a.id === item.alternativaId)
                    ?.texto
                }
              </p>
              {!item.acertou && (
                <p>
                  <strong>Alternativa correta:</strong>{" "}
                  {
                    questao?.alternativas.find(
                      (a) => a.id === item.alternativaCorretaId,
                    )?.texto
                  }
                </p>
              )}
              <p className="feedback-explanation">{item.explicacao}</p>
            </article>
          );
        })}
      </div>
      <p className="activity-footnote">
        Sua tentativa foi registrada. Esta prática não gera nota nem conclui a aula automaticamente.
      </p>
    </section>
  );
}
