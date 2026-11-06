"use client";
import { useEffect, useRef, useState } from "react";
import {
  enviarRespostasQuiz,
  type QuizDetalhe,
  type ResultadoQuiz,
} from "@/lib/quizzes-api";
import { ActivityError } from "@/components/activities/activity-state";
import { QuizQuestion } from "./quiz-question";
import { QuizResult } from "./quiz-result";
import { correctLocalQuiz } from "@/lib/library-activities";
export function QuizPlayer({ quiz }: { quiz: QuizDetalhe }) {
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lock = useRef(false);
  const answered = quiz.questoes.filter((q) => respostas[q.id]).length;
  useEffect(() => {
    if (resultado) document.getElementById("quiz-result-title")?.focus();
  }, [resultado]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current || answered !== quiz.questoes.length) return;
    lock.current = true;
    setSending(true);
    setError(null);
    try {
      if (quiz.id.startsWith("local-") || quiz.id.startsWith("avaliacao-")) {
        const result = correctLocalQuiz(
          quiz,
          quiz.questoes.map((q) => ({
            questaoId: q.id,
            alternativaId: respostas[q.id],
          })),
        );
        try {
          localStorage.setItem(
            `cybereduca-result-${quiz.id}`,
            JSON.stringify(result),
          );
        } catch {
          /* A prática continua disponível sem armazenamento. */
        }
        setResultado(result);
        return;
      }
      setResultado(
        await enviarRespostasQuiz(
          quiz.id,
          quiz.questoes.map((q) => ({
            questaoId: q.id,
            alternativaId: respostas[q.id],
          })),
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause
          : new Error("Não foi possível enviar suas respostas."),
      );
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  if (resultado)
    return (
      <QuizResult
        quiz={quiz}
        resultado={resultado}
        restart={() => {
          setResultado(null);
          setRespostas({});
          setError(null);
        }}
      />
    );
  if (!quiz.questoes.length)
    return (
      <p className="activity-panel">
        Este quiz ainda não possui questões disponíveis.
      </p>
    );
  return (
    <form onSubmit={submit} className="activity-panel">
      <div className="quiz-progress">
        <span>
          {answered} de {quiz.questoes.length} respondidas
        </span>
        <span>Sem limite de tempo</span>
      </div>
      <progress
        className="activity-progress"
        value={answered}
        max={quiz.questoes.length}
        aria-label="Questões respondidas"
      />
      {quiz.questoes.map((questao, index) => (
        <QuizQuestion
          key={questao.id}
          questao={questao}
          index={index}
          value={respostas[questao.id]}
          onChange={(id) =>
            setRespostas((previous) => ({ ...previous, [questao.id]: id }))
          }
          disabled={sending}
        />
      ))}
      {error && <ActivityError error={error} />}
      <div className="activity-actions">
        <button
          disabled={sending || answered !== quiz.questoes.length}
          className="dashboard-button-primary"
          type="submit"
        >
          {sending ? "Enviando respostas..." : "Concluir quiz"}
        </button>
        <p className="activity-muted">
          {answered !== quiz.questoes.length
            ? "Responda todas as questões para concluir."
            : "Tudo pronto para conferir suas respostas."}
        </p>
      </div>
    </form>
  );
}
